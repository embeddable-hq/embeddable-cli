# Getting Started

This guide will help you get up and running with the Embeddable CLI quickly.

## First Time Setup

When you run `embed` for the first time, the CLI will automatically guide you through the setup process:

1. **Authentication**: Configure your API credentials and region
2. **Setup Wizard**: Optionally run the interactive setup to create database connections and environments

## Quick Start with Setup Wizard

The fastest way to get started is with the interactive setup wizard:

```bash
embed setup
```

This wizard will:
- Help you create your first database connection
- Set up an environment with data source mappings
- Optionally generate a security token for testing

## Manual Setup

If you prefer to configure each component individually:

### 1. Initialize Authentication

```bash
embed init
```

You'll be prompted for:
- Your Embeddable API key
- Your region (US, EU, or Dev)

### 2. Add a Database Connection

```bash
embed database connect
```

Follow the interactive prompts to configure your database connection.

### 3. Create an Environment

```bash
embed env create
```

Map your data sources to database connections.

### 4. Generate Security Tokens

```bash
embed token
```

Create tokens for secure dashboard embedding.

## Next Steps

- Explore the [Commands Reference](commands.md) for all available commands
- Learn about [Database Connections](databases.md) and supported database types
- Understand [Security Tokens](tokens.md) for dashboard embedding
- Check out [Examples](examples.md) for common workflows

## Getting Help

- Run `embed --help` to see all available commands
- Run `embed <command> --help` for help with specific commands
- Check the [Troubleshooting](troubleshooting.md) guide for common issues