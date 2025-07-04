# Environment Management

Learn how to create and manage environments for different deployment stages.

## What are Environments?

Environments in Embeddable map your logical data sources to actual database connections. This allows you to:

- **Use different databases** for development, staging, and production
- **Switch data sources** without changing your Embeddable models
- **Manage multi-tenant architectures** with different data per environment
- **Test changes** safely before deploying to production

## Environment Structure

Each environment contains:
- **Name**: A unique identifier (e.g., "production", "staging")
- **Data Source Mappings**: Map logical names to database connections

### Example Environment
```
Environment: "production"
Data Sources:
  - main_db → postgres-prod-connection
  - analytics → bigquery-prod-connection
  - cache → redis-prod-connection
```

## Creating Environments

### Interactive Creation

```bash
embed env create
```

This will prompt you for:
1. Environment name
2. Data source mappings (logical name → database connection)
3. Option to set as default environment

### Data Source Mapping

Data sources are logical names used in your Embeddable models. For example:

**In your Embeddable model:**
```javascript
// Uses logical name "main_db"
const users = Dataset({
  name: 'users',
  sql: 'SELECT * FROM users',
  datasource: 'main_db'
});
```

**In your environment:**
- Development: `main_db` → `postgres-dev-connection`
- Production: `main_db` → `postgres-prod-connection`

## Environment Management

### List Environments
```bash
embed env list
```

Shows all environments with their data source mappings and default status.

### Set Default Environment
```bash
embed env set-default <environment-id>
```

The default environment is used for token generation when no specific environment is specified.

### Remove Environment
```bash
embed env remove <environment-id>
```

⚠️ **Warning**: Removing an environment will break any dashboards using it.

## Common Environment Patterns

### Development Workflow
```bash
# Development environment
embed env create
# Name: "development"
# main_db → local-postgres
# analytics → local-bigquery-emulator

# Staging environment  
embed env create
# Name: "staging"
# main_db → postgres-staging
# analytics → bigquery-staging

# Production environment
embed env create
# Name: "production" 
# main_db → postgres-prod
# analytics → bigquery-prod
```

### Multi-Tenant Setup
```bash
# Tenant A environment
embed env create
# Name: "tenant-a"
# main_db → postgres-tenant-a
# analytics → bigquery-tenant-a

# Tenant B environment
embed env create
# Name: "tenant-b"
# main_db → postgres-tenant-b
# analytics → bigquery-tenant-b
```

### Feature Branch Testing
```bash
# Feature branch environment
embed env create
# Name: "feature-new-analytics"
# main_db → postgres-prod (read-only)
# analytics → bigquery-experimental
```

## Using Environments

### With Token Generation

Specify environment when generating tokens:

```bash
# Use default environment
embed token <embeddable-id>

# Use specific environment
embed token <embeddable-id> --env staging

# Use production environment
embed token <embeddable-id> --env production
```

### Environment-Specific Tokens

Generate tokens for different environments:

```bash
# Development token (uses dev database)
embed token dashboard-123 --env development

# Production token (uses prod database)  
embed token dashboard-123 --env production
```

## Best Practices

### Naming Conventions
- Use descriptive names: `production`, `staging`, `development`
- Include tenant/customer info: `customer-a-prod`, `customer-b-staging`
- Use consistent patterns across your team

### Data Source Naming
- Use logical names that describe the data: `main_db`, `analytics`, `cache`
- Keep names consistent across environments
- Avoid database-specific names in your models

### Security Considerations
- **Separate credentials** for each environment
- **Read-only access** for production data in non-prod environments
- **Network isolation** between environments when possible
- **Audit access** to production environments

### Environment Lifecycle
1. **Create** environments for each deployment stage
2. **Test** with development/staging environments first
3. **Deploy** to production only after validation
4. **Monitor** environment usage and performance
5. **Clean up** unused environments regularly

## Environment Configuration Examples

### Simple Web App
```bash
# Development
main_db → local-postgres
redis_cache → local-redis

# Production  
main_db → aws-rds-postgres
redis_cache → aws-elasticache
```

### Analytics Platform
```bash
# Staging
transactional_db → postgres-staging
data_warehouse → snowflake-staging
clickstream → kafka-staging

# Production
transactional_db → postgres-prod
data_warehouse → snowflake-prod
clickstream → kafka-prod
```

### Multi-Region Setup
```bash
# US Region
main_db → postgres-us-east
analytics → bigquery-us

# EU Region
main_db → postgres-eu-west  
analytics → bigquery-eu
```

## Troubleshooting

### Environment Not Found
```bash
# List available environments
embed env list

# Check environment name spelling
embed env set-default <correct-environment-name>
```

### Data Source Mapping Issues
- Ensure data source names match those used in your Embeddable models
- Verify database connections exist and are working
- Check connection permissions for the mapped databases

### Token Generation Fails
- Verify the environment exists: `embed env list`
- Check the default environment is set: `embed config`
- Ensure all mapped connections are valid: `embed database list`

For more troubleshooting help, see the [Troubleshooting Guide](troubleshooting.md).

For complete setup examples, see [Examples](examples.md).