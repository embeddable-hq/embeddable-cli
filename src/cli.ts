#!/usr/bin/env node

import { defineCommand, runMain } from 'citty';
import { ConfigManager } from './lib/config-manager.js';
import { Logger } from './utils/logger.js';
import { handleError } from './utils/errors.js';
import { checkForUpdatesInBackground } from './lib/update-check.js';
import { EmbeddableAPI } from './lib/api-client.js';
import { ClackPrompts } from './lib/clack-prompts.js';
import { Validators } from './lib/validators.js';
import packageJson from '../package.json' with { type: 'json' };
const { version } = packageJson;

// Import command creators
import { createAuthCommand, createInitCommand } from './commands/auth-citty.js';
import { createDatabaseCommand } from './commands/database-citty.js';
import { createEnvironmentCommand } from './commands/environment-citty.js';
import { createListCommand, createTokenCommand } from './commands/embeddable-citty.js';
import { createVersionCommand } from './commands/version-citty.js';
import { createSetupCommand } from './commands/setup-citty.js';

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
    setup: createSetupCommand(),
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

// Check for first-time user before running main
async function checkFirstTimeUser() {
  const config = ConfigManager.getConfig();
  
  // Only trigger for "embed" with no arguments
  if (!config && process.argv.length === 2) {
    console.log('Welcome to Embeddable CLI! 👋\n');
    console.log('It looks like this is your first time using the CLI.');
    console.log('Let\'s get you set up with your API credentials.\n');
    
    // Import prompts at the top
    const prompts = await import('@clack/prompts');
    const p = prompts;
    
    // Run init flow inline (similar to what init command does)
    try {
      p.intro('Welcome to Embeddable CLI! 🎉');
      Logger.info('Let\'s get you set up.\n');
      
      const apiKey = await ClackPrompts.getApiKey();
      Validators.validateApiKey(apiKey);
      
      const region = await ClackPrompts.selectRegion();
      
      const spinner = p.spinner();
      spinner.start('Validating API key...');
      
      const api = new EmbeddableAPI(apiKey, region);
      const isValid = await api.validateApiKey();
      
      if (!isValid) {
        spinner.stop('Invalid API key', 1);
        Logger.error('Please check your API key and try again.');
        process.exit(1);
      }
      
      spinner.stop('API key validated', 0);
      
      const newConfig = { apiKey, region };
      ConfigManager.saveConfig(newConfig);
      
      p.outro('✅ Configuration saved!');
      
      // After init, ask if they want to run setup
      console.log('\n');
      const runSetup = await p.confirm({
        message: 'Would you like to run the interactive setup wizard to create your first database connection and environment?',
        initialValue: true,
      });
      
      if (!p.isCancel(runSetup) && runSetup) {
        console.log('\n');
        // Run setup command directly with proper context
        const setupCommand = createSetupCommand();
        await setupCommand.run?.({
          rawArgs: [],
          args: { _: [], 'skip-token': false },
          cmd: setupCommand
        });
      } else {
        // Show help
        console.log('\nYou can run "embed setup" anytime to use the interactive setup wizard.');
        console.log('Or use individual commands to configure your resources:\n');
        // Show help by running with --help flag
        process.argv.push('--help');
      }
    } catch (error) {
      handleError(error);
      process.exit(1);
    }
  }
}

// Main execution
(async () => {
  try {
    // Check for first-time user
    await checkFirstTimeUser();
    
    // Run the CLI
    await runMain(main);
    process.exit(0);
  } catch (error) {
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
  }
})();