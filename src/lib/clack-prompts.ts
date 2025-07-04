import * as p from '@clack/prompts';
import { Region, ConnectionConfigInput } from '../types/api-types.js';
import { Logger } from '../utils/logger.js';

export class ClackPrompts {
  static async getApiKey(): Promise<string> {
    const result = await p.text({
      message: 'Enter your Embeddable API key:',
      placeholder: 'Your API key',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'API key is required';
        }
        return undefined;
      },
    });

    if (p.isCancel(result)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    return result as string;
  }

  static async selectRegion(): Promise<Region> {
    const result = await p.select({
      message: 'Select your region:',
      options: [
        { label: 'United States', value: 'US' },
        { label: 'Europe', value: 'EU' },
        { label: 'Development', value: 'Dev' },
      ],
    });

    if (p.isCancel(result)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    return result as Region;
  }

  static async selectEnvironment(environments: string[]): Promise<string> {
    const result = await p.select({
      message: 'Select an environment:',
      options: environments.map(env => ({ label: env, value: env })),
    });

    if (p.isCancel(result)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    return result as string;
  }

  static async confirmAction(message: string): Promise<boolean> {
    const result = await p.confirm({
      message,
    });

    if (p.isCancel(result)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    return result as boolean;
  }

  static async selectDatabaseType(): Promise<string> {
    const result = await p.select({
      message: 'Select database type:',
      options: [
        { label: 'PostgreSQL', value: 'postgres' },
        { label: 'MySQL', value: 'mysql' },
        { label: 'BigQuery', value: 'bigquery' },
        { label: 'Snowflake', value: 'snowflake' },
        { label: 'Redshift', value: 'redshift' },
      ],
    });

    if (p.isCancel(result)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    return result as string;
  }

  static async getConnectionDetails(type: string): Promise<ConnectionConfigInput> {
    if (type === 'bigquery') {
      return this.getBigQueryDetails();
    }

    const group = await p.group({
      name: () => p.text({
        message: 'Connection name:',
        placeholder: 'my-database',
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Connection name is required';
          }
          return undefined;
        },
      }),
      host: () => p.text({
        message: 'Host:',
        placeholder: type === 'snowflake' ? 'account.snowflakecomputing.com' : 'localhost',
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Host is required';
          }
          return undefined;
        },
      }),
      port: () => p.text({
        message: 'Port:',
        placeholder: this.getDefaultPort(type),
        defaultValue: this.getDefaultPort(type),
      }),
      database: () => p.text({
        message: 'Database name:',
        placeholder: 'my_database',
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Database name is required';
          }
          return undefined;
        },
      }),
      username: () => p.text({
        message: 'Username:',
        placeholder: 'user',
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Username is required';
          }
          return undefined;
        },
      }),
      password: () => p.password({
        message: 'Password:',
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Password is required';
          }
          return undefined;
        },
      }),
    }, {
      onCancel: () => {
        p.cancel('Operation cancelled');
        process.exit(0);
      },
    });

    return {
      type,
      name: group.name as string,
      host: group.host as string,
      port: parseInt(group.port as string, 10),
      database: group.database as string,
      username: group.username as string,
      password: group.password as string,
    };
  }

  static async getBigQueryDetails(): Promise<ConnectionConfigInput> {
    p.note('For BigQuery, you need to provide service account credentials as JSON');

    const jsonInput = await p.text({
      message: 'Paste your service account JSON (or path to JSON file):',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Service account JSON is required';
        }
        try {
          JSON.parse(value);
          return undefined;
        } catch {
          // Check if it's a file path
          if (value.includes('.json')) {
            return undefined; // Assume it's a file path
          }
          return 'Invalid JSON format';
        }
      },
    });

    if (p.isCancel(jsonInput)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    let serviceAccountJson: any;
    try {
      // Try to parse as JSON first
      serviceAccountJson = JSON.parse(jsonInput);
    } catch {
      // If not JSON, try to read as file
      try {
        const fs = await import('fs');
        const content = fs.readFileSync(jsonInput.trim(), 'utf-8');
        serviceAccountJson = JSON.parse(content);
      } catch (error) {
        Logger.error('Failed to read or parse service account JSON');
        throw error;
      }
    }

    const name = await p.text({
      message: 'Connection name:',
      placeholder: 'my-bigquery',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Connection name is required';
        }
        return undefined;
      },
    });

    if (p.isCancel(name)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    return {
      type: 'bigquery',
      name: name as string,
      config: serviceAccountJson,
    };
  }

  static async getJsonInput(message: string): Promise<any> {
    const input = await p.text({
      message,
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'JSON input is required';
        }
        try {
          JSON.parse(value);
          return undefined;
        } catch {
          return 'Invalid JSON format';
        }
      },
    });

    if (p.isCancel(input)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    return JSON.parse(input);
  }

  static async selectConnection(connections: Array<{ id: string; name: string }>): Promise<string> {
    const result = await p.select({
      message: 'Select a connection:',
      options: connections.map(conn => ({ 
        label: conn.name, 
        value: conn.id 
      })),
    });

    if (p.isCancel(result)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    return result as string;
  }

  static async getEnvironmentName(): Promise<string> {
    const result = await p.text({
      message: 'Environment name:',
      placeholder: 'production',
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Environment name is required';
        }
        return undefined;
      },
    });

    if (p.isCancel(result)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    return result;
  }

  static async getTokenDetails(): Promise<{ expiresIn?: string; userId?: string; filters?: any }> {
    const group = await p.group({
      expiresIn: () => p.text({
        message: 'Token expiration (e.g., 1h, 24h, 7d):',
        placeholder: '24h',
        defaultValue: '24h',
      }),
      userId: () => p.text({
        message: 'User ID (optional):',
        placeholder: 'user123',
      }),
      hasFilters: () => p.confirm({
        message: 'Add row-level security filters?',
        initialValue: false,
      }),
    }, {
      onCancel: () => {
        p.cancel('Operation cancelled');
        process.exit(0);
      },
    });

    let filters: any = undefined;
    if (group.hasFilters) {
      const filterJson = await p.text({
        message: 'Enter filters as JSON:',
        placeholder: '{"org_id": 123}',
        validate: (value) => {
          if (!value) return undefined; // Optional
          try {
            JSON.parse(value);
            return undefined;
          } catch {
            return 'Invalid JSON format';
          }
        },
      });

      if (p.isCancel(filterJson)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }

      if (filterJson) {
        filters = JSON.parse(filterJson);
      }
    }

    return {
      expiresIn: group.expiresIn || undefined,
      userId: group.userId || undefined,
      filters,
    };
  }

  private static getDefaultPort(type: string): string {
    switch (type) {
      case 'postgres':
        return '5432';
      case 'mysql':
        return '3306';
      case 'redshift':
        return '5439';
      default:
        return '';
    }
  }
}