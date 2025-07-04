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
import { createListCommand, createTokenCommand } from './commands/embeddable-citty.js';
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

// Run the CLI and handle exit codes properly
runMain(main).then(() => {
  // Success - exit cleanly
  process.exit(0);
}).catch((error) => {
  // Check if this is just a "no command specified" error
  const errorStr = error?.toString() || '';
  if (errorStr.includes('No command specified') || errorStr.includes('Unknown command')) {
    // Help was shown, exit cleanly
    process.exit(0);
  }
  
  // For actual errors, show them and exit with 1
  if (error && !errorStr.includes('ELIFECYCLE')) {
    console.error(error);
  }
  process.exit(1);
});