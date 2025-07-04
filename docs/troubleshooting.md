# Troubleshooting

Common issues and solutions for the Embeddable CLI.

## General Troubleshooting

### Enable Debug Mode

For detailed output when troubleshooting:

```bash
# Enable debug for single command
embed --debug <command>

# Enable debug for session
export DEBUG=1
embed <command>
```

### Check System Status

```bash
# Verify authentication
embed auth status

# Check configuration
embed config

# Test API connectivity
embed list
```

## Authentication Issues

### Invalid API Key

**Symptoms:**
- "Invalid API key" error during init
- "Authentication error" when running commands
- 401/403 HTTP errors

**Solutions:**
```bash
# Re-authenticate
embed auth login

# Verify API key format (should be UUID)
embed config

# Check region is correct
embed auth status
```

**Common Causes:**
- Wrong API key
- Incorrect region selection
- Expired or revoked API key

### API Key Not Found

**Symptoms:**
- "Not authenticated" error
- No config file found

**Solutions:**
```bash
# Initialize CLI
embed init

# Or restore from backup
mv ~/.embeddable/config.json.backup ~/.embeddable/config.json
```

### Region Mismatch

**Symptoms:**
- API calls timeout
- "Service not available" errors
- Wrong data returned

**Solutions:**
```bash
# Check current region
embed config

# Re-authenticate with correct region
embed auth login
```

## Database Connection Issues

### Connection Refused

**Symptoms:**
- "ECONNREFUSED" error
- Connection test fails immediately

**Solutions:**
1. **Verify host and port:**
   ```bash
   # Test basic connectivity
   telnet <host> <port>
   nc -v <host> <port>
   ```

2. **Check firewall rules:**
   - Ensure your IP is whitelisted
   - Verify database server accepts external connections

3. **Verify database is running:**
   ```bash
   # Check if service is up
   ping <database-host>
   ```

### Authentication Failed

**Symptoms:**
- "Authentication failed" during connection test
- "Access denied" errors
- "Invalid credentials"

**Solutions:**
1. **Verify credentials:**
   ```bash
   # Test credentials manually
   psql -h <host> -p <port> -U <username> -d <database>
   ```

2. **Check user permissions:**
   ```sql
   -- PostgreSQL: Check user exists
   SELECT usename FROM pg_user WHERE usename = 'your_username';
   
   -- MySQL: Check user exists  
   SELECT User, Host FROM mysql.user WHERE User = 'your_username';
   ```

3. **Verify password:**
   - Ensure password doesn't contain special characters that need escaping
   - Try resetting the database user password

### Database Not Found

**Symptoms:**
- "Database does not exist"
- "Unknown database" error

**Solutions:**
1. **Verify database name:**
   ```sql
   -- PostgreSQL: List databases
   \l
   
   -- MySQL: List databases
   SHOW DATABASES;
   ```

2. **Check user has access:**
   ```sql
   -- PostgreSQL: Check database permissions
   SELECT datname FROM pg_database WHERE has_database_privilege('username', datname, 'CONNECT');
   ```

### SSL/TLS Issues

**Symptoms:**
- SSL connection errors
- Certificate validation failures

**Solutions:**
1. **Disable SSL temporarily for testing:**
   ```json
   {
     "ssl": false
   }
   ```

2. **Use proper SSL configuration:**
   ```json
   {
     "ssl": {
       "rejectUnauthorized": false
     }
   }
   ```

## Environment Issues

### Environment Not Found

**Symptoms:**
- "Environment not found" error
- Token generation fails

**Solutions:**
```bash
# List available environments
embed env list

# Check exact environment name
embed config

# Set correct default environment
embed env set-default <correct-environment-id>
```

### Data Source Mapping Issues

**Symptoms:**
- "Data source not found" in dashboards
- Empty or missing data

**Solutions:**
1. **Verify data source mappings:**
   ```bash
   embed env list
   ```

2. **Check connection exists:**
   ```bash
   embed database list
   ```

3. **Test mapped connections:**
   ```bash
   embed database test <connection-id>
   ```

### Environment Creation Fails

**Symptoms:**
- "Environment already exists" error
- Validation errors during creation

**Solutions:**
```bash
# Check existing environments
embed env list

# Use different name or remove existing environment
embed env remove <existing-environment>
```

