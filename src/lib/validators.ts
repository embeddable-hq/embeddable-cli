import { ConnectionConfigInput } from '../types/api-types.js';

export class Validators {
  static isValidJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  static validateConnectionConfig(config: any): config is ConnectionConfigInput {
    if (!config.name || typeof config.name !== 'string') {
      throw new Error('Connection name is required and must be a string');
    }

    const validTypes = ['postgres', 'mysql', 'bigquery', 'snowflake', 'redshift'];
    if (!config.type || !validTypes.includes(config.type)) {
      throw new Error(`Connection type must be one of: ${validTypes.join(', ')}`);
    }

    // Type-specific validation
    if (config.type === 'postgres' || config.type === 'mysql' || config.type === 'redshift') {
      if (!config.host || !config.database || !config.username || !config.password) {
        throw new Error(`${config.type} connections require: host, database, username, password`);
      }
    } else if (config.type === 'bigquery') {
      if (!config.config || typeof config.config !== 'object') {
        throw new Error('BigQuery connections require service account JSON in config field');
      }
    } else if (config.type === 'snowflake') {
      if (!config.host || !config.database || !config.username || !config.password) {
        throw new Error('Snowflake connections require: host, database, username, password');
      }
    }

    return true;
  }

  static validateEnvironmentName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      throw new Error('Environment name is required');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      throw new Error('Environment name can only contain letters, numbers, hyphens, and underscores');
    }

    return true;
  }

  static validateApiKey(apiKey: string): boolean {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is required');
    }

    if (apiKey.length < 10) {
      throw new Error('Invalid API key format');
    }

    return true;
  }
}