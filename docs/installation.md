# Installation Guide

The Embeddable CLI can be installed in several ways depending on your platform and preferences.

## Package Managers

### Homebrew (macOS/Linux)

```bash
# Add the Embeddable tap
brew tap embeddable-hq/embeddable

# Install the CLI
brew install embed
```

**Updating:**
```bash
brew update && brew upgrade embed
```

### Scoop (Windows)

```bash
# Add the Embeddable bucket
scoop bucket add embeddable https://github.com/embeddable-hq/scoop-bucket

# Install the CLI
scoop install embed
```

**Updating:**
```bash
scoop update embed
```

## Direct Download

Download pre-built binaries for your platform from the [GitHub releases page](https://github.com/embeddable-hq/embeddable-cli/releases/latest):

### Available Platforms
- **macOS**: Intel (x64) and Apple Silicon (ARM64)
- **Linux**: x64
- **Windows**: x64

### Installation Steps

1. Download the appropriate binary for your platform
2. Extract the archive (if applicable)
3. Move the binary to a directory in your PATH
4. Make it executable (Unix systems only):
   ```bash
   chmod +x embed
   ```

## Build from Source

### Requirements
- Node.js 18+
- pnpm
- Bun (for building native binaries)

### Steps

```bash
# Clone the repository
git clone https://github.com/embeddable-hq/embeddable-cli.git
cd embeddable-cli

# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Run directly
node dist/cli.js --help

# Or build native binaries
pnpm build:all
```

## Verification

After installation, verify the CLI is working:

```bash
embed --version
embed --help
```

## Automatic Updates

The CLI will automatically check for updates and notify you when new versions are available. You can also manually check for updates:

```bash
embed version --check
```

For Homebrew installations, you can update automatically:

```bash
embed version --update
```

## Uninstallation

### Homebrew
```bash
brew uninstall embed
brew untap embeddable-hq/embeddable
```

### Scoop
```bash
scoop uninstall embed
```

### Manual Installation
Simply remove the binary from your PATH.

## Configuration Cleanup

To remove all CLI configuration and data:

```bash
rm -rf ~/.embeddable
```

This will remove:
- API credentials
- Configuration settings
- Cached data

## Troubleshooting Installation

See the [Troubleshooting Guide](troubleshooting.md) for common installation issues and solutions.