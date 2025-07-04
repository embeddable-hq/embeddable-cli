# Embeddable CLI - Project Context

## Overview

The Embeddable CLI (`embed`) is a command-line tool that serves as a user-friendly wrapper around the Embeddable API. Embeddable is a developer toolkit for building fast, fully-custom analytics experiences directly into applications.

## Key Concepts

### What is Embeddable?

Embeddable provides:
- **Code-based data model definitions** for developers
- **No-code dashboard assembly** for business users  
- **Native web component embedding** with built-in security
- **Performance optimization** through advanced caching

### Architecture

The CLI abstracts away direct API communication, allowing users to:
- Manage database connections without manual API calls
- Create and configure environments
- Generate security tokens for dashboard embedding
- List and preview dashboards

## Technical Implementation

### Technology Stack
- **TypeScript** - Type-safe development with NodeNext module resolution
- **Citty** - Modern CLI framework with command routing and better TypeScript support
- **@clack/prompts** - Beautiful interactive prompts with better UX than standard prompts
- **Chalk v5** - Colored terminal output (ESM)
- **Ora v8** - Loading spinners (ESM)
- **cli-table3** - Table formatting for data display
- **open** - Cross-platform browser opening
- **Bun** - For building native binaries

### ESM Migration

The project has been fully migrated to ES Modules (ESM):
- Uses `"type": "module"` in package.json
- All imports use `.js` extensions for local TypeScript files
- TypeScript configured with `NodeNext` module resolution
- Latest versions of all dependencies (no CommonJS constraints)
- Removed `node-fetch` dependency (use native `fetch` API)

### API Integration

The CLI communicates with Embeddable's REST API:
- **Base URLs**:
  - US: `https://api.us.embeddable.com/api/v1`
  - EU: `https://api.eu.embeddable.com/api/v1`
  - Dev: `https://api.dev.embeddable.com/api/v1`
- **Authentication**: Bearer token in Authorization header
- **Content-Type**: application/json

### Core Functionality

1. **Database Connections**
   - No direct database communication
   - CLI sends connection configs to Embeddable API
   - Supports PostgreSQL, MySQL, BigQuery, Snowflake, Redshift
   - Connection testing via API endpoint

2. **Environments**
   - Map data sources to database connections
   - Support multiple deployment stages (prod, staging, etc.)
   - Single-tenant database security

3. **Security Tokens**
   - Generate JWT tokens for dashboard embedding
   - Include user context and row-level security
   - Configurable expiration times

4. **Dashboard Preview**
   - Generate preview URLs for embeddables in the Embeddable dashboard
   - Requires workspace ID (not available via API with static tokens)
   - URL format: `https://app.{region}.embeddable.com/en/workspace/{workspaceId}/builder/{embeddableId}`

## User Experience Design

### Interactive vs Non-Interactive Modes

The CLI supports both modes for flexibility:

**Interactive Mode** (default):
```bash
embed database connect
# User is prompted for each field
```

**Non-Interactive Mode**:
```bash
embed database connect --json '{"name":"prod-db",...}'
embed database connect --file connection.json
```

### Configuration Storage

- Stored in `~/.embeddable/config.json`
- Contains API key, region, and default environment
- Secure credential storage on user's machine

### Error Handling

The CLI provides:
- Friendly error messages (not raw API errors)
- Suggestions for common issues
- Debug mode with `--debug` flag
- Proper exit codes for scripting

## Distribution Strategy

### Binary Distribution
- Use Bun to compile self-contained executables
- Platform-specific binaries: Linux, macOS (ARM64), Windows
- No runtime dependencies required

### Package Managers
- **Homebrew** (macOS): Custom tap repository
- **Scoop** (Windows): Manifest for easy installation
- **npm**: For Node.js users who prefer npm global install

## Development Workflow

### Building the Project
```bash
pnpm install       # Install dependencies
pnpm build         # Compile TypeScript
pnpm typecheck     # Type checking
pnpm lint          # Linting
```

### Testing Locally
```bash
node dist/cli.js --help
pnpm dev -- --help  # Using tsx for development
```

### Creating Binaries (requires Bun)
```bash
npm run build:all  # Build for all platforms
```

## CLI Architecture with Citty

### Command Structure

The CLI uses citty's `defineCommand` pattern for modular command organization:

```typescript
// Main CLI entry point
const main = defineCommand({
  meta: { name: 'embed', version, description: '...' },
  subCommands: {
    init: createInitCommand(),
    auth: createAuthCommand(),
    database: createDatabaseCommand(),
    // ...
  }
});
```

### Command Factory Pattern

