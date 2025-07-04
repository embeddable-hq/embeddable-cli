# Embeddable CLI

A command-line interface for managing Embeddable analytics platform resources. The CLI provides an intuitive way to manage database connections, environments, and generate security tokens for embedding dashboards.

## Quick Start

The easiest way to get started is with the interactive setup wizard:

```bash
embed setup
```

This will guide you through configuring your API credentials, setting up database connections, and creating environments.

## Installation

### Homebrew (macOS/Linux)
```bash
brew tap embeddable-hq/embeddable
brew install embed
```

### Scoop (Windows)
```bash
scoop bucket add embeddable https://github.com/embeddable-hq/scoop-bucket
scoop install embed
```

### Direct Download
Download pre-built binaries from the [releases page](https://github.com/embeddable-hq/embeddable-cli/releases/latest).

## Documentation

- **[Getting Started](docs/getting-started.md)** - First steps and setup wizard
- **[Installation Guide](docs/installation.md)** - Detailed installation instructions
- **[Commands Reference](docs/commands.md)** - Complete command documentation
- **[Configuration](docs/configuration.md)** - Configuration and regions
- **[Database Connections](docs/databases.md)** - Supported databases and setup
- **[Environments](docs/environments.md)** - Environment management
- **[Security Tokens](docs/tokens.md)** - Token generation and usage
- **[Examples](docs/examples.md)** - Common workflows and examples
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions
- **[Development](docs/development.md)** - Contributing and building from source

## Support

- **Issues**: [GitHub Issues](https://github.com/embeddable-hq/embeddable-cli/issues)
- **Documentation**: [Embeddable Docs](https://docs.embeddable.com)
- **Community**: [Embeddable Community](https://community.embeddable.com)

## License

MIT License - see [LICENSE](LICENSE) file for details.