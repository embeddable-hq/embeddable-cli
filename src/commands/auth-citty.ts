import { defineCommand } from 'citty';
import * as p from '@clack/prompts';
import { ConfigManager } from '../lib/config-manager.js';
import { EmbeddableAPI } from '../lib/api-client.js';
import { ClackPrompts } from '../lib/clack-prompts.js';
import { Validators } from '../lib/validators.js';
import { Logger } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';

export function createAuthCommand() {
  return defineCommand({
    meta: {
      name: 'auth',
      description: 'Manage authentication',
    },
    async run({ args: _args, subCommand }) {
      // If no subcommand provided, show help without error
      if (!subCommand) {
        console.log('Usage: embed auth <command>\n');
        console.log('Commands:');
        console.log('  login     Set or update API credentials');
        console.log('  logout    Clear stored credentials');
        console.log('  status    Show current authentication status');
        console.log('\nRun "embed auth <command> --help" for more information');
        return; // Exit cleanly with code 0
      }
    },
    subCommands: {
      login: defineCommand({
        meta: {
          description: 'Set or update API credentials',
        },
        async run() {
          try {
            p.intro('🔐 Login to Embeddable');
            
            const apiKey = await ClackPrompts.getApiKey();
            Validators.validateApiKey(apiKey);
            
            const region = await ClackPrompts.selectRegion();
            
            const spinner = p.spinner();
            spinner.start('Validating API key...');
            
            const api = new EmbeddableAPI(apiKey, region);
            const isValid = await api.validateApiKey();
            
            if (!isValid) {
              spinner.stop('Invalid API key', 1);
              process.exit(1);
            }
            
            spinner.stop('API key validated', 0);
            
            const config = { apiKey, region };
            ConfigManager.saveConfig(config);
            
            p.outro('✅ Configuration saved successfully!');
          } catch (error) {
            handleError(error);
          }
        },
      }),
      logout: defineCommand({
        meta: {
          description: 'Clear stored credentials',
        },
        async run() {
          try {
            const config = ConfigManager.getConfig();
            
            if (!config) {
              Logger.warn('No configuration found');
              return;
            }
            
            const confirmed = await ClackPrompts.confirmAction('Are you sure you want to logout?');
            
            if (!confirmed) {
              p.cancel('Logout cancelled');
              return;
            }
            
            ConfigManager.deleteConfig();
            p.outro('✅ Logged out successfully');
          } catch (error) {
            handleError(error);
          }
        },
      }),
      status: defineCommand({
        meta: {
          description: 'Show current authentication status',
        },
        async run() {
          try {
            const config = ConfigManager.getConfig();
            
            if (!config) {
              Logger.warn('Not authenticated. Run "embed auth login" to authenticate.');
              return;
            }
            
            const regionDisplay = ConfigManager.getRegionDisplay(config.region);
            
            Logger.info('Authentication Status:');
            Logger.log(`  Region: ${config.region} (${regionDisplay})`);
            Logger.log(`  API Key: ${'*'.repeat(config.apiKey.length - 4)}${config.apiKey.slice(-4)}`);
            if (config.defaultEnvironment) {
              Logger.log(`  Default Environment: ${config.defaultEnvironment}`);
            }
            
            const spinner = p.spinner();
            spinner.start('Testing API connection...');
            
            const api = new EmbeddableAPI(config.apiKey, config.region);
            try {
              await api.validateApiKey();
              spinner.stop('API connection successful', 0);
            } catch {
              spinner.stop('API connection failed - credentials may be invalid', 1);
            }
          } catch (error) {
            handleError(error);
          }
        },
      }),
    },
  });
}

export function createInitCommand() {
  return defineCommand({
    meta: {
      name: 'init',
      description: 'Initialize Embeddable CLI configuration',
    },
    async run() {
      try {
        const existingConfig = ConfigManager.getConfig();
        
        if (existingConfig) {
          const confirmed = await ClackPrompts.confirmAction('Configuration already exists. Do you want to overwrite it?');
          
          if (!confirmed) {
            p.cancel('Initialization cancelled');
            return;
          }
        }
        
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
        
        const config = { apiKey, region };
        ConfigManager.saveConfig(config);
        
        p.outro('✅ Configuration saved!');
        
        Logger.info('\nYou\'re all set! Here are some commands to get started:');
        Logger.log('  embed setup               - Interactive setup wizard (recommended)');
        Logger.log('  embed database connect    - Add a database connection');
        Logger.log('  embed env create          - Create an environment');
        Logger.log('  embed list                - List available embeddables');
        Logger.log('  embed --help              - Show all available commands');
      } catch (error) {
        handleError(error);
      }
    },
  });
}