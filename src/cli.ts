#!/usr/bin/env node

import { defineCommand, runMain } from 'citty';
import { ConfigManager } from './lib/config-manager.js';
import { Logger } from './utils/logger.js';
import { handleError } from './utils/errors.js';
import { checkForUpdatesInBackground } from './lib/update-check.js';
import packageJson from '../package.json' with { type: 'json' };
const { version } = packageJson;

// Import command creators
import { createAuthCommand, createInitCommand } from './commands/auth-citty.js';
import { createDatabaseCommand } from './commands/database-citty.js';
import { createEnvironmentCommand } from './commands/environment-citty.js';
import { createListCommand, createTokenCommand, createPreviewCommand } from './commands/embeddable-citty.js';
import { createVersionCommand } from './commands/version-citty.js';

const main = defineCommand({
  meta: {
    name: 'embed',
    version,
    description: 'CLI tool for Embeddable API - manage database connections, environments, and dashboards',
  },
  args: {
    debug: {
      type: 'boolean',
      alias: 'd',
      description: 'Enable debug output',
    },
  },
  subCommands: {
    init: createInitCommand(),
    auth: createAuthCommand(),
    database: createDatabaseCommand(),
    env: createEnvironmentCommand(),
    list: createListCommand(),
    token: createTokenCommand(),
    preview: createPreviewCommand(),
    version: createVersionCommand(),
    config: defineCommand({
      meta: {
        description: 'Show current configuration',
      },
      run() {
        try {
          const config = ConfigManager.getConfig();
          
          if (!config) {
            Logger.warn('No configuration found. Run "embed init" to get started.');
            return;
          }

          const regionDisplay = ConfigManager.getRegionDisplay(config.region);
          
          Logger.info('Current Configuration:');
          Logger.log(`  Config Path: ${ConfigManager.getConfigPath()}`);
          Logger.log(`  Region: ${config.region} (${regionDisplay})`);
          Logger.log(`  API Key: ${'*'.repeat(config.apiKey.length - 4)}${config.apiKey.slice(-4)}`);
          if (config.defaultEnvironment) {
            Logger.log(`  Default Environment: ${config.defaultEnvironment}`);
          }
        } catch (error) {
          handleError(error);
        }
      },
    }),
  },
  setup({ args }) {
    if (args.debug) {
      process.env.DEBUG = '1';
    }
    
    // Check for updates in the background
    checkForUpdatesInBackground();
  },
});

// Intercept process.stderr to suppress specific error messages
const originalStderrWrite = process.stderr.write;
let suppressNextError = false;

(process.stderr.write as any) = function(...args: any[]): boolean {
  const str = args[0]?.toString() || '';
  
  // Check if this is the "No command specified" error
  if (str.includes('No command specified')) {
    suppressNextError = true;
    // Exit gracefully after a small delay to ensure help is shown
    setTimeout(() => process.exit(0), 10);
    return true;
  }
  
  // Skip ERROR prefix if we're suppressing
  if (suppressNextError && str.includes('ERROR')) {
    return true;
  }
  
  // @ts-expect-error - Complex monkey-patch for stderr interception
  return originalStderrWrite.apply(process.stderr, args);
};

runMain(main);