## Token Generation Issues

### No Embeddables Found

**Symptoms:**
- "No embeddables found" message
- Empty embeddable list

**Solutions:**
1. **Verify API key has access:**
   ```bash
   embed auth status
   ```

2. **Check workspace has embeddables:**
   - Log into Embeddable platform
   - Verify embeddables exist in workspace

3. **Try different region:**
   ```bash
   embed auth login
   # Select different region
   ```

### Token Generation Fails

**Symptoms:**
- Token generation throws errors
- Invalid token responses

**Solutions:**
1. **Check environment is valid:**
   ```bash
   embed env list
   embed database test <connection-id>
   ```

2. **Verify embeddable exists:**
   ```bash
   embed list
   ```

3. **Use simpler token configuration:**
   - Remove security filters temporarily
   - Use shorter expiration time

## Performance Issues

### Slow Command Execution

**Symptoms:**
- Commands take long time to complete
- Timeouts during operations

**Solutions:**
1. **Check network connectivity:**
   ```bash
   ping api.us.embeddable.com
   ```

2. **Disable update checks:**
   ```bash
   export EMBED_NO_UPDATE_CHECK=1
   ```

3. **Use specific commands instead of interactive:**
   ```bash
   # Instead of interactive prompts
   embed token <embeddable-id> --env <environment-id>
   ```

## Installation Issues

### Command Not Found

**Symptoms:**
- "embed: command not found"
- CLI not in PATH

**Solutions:**
1. **Verify installation:**
   ```bash
   which embed
   ```

2. **Add to PATH:**
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export PATH="/path/to/embed:$PATH"
   ```

3. **Use full path:**
   ```bash
   /full/path/to/embed --help
   ```

### Permission Denied

**Symptoms:**
- "Permission denied" when running embed
- Cannot execute binary

**Solutions:**
```bash
# Make executable
chmod +x /path/to/embed

# Check file permissions
ls -la /path/to/embed
```

### Homebrew Issues

**Symptoms:**
- "Formula not found" error
- Tap not working

**Solutions:**
```bash
# Update Homebrew
brew update

# Re-add tap
brew untap embeddable-hq/embeddable
brew tap embeddable-hq/embeddable

# Install
brew install embed
```

## Configuration Issues

### Config File Corruption

**Symptoms:**
- "Invalid configuration" errors
- JSON parse errors

**Solutions:**
```bash
# Remove corrupted config
rm ~/.embeddable/config.json

# Re-initialize
embed init
```

### Permission Issues

**Symptoms:**
- Cannot write config file
- Permission denied errors

**Solutions:**
```bash
# Fix permissions
chmod 755 ~/.embeddable
chmod 644 ~/.embeddable/config.json

# Recreate directory
rm -rf ~/.embeddable
mkdir ~/.embeddable
embed init
```

## API Issues

### Rate Limiting

**Symptoms:**
- "Too many requests" errors
- 429 HTTP status codes

**Solutions:**
- Wait and retry
- Reduce frequency of API calls
- Contact support if persistent

### Service Unavailable

**Symptoms:**
- 503 Service Unavailable
- Connection timeouts

**Solutions:**
1. **Check service status:**
   - Visit Embeddable status page
   - Check social media for outage reports

2. **Try different region:**
   ```bash
   embed auth login
   # Select different region
   ```

## Getting Additional Help

### Collect Debug Information

When reporting issues, include:

```bash
# CLI version
embed --version

# System information
uname -a

# Configuration (sanitized)
embed config

# Debug output
embed --debug <failing-command>
```

### Support Channels

- **GitHub Issues**: [Report bugs](https://github.com/embeddable-hq/embeddable-cli/issues)
- **Documentation**: [Embeddable Docs](https://docs.embeddable.com)
- **Community**: [Embeddable Community](https://community.embeddable.com)

### Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `BUILDER-018` | Environment already exists | Use different name or remove existing |
| `BUILDER-996` | Request validation failed | Check request parameters |
| `BUILDER-998` | Authentication error | Verify API key and region |
| `ECONNREFUSED` | Connection refused | Check host, port, and firewall |
| `ENOTFOUND` | Host not found | Verify hostname is correct |

For additional examples and workflows, see [Examples](examples.md).