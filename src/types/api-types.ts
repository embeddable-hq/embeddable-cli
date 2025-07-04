// Extended types for API responses and CLI operations

export type Region = 'US' | 'EU' | 'Dev';

export interface Config {
  apiKey: string;
  region: Region;
  defaultEnvironment?: string;
}

// Simplified connection config for CLI input
export interface ConnectionConfigInput {
  name: string;
  type: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  config?: any; // For BigQuery service account JSON
}

// Full connection from API
export interface Connection {
  id?: string;
  name: string;
  type: string;
  credentials?: {
    host?: string;
    database?: string;
    user?: string;
    port?: number;
    [key: string]: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Environment {
  id: string;
  name: string;
  connections?: Record<string, string>; // datasource -> connectionId
  createdAt: string;
  updatedAt: string;
}

export interface Embeddable {
  id: string;
  name: string;
  lastPublishedAt?: any; // Can be empty object, string, or date object
}

export interface SecurityToken {
  token: string;
  embedUrl?: string;
  expiresAt?: string;
}

export interface TestConnectionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode?: number;
}