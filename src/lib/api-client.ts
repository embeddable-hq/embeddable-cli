import { ConfigManager } from './config-manager.js';
import { 
  Region,
  Connection, 
  Environment, 
  Embeddable, 
  SecurityToken,
  ConnectionConfigInput
} from '../types/api-types.js';
import { CLIError, formatApiError } from '../utils/errors.js';
import { Logger } from '../utils/logger.js';

export class EmbeddableAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, region: Region) {
    this.apiKey = apiKey;
    this.baseUrl = ConfigManager.getApiUrl(region);
  }

  private async request<T>(
    endpoint: string,
    options: any = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    Logger.debug(`API Request: ${options.method || 'GET'} ${url}`);
    if (options.body) {
      Logger.debug(`Request Body: ${options.body}`);
    }
    
    const response = await fetch(url, {
      method: options.method,
      body: options.body,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...(options.headers || {}),
      },
    });

    // Check if the response has content
    const contentLength = response.headers.get('content-length');
    const hasContent = contentLength && contentLength !== '0' && response.status !== 204;
    
    let data: any = null;
    if (hasContent) {
      try {
        data = await response.json();
      } catch (e) {
        // If JSON parsing fails on a successful response, just return null
        if (response.ok) {
          Logger.debug('API Response: Empty or non-JSON response');
          return null as any;
        }
        throw new CLIError(`API Error (${response.status}): Invalid response format`);
      }
    }

    if (!response.ok) {
      Logger.debug(`API Error Response (${response.status}): ${JSON.stringify(data, null, 2)}`);
      const errorMessage = data ? formatApiError(data) : `HTTP ${response.status} error`;
      throw new CLIError(`API Error (${response.status}): ${errorMessage}`);
    }
    
    if (data !== null) {
      Logger.debug(`API Response: ${JSON.stringify(data, null, 2)}`);
    } else {
      Logger.debug('API Response: Success (no content)');
    }

    return data as T;
  }

  // Connection methods
  async createConnection(config: ConnectionConfigInput): Promise<Connection> {
    // Structure the request body according to API requirements
    const requestBody: any = {
      name: config.name,
      type: config.type,
    };

    if (config.type === 'bigquery') {
      requestBody.credentials = config.config;
    } else {
      // For postgres, mysql, redshift, snowflake
      requestBody.credentials = {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,  // API expects 'user' not 'username'
        password: config.password,
      };
    }

    return this.request<Connection>('/connections', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  async listConnections(): Promise<Connection[]> {
    const response = await this.request<{ connections: string[] }>('/connections');
    
    // If API returns just connection names, we need to fetch details for each
    const connectionPromises = response.connections.map(async (name) => {
      try {
        return await this.getConnection(name);
      } catch (error) {
        // If we can't get details, return a minimal object
        return {
          id: name,
          name: name,
          type: 'unknown',
          createdAt: '',
          updatedAt: '',
        } as Connection;
      }
    });
    
    return Promise.all(connectionPromises);
  }

  async getConnection(name: string): Promise<Connection> {
    return this.request<Connection>(`/connections/${encodeURIComponent(name)}`);
  }

  async updateConnection(name: string, config: Partial<ConnectionConfigInput>): Promise<Connection> {
    return this.request<Connection>(`/connections/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async deleteConnection(name: string): Promise<void> {
    await this.request<void>(`/connections/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }

  async testConnection(configOrName: string | any): Promise<{ success: boolean; message?: string; error?: string }> {
    let endpoint: string;
    let body: string | undefined;
    
    if (typeof configOrName === 'string') {
      endpoint = `/connections/${encodeURIComponent(configOrName)}/test`;
    } else if (configOrName.id) {
      endpoint = `/connections/${encodeURIComponent(configOrName.id)}/test`;
    } else {
      // Test new connection config
      endpoint = '/connections/test';
      const requestBody: any = {
        name: configOrName.name,
        type: configOrName.type,
      };

      if (configOrName.type === 'bigquery') {
        requestBody.credentials = configOrName.config;
      } else {
        // For postgres, mysql, redshift, snowflake
        requestBody.credentials = {
          host: configOrName.host,
          port: configOrName.port,
          database: configOrName.database,
          user: configOrName.username,  // API expects 'user' not 'username'
          password: configOrName.password,
        };
      }
      
      body = JSON.stringify(requestBody);
    }
    
    // Make the request directly to handle errors specially for test endpoints
    const url = `${this.baseUrl}${endpoint}`;
    
    Logger.debug(`API Request: POST ${url}`);
    if (body) {
      Logger.debug(`Request Body: ${body}`);
    }
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: body,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      const data = await response.json() as any;
      
      if (!response.ok) {
        Logger.debug(`API Error Response (${response.status}): ${JSON.stringify(data, null, 2)}`);
        
        // For test endpoints, return failure instead of throwing
        const errorMessage = data.underlyingErrorMessage || data.errorMessage || 'Connection test failed';
        return {
          success: false,
          error: errorMessage,
          message: errorMessage
        };
      }
      
      Logger.debug(`API Response: ${JSON.stringify(data, null, 2)}`);
      
      // If we get here, the test was successful
      return {
        success: true,
        message: data.message || 'Connection test successful'
      };
      
    } catch (error: any) {
      // Network or other errors
      Logger.debug(`Connection test failed with error: ${error.message}`);
      
      return {
        success: false,
        error: error.message || 'Connection test failed',
        message: error.message || 'Connection test failed'
      };
    }
  }

  // Environment methods
  async createEnvironment(name: string, datasourceMappings: Record<string, string>): Promise<Environment> {
    return this.request<Environment>('/environments', {
      method: 'POST',
      body: JSON.stringify({ name, datasourceMappings }),
    });
  }

  async listEnvironments(): Promise<Environment[]> {
    return this.request<Environment[]>('/environments');
  }

  async getEnvironment(name: string): Promise<Environment> {
    return this.request<Environment>(`/environments/${encodeURIComponent(name)}`);
  }

  async updateEnvironment(
    name: string, 
    updates: { name?: string; datasourceMappings?: Record<string, string> }
  ): Promise<Environment> {
    return this.request<Environment>(`/environments/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteEnvironment(name: string): Promise<void> {
    await this.request<void>(`/environments/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }

  // Embeddable methods
  async listEmbeddables(): Promise<Embeddable[]> {
    const response = await this.request<{ embeddables: Embeddable[] }>('/embeddables');
    return response.embeddables;
  }

  async generateSecurityToken(
    embeddableId: string,
    options: {
      expiryInSeconds?: number;
      securityContext?: Record<string, any>;
      user?: { id: string; email?: string };
      environment?: string;
    } = {}
  ): Promise<SecurityToken> {
    const payload = {
      embeddableId,
      expiryInSeconds: options.expiryInSeconds || 3600,
      securityContext: options.securityContext || {},
      user: options.user || { id: 'cli-user' },
      environment: options.environment,
    };

    const response = await this.request<{ token: string }>('/security-token', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const expiresAt = new Date(Date.now() + (payload.expiryInSeconds * 1000)).toISOString();
    
    return {
      token: response.token,
      expiresAt,
    };
  }

  // Utility method to validate API key
  async validateApiKey(): Promise<boolean> {
    try {
      // Try to list embeddables as a simple validation
      await this.listEmbeddables();
      return true;
    } catch (error) {
      return false;
    }
  }

}