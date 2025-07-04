import { defineCommand } from 'citty';
import * as p from '@clack/prompts';
import Table from 'cli-table3';
import { ConfigManager } from '../lib/config-manager.js';
import { EmbeddableAPI } from '../lib/api-client.js';
import { ClackPrompts } from '../lib/clack-prompts.js';
import { Logger } from '../utils/logger.js';
import { handleError, CLIError } from '../utils/errors.js';

export function createEnvironmentCommand() {
  return defineCommand({
    meta: {
      name: 'env',
      description: 'Manage environments',
    },
    async run({ args: _args, subCommand }) {
      // If no subcommand provided, show help without error
      if (!subCommand) {
        console.log('Usage: embed env <command>\n');
        console.log('Commands:');
        console.log('  create         Create a new environment');
        console.log('  list           List all environments');
        console.log('  set-default    Set the default environment');
        console.log('  remove         Remove an environment');
        console.log('\nRun "embed env <command> --help" for more information');
        return; // Exit cleanly with code 0
      }
    },
    subCommands: {
      create: defineCommand({
        meta: {
          description: 'Create a new environment',
        },
        async run() {
          try {
            const api = await getAuthenticatedAPI();
            
            const config = ConfigManager.getConfig()!;
            const regionDisplay = ConfigManager.getRegionDisplay(config.region);
            p.intro(`🌍 Create a new environment [${regionDisplay}]`);
            
            // Get existing environments to check for duplicates
            const existingEnvironments = await api.listEnvironments();
            const existingNames = existingEnvironments.map(env => env.name.toLowerCase());
            
            let name: string;
            let isValidName = false;
            
            while (!isValidName) {
              name = await ClackPrompts.getEnvironmentName();
              
              if (existingNames.includes(name.toLowerCase())) {
                Logger.warn(`An environment named "${name}" already exists.`);
                const continueWithNewName = await p.confirm({
                  message: 'Would you like to choose a different name?',
                  initialValue: true,
                });
                
                if (p.isCancel(continueWithNewName) || !continueWithNewName) {
                  p.cancel('Operation cancelled');
                  process.exit(0);
                }
              } else {
                isValidName = true;
              }
            }
            
            const connections = await api.listConnections();
            if (connections.length === 0) {
              Logger.error('No database connections found. Create a connection first with "embed database connect"');
              process.exit(1);
            }
            
            console.log('\nNow we\'ll map data sources to your database connection.');
            console.log('Data sources are logical names used in your Embeddable models.\n');
            
            const mappings: Record<string, string> = {};
            let addMore = true;
            
            while (addMore) {
              const dataSource = await p.text({
                message: 'Data source name:',
                placeholder: 'main_db',
                validate: (value) => {
                  if (!value || value.trim().length === 0) {
                    return 'Data source name is required';
                  }
                  return undefined;
                },
              });
              
              if (p.isCancel(dataSource)) {
                p.cancel('Operation cancelled');
                process.exit(0);
              }
              
              const connectionId = await ClackPrompts.selectConnection(
                connections.map(c => ({ id: c.id || c.name, name: c.name }))
              );
              mappings[dataSource] = connectionId;
              
              console.log(`  ✓ Mapped "${dataSource}" to connection "${connectionId}"`);
              
              if (Object.keys(mappings).length > 0) {
                addMore = await ClackPrompts.confirmAction('Add another data source mapping?');
              }
            }
            
            const spinner = p.spinner();
            spinner.start('Creating environment...');
            
            try {
              const environment = await api.createEnvironment(name!, mappings);
              
              spinner.stop(`Environment "${environment.name}" created successfully`, 0);
              
              const setAsDefault = await ClackPrompts.confirmAction('Set as default environment?');
              
              if (setAsDefault) {
                ConfigManager.updateConfig({ defaultEnvironment: environment.id || environment.name });
                Logger.success('Default environment updated');
              }
              
              p.outro('✅ Environment created!');
            } catch (error: any) {
              spinner.stop('Failed to create environment', 1);
              
              // Check if it's a duplicate name error (shouldn't happen with our check, but just in case)
              if (error.message && error.message.includes('already exists')) {
                Logger.error('An environment with this name already exists. Please try again with a different name.');
                Logger.info('Run "embed env list" to see existing environments.');
              } else {
                throw error; // Re-throw for normal error handling
              }
            }
          } catch (error) {
            handleError(error);
          }
        },
      }),
      list: defineCommand({
        meta: {
          description: 'List all environments',
        },
        async run() {
          try {
            const api = await getAuthenticatedAPI();
            const config = ConfigManager.getConfig();
            
            const regionDisplay = ConfigManager.getRegionDisplay(config!.region);
            
            const spinner = p.spinner();
            spinner.start(`Fetching environments from ${regionDisplay}...`);
            const environments = await api.listEnvironments();
            spinner.stop();
            
            if (environments.length === 0) {
              Logger.info('No environments found.');
              Logger.info('Run "embed env create" to create an environment.');
              return;
            }
            
            const table = new Table({
              head: ['ID', 'Name', 'Data Sources', 'Default'],
              colWidths: [38, 20, 40, 10],
            });
            
            environments.forEach((env) => {
              let dataSources = 'None';
              
              if ((env as any).datasources && Array.isArray((env as any).datasources)) {
                // Handle array format from API
                dataSources = (env as any).datasources
                  .map((ds: any) => ds.data_source)
                  .join(', ');
              } else if ((env as any).connections) {
                // Handle object format (legacy or different response)
                dataSources = Object.keys((env as any).connections).join(', ');
              }
              
              const isDefault = config?.defaultEnvironment === env.id || config?.defaultEnvironment === env.name ? '✓' : '';
              
              table.push([env.id || env.name, env.name, dataSources, isDefault]);
            });
            
            console.log(table.toString());
          } catch (error) {
            handleError(error);
          }
        },
      }),
      'set-default': defineCommand({
        meta: {
          description: 'Set the default environment',
        },
        args: {
          environmentId: {
            type: 'positional',
            description: 'Environment ID to set as default',
            required: false,
          },
        },
        async run({ args }) {
          try {
            const api = await getAuthenticatedAPI();
            
            let environmentId = args.environmentId;
            
            if (!environmentId) {
              const environments = await api.listEnvironments();
              
              if (environments.length === 0) {
                Logger.warn('No environments found.');
                return;
              }
              
              const selected = await p.select({
                message: 'Select default environment:',
                options: environments.map(env => ({
                  label: env.name,
                  value: env.id,
                })),
              });
              
              if (p.isCancel(selected)) {
                p.cancel('Operation cancelled');
                process.exit(0);
              }
              environmentId = selected as string;
            }
            
            ConfigManager.updateConfig({ defaultEnvironment: environmentId as string });
            p.outro('✅ Default environment updated');
          } catch (error) {
            handleError(error);
          }
        },
      }),
      remove: defineCommand({
        meta: {
          description: 'Remove an environment',
        },
        args: {
          environmentId: {
            type: 'positional',
            description: 'Environment ID to remove',
            required: false,
          },
        },
        async run({ args }) {
          try {
            const api = await getAuthenticatedAPI();
            
            let environmentId = args.environmentId;
            
            if (!environmentId) {
              const environments = await api.listEnvironments();
              
              if (environments.length === 0) {
                Logger.warn('No environments found.');
                return;
              }
              
              const selected = await p.select({
                message: 'Select environment to remove:',
                options: environments.map(env => ({
                  label: env.name,
                  value: env.id,
                })),
              });
              
              if (p.isCancel(selected)) {
                p.cancel('Operation cancelled');
                process.exit(0);
              }
              environmentId = selected as string;
            }
            
            const confirmed = await p.confirm({
              message: 'Are you sure you want to remove this environment?',
              initialValue: false,  // Default to "No"
            });
            
            if (p.isCancel(confirmed) || !confirmed) {
              p.cancel('Removal cancelled');
              return;
            }
            
            const spinner = p.spinner();
            spinner.start('Removing environment...');
            await api.deleteEnvironment(environmentId as string);
            spinner.stop('Environment removed successfully', 0);
            
            // Clear default if it was removed
            const config = ConfigManager.getConfig();
            if (config?.defaultEnvironment === environmentId) {
              ConfigManager.updateConfig({ defaultEnvironment: undefined });
            }
            
            p.outro('✅ Environment removed');
          } catch (error) {
            handleError(error);
          }
        },
      }),
    },
  });
}

async function getAuthenticatedAPI(): Promise<EmbeddableAPI> {
  const config = ConfigManager.getConfig();
  
  if (!config) {
    throw new CLIError('Not authenticated. Run "embed init" or "embed auth login" first.');
  }
  
  return new EmbeddableAPI(config.apiKey, config.region);
}