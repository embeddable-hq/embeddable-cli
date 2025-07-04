import { defineCommand } from 'citty';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { ConfigManager } from '../lib/config-manager.js';
import { EmbeddableAPI } from '../lib/api-client.js';
import { ClackPrompts } from '../lib/clack-prompts.js';
import { Validators } from '../lib/validators.js';
import { Logger } from '../utils/logger.js';
import { handleError } from '../utils/errors.js';
import { ConnectionConfigInput } from '../types/api-types.js';

export function createSetupCommand() {
  return defineCommand({
    meta: {
      name: 'setup',
      description: 'Interactive setup wizard for new users',
    },
    args: {
      'skip-token': {
        type: 'boolean',
        description: 'Skip security token generation',
      },
    },
    async run({ args }) {
      try {
        // Welcome message
        console.log();
        p.intro(chalk.bold('🚀 Welcome to Embeddable CLI Setup!'));
        
        console.log('\nThis wizard will help you:');
        console.log('  ✓ Configure your API connection');
        console.log('  ✓ Set up database connections');
        console.log('  ✓ Create environments for your data');
        if (!args['skip-token']) {
          console.log('  ✓ Generate security tokens (optional)');
        }
        console.log();

        // Step 1: Authentication
        let config = ConfigManager.getConfig();
        let api: EmbeddableAPI;
        
        if (!config) {
          console.log(chalk.bold('\n📌 Step 1: Authentication'));
          console.log('First, let\'s connect to your Embeddable account.\n');
          
          const apiKey = await ClackPrompts.getApiKey();
          Validators.validateApiKey(apiKey);
          
          const region = await ClackPrompts.selectRegion();
          
          const spinner = p.spinner();
          spinner.start('Validating API key...');
          
          api = new EmbeddableAPI(apiKey, region);
          const isValid = await api.validateApiKey();
          
          if (!isValid) {
            spinner.stop('Invalid API key', 1);
            Logger.error('Please check your API key and try again.');
            process.exit(1);
          }
          
          spinner.stop('API key validated', 0);
          
          config = { apiKey, region };
          ConfigManager.saveConfig(config);
          
          Logger.success('✓ Authentication configured');
        } else {
          console.log(chalk.bold('\n✓ Already authenticated'));
          const regionDisplay = ConfigManager.getRegionDisplay(config.region);
          console.log(`  Region: ${regionDisplay}`);
          api = new EmbeddableAPI(config.apiKey, config.region);
        }

        // Step 2: Database Connection
        console.log(chalk.bold('\n📊 Step 2: Database Connection'));
        console.log('Database connections allow Embeddable to securely query your data.');
        console.log('  • Your connection details are encrypted');
        console.log('  • Embeddable never stores your actual data');
        console.log('  • Use read-only database users for security\n');

        const spinner = p.spinner();
        spinner.start('Checking existing connections...');
        const connections = await api.listConnections();
        spinner.stop();

        let selectedConnection: string | undefined;

        if (connections.length > 0) {
          console.log(`Found ${connections.length} existing connection(s).\n`);
          
          const useExisting = await p.select({
            message: 'Would you like to:',
            options: [
              { value: 'existing', label: 'Use an existing connection' },
              { value: 'new', label: 'Create a new connection' },
            ],
          });

          if (p.isCancel(useExisting)) {
            p.cancel('Setup cancelled');
            process.exit(0);
          }

          if (useExisting === 'existing') {
            selectedConnection = await ClackPrompts.selectConnection(
              connections.map(c => ({ id: c.id || c.name, name: c.name }))
            );
          }
        }

        if (!selectedConnection) {
          console.log('\nLet\'s create a database connection.');
          
          const dbType = await ClackPrompts.selectDatabaseType();
          
          let connectionConfig: ConnectionConfigInput;
          
          if (['snowflake', 'redshift'].includes(dbType)) {
            p.note('For advanced database configurations, you\'ll need to provide a JSON configuration.');
            const jsonConfig = await ClackPrompts.getJsonInput('Enter the full connection configuration as JSON:');
            connectionConfig = jsonConfig;
          } else {
            connectionConfig = await ClackPrompts.getConnectionDetails(dbType);
          }
          
          Validators.validateConnectionConfig(connectionConfig);
          
          // Test connection
          const testSpinner = p.spinner();
          testSpinner.start(`Testing connection to ${connectionConfig.name}...`);
          
          const testResult = await api.testConnection(connectionConfig);
          
          if (!testResult.success) {
            const errorDetail = (testResult as any).error || testResult.message || 'Unknown error';
            testSpinner.stop(`Connection test failed: ${errorDetail}`, 1);
            
            const continueAnyway = await p.confirm({
              message: 'Connection test failed. Save it anyway?',
              initialValue: false,
            });
            
            if (p.isCancel(continueAnyway) || !continueAnyway) {
              p.cancel('Setup cancelled');
              process.exit(1);
            }
          } else {
            testSpinner.stop('Connection test successful', 0);
          }
          
          // Create connection
          const createSpinner = p.spinner();
          createSpinner.start('Creating connection...');
          const connection = await api.createConnection(connectionConfig);
          createSpinner.stop(`Connection "${connection.name}" created`, 0);
          
          selectedConnection = connection.id || connection.name;
        }

        // Step 3: Environment
        console.log(chalk.bold('\n🌍 Step 3: Environment Setup'));
        console.log('Environments map your data sources to database connections.');
        console.log('This allows you to:');
        console.log('  • Use different databases for dev/staging/production');
        console.log('  • Switch data sources without changing code');
        console.log('  • Manage multi-tenant architectures\n');

        const envSpinner = p.spinner();
        envSpinner.start('Checking existing environments...');
        const environments = await api.listEnvironments();
        envSpinner.stop();

        let environmentId: string | undefined;

        if (environments.length > 0) {
          console.log(`Found ${environments.length} existing environment(s).\n`);
          
          const useExistingEnv = await p.confirm({
            message: 'Would you like to create a new environment?',
            initialValue: true,
          });

          if (p.isCancel(useExistingEnv)) {
            p.cancel('Setup cancelled');
            process.exit(0);
          }

          if (!useExistingEnv) {
            const selected = await p.select({
              message: 'Select an environment:',
              options: environments.map(env => ({
                label: env.name,
                value: env.id,
              })),
            });

            if (p.isCancel(selected)) {
              p.cancel('Setup cancelled');
              process.exit(0);
            }

            environmentId = selected as string;
          }
        }

        if (!environmentId) {
          console.log('\nLet\'s create an environment.');
          
          // Get existing environment names for duplicate checking
          const existingEnvNames = environments.map(env => env.name.toLowerCase());
          
          let name: string;
          let isValidName = false;
          
          while (!isValidName) {
            name = await ClackPrompts.getEnvironmentName();
            
            if (existingEnvNames.includes(name.toLowerCase())) {
              Logger.warn(`An environment named "${name}" already exists.`);
              const continueWithNewName = await p.confirm({
                message: 'Would you like to choose a different name?',
                initialValue: true,
              });
              
              if (p.isCancel(continueWithNewName) || !continueWithNewName) {
                p.cancel('Setup cancelled');
                process.exit(0);
              }
            } else {
              isValidName = true;
            }
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
              p.cancel('Setup cancelled');
              process.exit(0);
            }
            
            // Use the connection we created/selected
            mappings[dataSource] = selectedConnection!;
            console.log(`  ✓ Mapped "${dataSource}" to connection "${selectedConnection}"`);
            
            if (Object.keys(mappings).length > 0) {
              addMore = await ClackPrompts.confirmAction('Add another data source mapping?');
            }
          }
          
          const createEnvSpinner = p.spinner();
          createEnvSpinner.start('Creating environment...');
          
          try {
            const environment = await api.createEnvironment(name!, mappings);
            
            createEnvSpinner.stop(`Environment "${environment.name}" created`, 0);
            environmentId = environment.id || environment.name;
          } catch (error: any) {
            createEnvSpinner.stop('Failed to create environment', 1);
            
            // Check if it's a duplicate name error (shouldn't happen with our check, but just in case)
            if (error.message && error.message.includes('already exists')) {
              Logger.error('An environment with this name already exists.');
              Logger.info('Please run the setup again to continue.');
              process.exit(1);
            } else {
              throw error; // Re-throw for normal error handling
            }
          }
          
          // Set as default if it's the only one or if user wants
          if (environments.length === 0 || await ClackPrompts.confirmAction('Set as default environment?')) {
            ConfigManager.updateConfig({ defaultEnvironment: environmentId });
            Logger.success('✓ Default environment set');
          }
        }

        // Step 4: Security Token (optional)
        if (!args['skip-token']) {
          console.log(chalk.bold('\n🔐 Step 4: Security Token (Optional)'));
          console.log('Security tokens enable secure dashboard embedding with:');
          console.log('  • User identification - Track who views dashboards');
          console.log('  • Row-level security - Filter data per user');
          console.log('  • Time-based access - Control token expiration\n');
          console.log('Common use cases:');
          console.log('  • Multi-tenant SaaS: Show only customer\'s own data');
          console.log('  • Internal tools: Restrict by department or role');
          console.log('  • Partner portals: Limit access to specific regions\n');

          const generateToken = await p.confirm({
            message: 'Would you like to generate a security token now?',
            initialValue: false,
          });

          if (p.isCancel(generateToken)) {
            p.cancel('Setup cancelled');
            process.exit(0);
          }

          if (generateToken) {
            const tokenSpinner = p.spinner();
            tokenSpinner.start('Fetching embeddables...');
            const embeddables = await api.listEmbeddables();
            tokenSpinner.stop();

            if (embeddables.length === 0) {
              Logger.warn('No embeddables found. Create one in the Embeddable platform first.');
            } else {
              const selected = await p.select({
                message: 'Select an embeddable:',
                options: embeddables.map(e => ({
                  label: e.name,
                  value: e.id,
                })),
              });

              if (!p.isCancel(selected)) {
                const embeddableId = selected as string;
                
                console.log('\nLet\'s configure your token:');
                const tokenDetails = await ClackPrompts.getTokenDetails();
                
                const genSpinner = p.spinner();
                genSpinner.start('Generating token...');
                
                const token = await api.generateSecurityToken(embeddableId, {
                  environment: environmentId!,
                  expiryInSeconds: tokenDetails.expiresIn
                    ? parseExpiry(tokenDetails.expiresIn)
                    : 86400,
                  user: tokenDetails.userId ? { id: tokenDetails.userId } : undefined,
                  securityContext: tokenDetails.filters,
                });
                
                genSpinner.stop('Token generated successfully', 0);
                
                console.log('\n' + chalk.bold('Your Security Token:'));
                console.log('='.repeat(60));
                console.log(chalk.cyan(token.token));
                console.log('='.repeat(60));
                
                if (token.embedUrl) {
                  console.log('\n' + chalk.bold('Embed URL:'));
                  console.log(chalk.cyan(token.embedUrl));
                }
                
                console.log('\n' + chalk.bold('How to use this token:'));
                console.log('1. Pass it to your embed component');
                console.log('2. Include it in the Authorization header');
                console.log('3. The token will expire in ' + (tokenDetails.expiresIn || '24h'));
                if (tokenDetails.filters) {
                  console.log('4. Data will be filtered based on your security context');
                }
              }
            }
          }
        }

        // Summary
        console.log(chalk.bold('\n✅ Setup Complete!\n'));
        console.log('Here\'s what we configured:');
        console.log(`  • API Region: ${ConfigManager.getRegionDisplay(config.region)}`);
        console.log(`  • Database Connections: ${connections.length + 1}`);
        console.log(`  • Environments: ${environments.length + 1}`);
        if (config.defaultEnvironment) {
          console.log(`  • Default Environment: Set ✓`);
        }
        
        console.log(chalk.bold('\n📚 Next Steps:'));
        console.log('  1. List your embeddables: ' + chalk.cyan('embed list'));
        console.log('  2. Generate tokens: ' + chalk.cyan('embed token'));
        console.log('  3. View all commands: ' + chalk.cyan('embed --help'));
        console.log('  4. Read the docs: ' + chalk.cyan('https://docs.embeddable.com'));
        
        p.outro('Happy embedding! 🎉');
      } catch (error) {
        handleError(error);
      }
    },
  });
}

// Helper function to parse expiry strings
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([hdm])$/);
  if (!match) {
    return 86400; // Default to 24 hours
  }

  const [, num, unit] = match;
  const value = parseInt(num, 10);

  switch (unit) {
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 86400;
  }
}