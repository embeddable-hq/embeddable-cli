import { defineCommand } from 'citty';
import * as p from '@clack/prompts';
import Table from 'cli-table3';
import { ConfigManager } from '../lib/config-manager.js';
import { EmbeddableAPI } from '../lib/api-client.js';
import { ClackPrompts } from '../lib/clack-prompts.js';
import { Validators } from '../lib/validators.js';
import { Logger } from '../utils/logger.js';
import { handleError, CLIError } from '../utils/errors.js';
import { ConnectionConfigInput } from '../types/api-types.js';

export function createDatabaseCommand() {
  return defineCommand({
    meta: {
      name: 'database',
      description: 'Manage database connections',
    },
    async run({ args, subCommand }) {
      // If no subcommand provided, show help without error
      if (!subCommand) {
        console.log('Usage: embed database <command>\n');
        console.log('Commands:');
        console.log('  connect    Create a new database connection');
        console.log('  list       List all connections');
        console.log('  test       Test a connection');
        console.log('  update     Update a connection');
        console.log('  remove     Remove a connection');
        console.log('\nRun "embed database <command> --help" for more information');
        return; // Exit cleanly with code 0
      }
    },
    subCommands: {
      connect: defineCommand({
        meta: {
          description: 'Add a new database connection',
        },
        args: {
          json: {
            type: 'string',
            description: 'Connection configuration as JSON',
          },
          file: {
            type: 'string',
            description: 'Path to JSON file with connection configuration',
          },
          'skip-test': {
            type: 'boolean',
            description: 'Skip connection test before creating',
          },
        },
        async run({ args }) {
          try {
            const api = await getAuthenticatedAPI();
            
            let connectionConfig: ConnectionConfigInput;
            
            if (args.json) {
              connectionConfig = JSON.parse(args.json as string);
              Validators.validateConnectionConfig(connectionConfig);
            } else if (args.file) {
              const fs = await import('fs');
              const content = fs.readFileSync(args.file as string, 'utf-8');
              connectionConfig = JSON.parse(content);
              Validators.validateConnectionConfig(connectionConfig);
            } else {
              // Interactive mode
              const config = ConfigManager.getConfig()!;
              const regionDisplay = ConfigManager.getRegionDisplay(config.region);
              p.intro(`🔌 Connect to a database [${regionDisplay}]`);
              
              const dbType = await ClackPrompts.selectDatabaseType();
              
              if (['snowflake', 'redshift'].includes(dbType)) {
                p.note('For advanced database configurations, use --json or --file options');
                const jsonConfig = await ClackPrompts.getJsonInput('Enter the full connection configuration as JSON:');
                connectionConfig = jsonConfig;
              } else {
                connectionConfig = await ClackPrompts.getConnectionDetails(dbType);
              }
              
              Validators.validateConnectionConfig(connectionConfig);
            }
            
            if (!args['skip-test']) {
              const spinner = p.spinner();
              spinner.start(`Testing connection to ${connectionConfig.name}...`);
              
              const testResult = await api.testConnection(connectionConfig);
              
              if (!testResult.success) {
                const errorDetail = (testResult as any).error || testResult.message || 'Unknown error';
                spinner.stop(`Connection test failed: ${errorDetail}`, 1);
                
                // Provide helpful guidance based on the error
                if (errorDetail.includes('ECONNREFUSED')) {
                  p.note(
                    'Could not connect to the database server.\n' +
                    'Please check:\n' +
                    '• The host and port are correct\n' +
                    '• The database server is running\n' +
                    '• Firewall rules allow the connection',
                    '💡 Connection refused'
                  );
                } else if (errorDetail.toLowerCase().includes('authentication') || errorDetail.includes('password') || errorDetail.includes('user')) {
                  p.note(
                    'Authentication failed.\n' +
                    'Please check:\n' +
                    '• Username is correct\n' +
                    '• Password is correct\n' +
                    '• User has permission to connect',
                    '🔐 Authentication error'
                  );
                } else if (errorDetail.toLowerCase().includes('database')) {
                  p.note(
                    'Database error.\n' +
                    'Please check:\n' +
                    '• Database name is correct\n' +
                    '• Database exists\n' +
                    '• User has access to this database',
                    '🗄️ Database error'
                  );
                } else if (errorDetail.toLowerCase().includes('timeout')) {
                  p.note(
                    'Connection timed out.\n' +
                    'Please check:\n' +
                    '• Network connectivity to the host\n' +
                    '• Firewall rules\n' +
                    '• Database server is accepting connections',
                    '⏱️ Timeout error'
                  );
                } else {
                  p.note(
                    'Please verify your connection details:\n' +
                    '• Host and port\n' +
                    '• Database name\n' +
                    '• Username and password\n' +
                    '• Network connectivity',
                    '⚠️ Connection test failed'
                  );
                }
                
                const continueAnyway = await p.confirm({
                  message: 'Do you want to save this connection anyway?',
                  initialValue: false,
                });
                
                if (p.isCancel(continueAnyway) || !continueAnyway) {
                  p.cancel('Connection creation cancelled');
                  process.exit(1);
                }
              } else {
                spinner.stop('Connection test successful', 0);
              }
            }
            
            const spinner = p.spinner();
            spinner.start('Creating connection...');
            const connection = await api.createConnection(connectionConfig);
            spinner.stop(`Connection "${connection.name}" created successfully`, 0);
            
            p.outro('✅ Database connected!');
          } catch (error) {
            handleError(error);
          }
        },
      }),
      list: defineCommand({
        meta: {
          description: 'List all database connections',
        },
        async run() {
          try {
            const api = await getAuthenticatedAPI();
            
            const config = ConfigManager.getConfig()!;
            const regionDisplay = ConfigManager.getRegionDisplay(config.region);
            
            const spinner = p.spinner();
            spinner.start(`Fetching connections from ${regionDisplay}...`);
            const connections = await api.listConnections();
            spinner.stop();
            
            if (connections.length === 0) {
              Logger.info('No database connections found.');
              Logger.info('Run "embed database connect" to add a connection.');
              return;
            }
            
            const table = new Table({
              head: ['ID', 'Name', 'Type', 'Host', 'Database'],
              colWidths: [38, 20, 12, 30, 20],
            });
            
            connections.forEach((conn) => {
              const credentials = (conn as any).credentials || {};
              table.push([
                conn.id || conn.name,  // Use name as ID if no ID field
                conn.name,
                conn.type,
                credentials.host || 'N/A',
                credentials.database || 'N/A',
              ]);
            });
            
            console.log(table.toString());
            console.log(`\nRegion: ${regionDisplay}`);
          } catch (error) {
            handleError(error);
          }
        },
      }),
      test: defineCommand({
        meta: {
          description: 'Test a database connection',
        },
        args: {
          connectionId: {
            type: 'positional',
            description: 'Connection ID to test',
            required: false,
          },
        },
        async run({ args }) {
          try {
            const api = await getAuthenticatedAPI();
            
            let connectionId = args.connectionId;
            
            if (!connectionId) {
              const connections = await api.listConnections();
              
              if (connections.length === 0) {
                Logger.warn('No database connections found.');
                return;
              }
              
              connectionId = await ClackPrompts.selectConnection(
                connections.map(c => ({ id: c.id || c.name, name: c.name }))
              );
            }
            
            const spinner = p.spinner();
            spinner.start('Testing connection...');
            
            const result = await api.testConnection({ id: connectionId } as any);
            
            if (result.success) {
              spinner.stop('Connection test successful', 0);
            } else {
              spinner.stop(`Connection test failed: ${result.error}`, 1);
            }
          } catch (error) {
            handleError(error);
          }
        },
      }),
      remove: defineCommand({
        meta: {
          description: 'Remove a database connection',
        },
        args: {
          connectionId: {
            type: 'positional',
            description: 'Connection ID to remove',
            required: false,
          },
        },
        async run({ args }) {
          try {
            const api = await getAuthenticatedAPI();
            
            let connectionId = args.connectionId;
            
            if (!connectionId) {
              const connections = await api.listConnections();
              
              if (connections.length === 0) {
                Logger.warn('No database connections found.');
                return;
              }
              
              connectionId = await ClackPrompts.selectConnection(
                connections.map(c => ({ id: c.id || c.name, name: c.name }))
              );
            }
            
            const confirmed = await p.confirm({
              message: 'Are you sure you want to remove this connection?',
              initialValue: false,  // Default to "No"
            });
            
            if (p.isCancel(confirmed) || !confirmed) {
              p.cancel('Removal cancelled');
              return;
            }
            
            const spinner = p.spinner();
            spinner.start('Removing connection...');
            await api.deleteConnection(connectionId as string);
            spinner.stop('Connection removed successfully', 0);
            
            p.outro('✅ Connection removed');
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