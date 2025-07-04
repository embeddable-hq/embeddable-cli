import { Logger } from './logger.js';
import { ApiError } from '../types/api-types.js';

export class CLIError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'CLIError';
  }
}

export function handleError(error: unknown): void {
  if (error instanceof CLIError) {
    Logger.error(error.message);
    if (error.code) {
      Logger.debug(`Error code: ${error.code}`);
    }
  } else if (isApiError(error)) {
    Logger.error(`API Error: ${error.message}`);
    Logger.debug(`Status: ${error.statusCode}`);
  } else if (error instanceof Error) {
    Logger.error(error.message);
    Logger.debug(error.stack || '');
  } else {
    Logger.error('An unknown error occurred');
    Logger.debug(String(error));
  }

  process.exit(1);
}

function isApiError(error: any): error is ApiError {
  return error && 
    typeof error.error === 'string' && 
    typeof error.message === 'string' && 
    typeof error.statusCode === 'number';
}

export function formatApiError(response: any): string {
  if (response.error && response.message) {
    return response.message;
  }
  
  if (typeof response === 'string') {
    return response;
  }

  return 'An error occurred while communicating with the API';
}