# Configuration

Learn about CLI configuration, regions, and settings management.

## Configuration File

The CLI stores configuration in `~/.embeddable/config.json`. This includes:

- **API Key**: Your Embeddable API key (encrypted)
- **Region**: Your Embeddable region (US, EU, or Dev)
- **Default Environment**: The environment used for token generation

### Example Configuration
```json
{
  "apiKey": "your-api-key-here",
  "region": "US",
  "defaultEnvironment": "production"
}
```

## Regions

The CLI supports multiple Embeddable regions:

| Region | API Endpoint | Description |
|--------|-------------|-------------|
| **US** | `api.us.embeddable.com` | United States (default) |
| **EU** | `api.eu.embeddable.com` | Europe |
| **Dev** | `api.dev.embeddable.com` | Development environment |

### Selecting a Region

You can select your region during:
- `embed init` - Initial setup
- `embed auth login` - When updating credentials

## Environment Variables

You can configure certain behaviors with environment variables:

### `EMBED_NO_UPDATE_CHECK`
Disable automatic update checking.

```bash
export EMBED_NO_UPDATE_CHECK=1
embed list  # Won't check for updates
```

### `DEBUG`
Enable debug output for troubleshooting.

```bash
export DEBUG=1
embed list  # Shows detailed API requests/responses
```

## Configuration Management

### View Current Configuration
```bash
embed config
```

Shows:
- Configuration file path
- Current region
- Masked API key
- Default environment (if set)

### Update Configuration
```bash
# Update API credentials
embed auth login

# Set default environment
embed env set-default <environment-id>
```

### Reset Configuration
```bash
# Remove all configuration
embed auth logout

# Or manually delete
rm -rf ~/.embeddable
```

## Default Environment

Setting a default environment saves time when generating tokens:

```bash
# Set default environment
embed env set-default production

# Now token generation uses this environment by default
embed token <embeddable-id>

# Override default with --env flag
embed token <embeddable-id> --env staging
```

## Security Considerations

### API Key Storage
- API keys are stored locally in `~/.embeddable/config.json`
- The file has restricted permissions (readable only by your user)
- Keys are not encrypted at rest (store securely)

### Best Practices
1. **Use read-only database users** for database connections
2. **Limit API key permissions** to only what's needed
3. **Regularly rotate API keys** for security
4. **Don't commit configuration files** to version control
5. **Use environment-specific API keys** for different stages

### Sharing Configuration
For team environments, consider:
- Using different API keys per team member
- Documenting connection configurations without credentials
- Using environment variables for sensitive data in CI/CD

## Configuration Troubleshooting

### Invalid API Key
```bash
# Check current status
embed auth status

# Re-authenticate
embed auth login
```

### Wrong Region
```bash
# Check current region
embed config

# Update region
embed auth login
# Select correct region during setup
```

### Missing Default Environment
```bash
# List available environments
embed env list

# Set default
embed env set-default <environment-id>
```

### Configuration File Issues
```bash
# Check file exists and permissions
ls -la ~/.embeddable/config.json

# Reset if corrupted
rm ~/.embeddable/config.json
embed init
```

For more troubleshooting help, see the [Troubleshooting Guide](troubleshooting.md).