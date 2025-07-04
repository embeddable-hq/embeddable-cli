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
    async run({ args, subCommand }) {
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
            
            const name = await ClackPrompts.getEnvironmentName();
            
            const connections = await api.listConnections();
            if (connections.length === 0) {
              Logger.error('No database connections found. Create a connection first with "embed database connect"');
              process.exit(1);
            }
            
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
              
              if (Object.keys(mappings).length > 0) {
                addMore = await ClackPrompts.confirmAction('Add another data source mapping?');
              }
            }
            
            const spinner = p.spinner();
            spinner.start('Creating environment...');
            
            const environment = await api.createEnvironment(name, mappings);
            
            spinner.stop(`Environment "${environment.name}" created successfully`, 0);
            
            const setAsDefault = await ClackPrompts.confirmAction('Set as default environment?');
            
            if (setAsDefault) {
              ConfigManager.updateConfig({ defaultEnvironment: environment.id });
              Logger.success('Default environment updated');
            }
            
            p.outro('✅ Environment created!');
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
              const dataSources = Object.keys((env as any).connections || {}).join(', ') || 'None';
              const isDefault = config?.defaultEnvironment === env.id ? '✓' : '';
              
              table.push([env.id, env.name, dataSources, isDefault]);
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