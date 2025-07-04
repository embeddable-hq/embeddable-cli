# Embeddable CLI

A command-line interface for managing Embeddable analytics platform resources. The CLI provides an intuitive way to manage database connections, environments, and generate security tokens for embedding dashboards.

## Installation

### Using Homebrew (macOS/Linux)

```bash
brew tap embeddable-hq/embeddable
brew install embed
```


### Using Scoop (Windows)

```bash
scoop bucket add embeddable https://github.com/embeddable-hq/scoop-bucket
scoop install embed
```

### Direct Download

Download pre-built binaries for your platform from the [releases page](https://github.com/embeddable-hq/embeddable-cli/releases/latest):
- macOS (Intel & Apple Silicon)
- Linux (x64)
- Windows (x64)

## Getting Started

The easiest way to get started is with the interactive setup wizard:

```bash
embed setup
```

This will guide you through:
- Configuring your API credentials
- Setting up a database connection
- Creating an environment
- Optionally generating a security token

### Manual Setup

You can also set up each component individually:

1. **Initialize the CLI with your API credentials:**

```bash
embed init
```

You'll be prompted for:
- Your API key
- Your region (US, EU, or Dev)

2. **Create a database connection:**

```bash
embed database connect
```

3. **Create an environment:**

```bash
embed env create
```

4. **List available embeddables:**

```bash
embed list
```

## Commands

### Setup

#### `embed setup`
Interactive setup wizard that guides new users through the complete configuration process. This is the recommended way to get started.

```bash
embed setup
# or skip token generation
embed setup --skip-token
```

The setup wizard will:
- Configure API authentication
- Create a database connection
- Set up an environment with data source mappings
- Optionally generate a security token

### Authentication

#### `embed init`
Initialize the CLI with your Embeddable API credentials. This is typically the first command you'll run.

```bash
embed init
```

#### `embed auth login`
Update or change your API credentials.

```bash
embed auth login
```

#### `embed auth logout`
Clear stored credentials from your system.

```bash
embed auth logout
```

#### `embed auth status`
Check your current authentication status and test API connectivity.

```bash
embed auth status
```

### Database Management

#### `embed database connect`
Add a new database connection. Supports interactive mode or JSON configuration.

**Interactive mode:**
```bash
embed database connect
```

**JSON mode:**
```bash
embed database connect --json '{"name":"prod-db","type":"postgresql","host":"localhost","port":5432,"database":"mydb","user":"user","password":"pass"}'
```

**File mode:**
```bash
embed database connect --file connection.json
```

**Skip connection test:**
```bash
embed database connect --skip-test
```

#### `embed database list`
List all configured database connections.

```bash
embed database list
```

#### `embed database test [connectionId]`
Test a database connection to ensure it's working properly.

```bash
embed database test
# or
embed database test <connection-id>
```

#### `embed database remove [connectionId]`
Remove a database connection.

```bash
embed database remove
# or
embed database remove <connection-id>
```

### Environment Management

#### `embed env create`
Create a new environment with data source mappings.

```bash
embed env create
```

#### `embed env list`
List all environments.

```bash
embed env list
```

#### `embed env set-default [environmentId]`
Set the default environment for token generation.

```bash
embed env set-default
# or
embed env set-default <environment-id>
```

#### `embed env remove [environmentId]`
Remove an environment.

```bash
embed env remove
# or
embed env remove <environment-id>
```

### Embeddables

#### `embed list`
List all available embeddables in your workspace.

```bash
embed list
```

#### `embed token [embeddableId]`
Generate a security token for embedding a dashboard. Supports user context and row-level security.

```bash
embed token
# or
embed token <embeddable-id>
# or with specific environment
embed token <embeddable-id> --env <environment-id>
```

### Utility Commands

#### `embed version`
Display the current CLI version.

```bash
embed version
```

#### `embed version --check`
Check for available updates.

```bash
embed version --check
```

#### `embed version --update`
Update to the latest version (Homebrew installations only).

```bash
embed version --update
```

#### `embed config`
Display current configuration including region and masked API key.

```bash
embed config
```

## Configuration

The CLI stores configuration in `~/.embeddable/config.json`. This includes:
- API key (encrypted)
- Region (US, EU, or Dev)
- Default environment ID

## Regions

The CLI supports multiple regions:
- **US**: `api.us.embeddable.com` (default)
- **EU**: `api.eu.embeddable.com`
- **Dev**: `api.dev.embeddable.com` (for development)

You can select your region during `embed init` or `embed auth login`.

## Database Types

Supported database types:
- PostgreSQL
- MySQL
- BigQuery
- Snowflake
- Amazon Redshift

For BigQuery, Snowflake, and Redshift, use the `--json` or `--file` options to provide the full connection configuration.

## Security Tokens

Security tokens are JWT tokens that enable secure embedding of dashboards. They can include:
- **User context**: Associate the dashboard view with a specific user
- **Row-level security**: Filter data based on security rules
- **Expiration time**: Control how long the token remains valid

### Token Options

When generating tokens interactively, you can specify:
- **User ID**: Links the dashboard view to a specific user
- **Expiration**: How long the token is valid (e.g., "1h", "24h", "7d")
- **Security filters**: Row-level security rules in JSON format

Example security filter:
```json
{
  "customer_id": 123,
  "department": "sales"
}
```

## Non-Interactive Mode

All commands support non-interactive execution for scripting and automation:

```bash
# Create a connection from JSON
embed database connect --json '{"name":"prod","type":"postgresql",...}'

# Generate a token with specific parameters
embed token embeddable-123 --env prod-env
```

## Debug Mode

Enable debug output for troubleshooting:

```bash
embed --debug <command>
# or
embed -d <command>
```

## Automatic Updates

The CLI automatically checks for updates in the background and notifies you when a new version is available. You can disable this by setting the environment variable:

```bash
export EMBED_NO_UPDATE_CHECK=1
```

## Examples

### Complete Setup Flow

```bash
# 1. Initialize CLI
embed init

# 2. Add a PostgreSQL database
embed database connect
# Choose PostgreSQL, enter connection details

# 3. Create a production environment
embed env create
# Name it "production", map data sources

# 4. Set as default environment
embed env set-default

# 5. List available embeddables
embed list

# 6. Generate a token for embedding
embed token
```

### Scripted Database Setup

```bash
# Create a connection from a JSON file
cat > db-config.json << EOF
{
  "name": "analytics-db",
  "type": "postgresql",
  "host": "db.example.com",
  "port": 5432,
  "database": "analytics",
  "user": "readonly",
  "password": "secret"
}
EOF

embed database connect --file db-config.json
```

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:
1. Check your API key is correct: `embed auth status`
2. Ensure you're using the correct region
3. Re-authenticate: `embed auth login`

### Connection Issues

For database connection problems:
1. Verify network connectivity to the database
2. Check firewall rules allow connections
3. Ensure database credentials are correct
4. Use `--skip-test` to save connection without testing

### Update Issues

If automatic updates fail:
- **Homebrew**: Run `brew update && brew upgrade embed`
- **Binary**: Download the latest version from GitHub releases

## Development

### Building from Source

Requirements:
- Node.js 18+
- pnpm
- Bun (for building binaries)

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build TypeScript
pnpm build

# Build binaries for all platforms
pnpm build:all

# Run linter
pnpm lint

# Type check
pnpm typecheck
```

### Release Process

```bash
# Create a patch release
pnpm publish

# Create a minor release
pnpm publish minor

# Create a major release
pnpm publish major
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Report issues: [GitHub Issues](https://github.com/embeddable-hq/embeddable-cli/issues)
- Documentation: [Embeddable Docs](https://docs.embeddable.com)
- Community: [Embeddable Community](https://community.embeddable.com)