# Embeddable CLI

A command-line interface for managing Embeddable API resources including database connections, environments, and dashboards.

## Installation

### Using Homebrew (macOS/Linux)

```bash
brew tap embeddable-hq/embeddable
brew install embed
```

### Using npm/pnpm/yarn

```bash
# npm
npm install -g @embeddable/cli

# pnpm
pnpm add -g @embeddable/cli

# yarn
yarn global add @embeddable/cli
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

4. **List available dashboards:**

```bash
embed list
```

## Commands

### Authentication

- `embed init` - Initialize CLI configuration
- `embed auth login` - Update API credentials
- `embed auth logout` - Clear stored credentials
- `embed auth status` - Show authentication status

### Database Connections

- `embed database connect` - Create a new database connection
- `embed database list` - List all connections
- `embed database show <name>` - Show connection details
- `embed database test <name>` - Test a connection
- `embed database update <name>` - Update a connection
- `embed database delete <name>` - Delete a connection

### Environments

- `embed env create` - Create a new environment
- `embed env list` - List all environments
- `embed env show <name>` - Show environment details
- `embed env update <name>` - Update an environment
- `embed env delete <name>` - Delete an environment
- `embed env set-default <name>` - Set default environment

### Dashboards/Embeddables

- `embed list` - List all embeddables
- `embed token <id>` - Generate security token
- `embed preview <id>` - Preview embeddable in browser

### Version Management

- `embed version` - Show current version
- `embed version --check` - Check for updates
- `embed version --update` - Update to latest version

## Options

Most commands support both interactive and non-interactive modes:

### Interactive Mode (default)

Simply run the command and follow the prompts:

```bash
embed database connect
```

### Non-Interactive Mode

Use flags or JSON input:

```bash
# Using JSON
embed database connect --json '{"name":"prod-db","type":"postgres","credentials":{...}}'

# Using file
embed database connect --file connection.json
```

### Global Options

- `--help` - Show help for any command
- `--debug` - Enable debug output
- `--json` - Output results as JSON (for list commands)

## Configuration

Configuration is stored in `~/.embeddable/config.json`

## Automatic Updates

The CLI automatically checks for updates every 24 hours and notifies you when a new version is available. You can disable this by setting the environment variable:

```bash
export EMBED_NO_UPDATE_CHECK=1
```

## Examples

### Create a PostgreSQL connection

```bash
embed database connect
# Follow the prompts to enter connection details
```

### Create an environment with mappings

```bash
embed env create --name production --mappings '{"datasource1":"prod-db","datasource2":"analytics-db"}'
```

### Generate a security token

```bash
embed token abc123 --expires 7200 --environment production
```

### Filter embeddables by tags

```bash
embed list --tags "sales,marketing"
```

## Development

### Building from Source

1. Clone the repository
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Run locally: `npm run dev`

### Building Binaries

Requires Bun to be installed:

```bash
npm run build:all
```

This creates binaries for Linux, macOS, and Windows in the `dist/` directory.

## License

MIT