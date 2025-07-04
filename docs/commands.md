# Commands Reference

Complete reference for all Embeddable CLI commands.

## Global Options

- `--help` - Show help for any command
- `--debug` - Enable debug output
- `--version` - Show CLI version

## Setup & Authentication

### `embed setup`
Interactive setup wizard that guides new users through the complete configuration process.

```bash
embed setup
# or skip token generation
embed setup --skip-token
```

**What it does:**
- Configure API authentication
- Create a database connection
- Set up an environment with data source mappings
- Optionally generate a security token

### `embed init`
Initialize the CLI with your Embeddable API credentials.

```bash
embed init
```

### `embed auth`
Manage authentication credentials.

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

## Database Management

### `embed database connect`
Add a new database connection with support for interactive mode or JSON configuration.

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

**Options:**
- `--json <config>` - Connection configuration as JSON
- `--file <path>` - Path to JSON file with connection configuration
- `--skip-test` - Skip connection test before creating

### `embed database list`
List all configured database connections.

```bash
embed database list
```

### `embed database test [connectionId]`
Test a database connection to ensure it's working properly.

```bash
embed database test
# or specify connection
embed database test <connection-id>
```

### `embed database remove [connectionId]`
Remove a database connection.

```bash
embed database remove
# or specify connection
embed database remove <connection-id>
```

## Environment Management

### `embed env create`
Create a new environment with data source mappings.

```bash
embed env create
```

### `embed env list`
List all environments.

```bash
embed env list
```

### `embed env set-default [environmentId]`
Set the default environment for token generation.

```bash
embed env set-default
# or specify environment
embed env set-default <environment-id>
```

### `embed env remove [environmentId]`
Remove an environment.

```bash
embed env remove
# or specify environment
embed env remove <environment-id>
```

## Embeddables & Tokens

### `embed list`
List all available embeddables in your workspace.

```bash
embed list
```

### `embed token [embeddableId]`
Generate a security token for embedding a dashboard. Supports user context and row-level security.

```bash
embed token
# or specify embeddable
embed token <embeddable-id>
# or with specific environment
embed token <embeddable-id> --env <environment-id>
```

**Options:**
- `--env <environment-id>` - Use specific environment (overrides default)

## Utility Commands

### `embed version`
Display the current CLI version.

```bash
embed version
```

### `embed version --check`
Check for available updates.

```bash
embed version --check
```

### `embed version --update`
Update to the latest version (Homebrew installations only).

```bash
embed version --update
```

### `embed config`
Display current configuration including region and masked API key.

```bash
embed config
```

## Command Examples

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
# Create connection from JSON file
embed database connect --file db-config.json

# Create environment and set as default
embed env create
embed env set-default production
```

### Token Generation with Filters
```bash
# Generate token with user context and security filters
embed token embeddable-123 --env production
# Follow prompts for user ID and security filters
```

## Getting Help

For detailed help with any command:

```bash
embed <command> --help
```

For command-specific examples, see the [Examples](examples.md) documentation.