Each command is created using factory functions that return citty command definitions:

```typescript
export function createPreviewCommand() {
  return defineCommand({
    meta: { name: 'preview', description: '...' },
    args: {
      embeddableId: { type: 'positional', required: false },
      workspace: { type: 'string', alias: 'w' }
    },
    async run({ args }) { /* implementation */ }
  });
}
```

### Interactive Prompts with @clack/prompts

Key learnings about @clack/prompts:

1. **Select Prompts**: Must include `hint` field for options to display properly
   ```typescript
   const selected = await p.select({
     message: 'Select an embeddable:',
     options: items.map(item => ({
       value: item.id,
       label: item.name,
       hint: item.id  // Important: helps with rendering
     }))
   });
   ```

2. **Text Input with Validation**:
   ```typescript
   const input = await p.text({
     message: 'Enter workspace ID:',
     placeholder: 'e.g., 512cc2a8-9b8c-4ba1-8ca7-5799d8d9a66b',
     validate: (value) => {
       if (!uuidRegex.test(value)) {
         return 'Please enter a valid UUID';
       }
     }
   });
   ```

3. **Spinners**: Use for async operations
   ```typescript
   const spinner = p.spinner();
   spinner.start('Loading...');
   // async work
   spinner.stop();
   ```

## Best Practices

1. **API Key Security**
   - Never log or display full API keys
   - Show only last 4 characters when displaying
   - Always validate API key on login

2. **User Feedback**
   - Use spinners for long operations
   - Provide clear success/error messages
   - Show progress for multi-step operations

3. **Defaults and Convenience**
   - Remember user's default environment
   - Suggest sensible defaults (e.g., port 5432 for PostgreSQL)
   - Allow both interactive and scriptable usage

## Future Considerations

1. **Additional Database Types**
   - Currently supports major databases
   - BigQuery requires service account JSON
   - Other databases need JSON config input

2. **Enhanced Features**
   - Bulk operations support
   - Configuration import/export
   - Team collaboration features

3. **Testing**
   - Unit tests for API client
   - Integration tests with mock API
   - CLI command tests

## API Limitations and Workarounds

### Workspace Access
- The `/workspace` endpoint requires different authentication than static API tokens
- **Workaround**: Prompt users for workspace ID manually
- **Command**: `embed preview --workspace=<workspace-id>` or interactive prompt

### Static Token Limitations
- Some endpoints (like workspace listing) are not accessible with static tokens
- Users must provide workspace IDs manually for preview functionality

## Common Issues and Solutions

1. **ESM Module Errors**
   - All dependencies now use ESM (fixed in latest version)
   - Node.js v18+ required for proper ESM support
   - Use `.js` extensions in TypeScript imports

2. **API Authentication**
   - Validate API key on init/login
   - Provide clear error for invalid credentials
   - Some endpoints require different auth (workspace API)

3. **@clack/prompts Display Issues**
   - Select prompts need `hint` field to display options properly
   - Use `p.intro()` for better visual organization

4. **Platform-Specific Builds**
   - Bun required for native binary compilation
   - Fallback to Node.js execution if binaries unavailable

## Release Process

### Prerequisites

1. **GitHub Repository Setup**:
   - Main repository: `embeddable-hq/embeddable-cli`
   - Homebrew tap repository: `embeddable-hq/homebrew-embeddable`
   - Secrets needed:
     - `NPM_TOKEN` - For publishing to npm
     - `HOMEBREW_TAP_TOKEN` - GitHub token with access to tap repo

2. **Scoop Bucket** (Optional):
   - Repository: `embeddable-hq/scoop-bucket`

### Release Steps

1. **Use the release script**:
   ```bash
   ./scripts/release.sh
   ```
   This will:
   - Update version in package.json
   - Create a git tag
   - Push to GitHub
   
2. **GitHub Actions will automatically**:
   - Create a GitHub release
   - Build binaries for all platforms
   - Publish to npm as `@embeddable/cli`
   - Update Homebrew formula

3. **Manual steps** (if needed):
   - Update Scoop manifest
   - Update documentation

### Version Update Flow

1. **Automatic checks**: CLI checks for updates every 24 hours
2. **Manual check**: `embed version --check`
3. **Update methods**:
   - Homebrew: `brew upgrade embed`
   - npm: `npm install -g @embeddable/cli@latest`
   - Binary: Download from GitHub releases

### Homebrew Formula

The formula is located at `homebrew-tap/Formula/embed.rb` and is automatically updated by GitHub Actions on new releases.

This CLI makes Embeddable's powerful analytics platform accessible through simple commands, reducing the learning curve and speeding up integration for developers.