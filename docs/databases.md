# Database Connections

Learn about supported databases and how to configure connections.

## Supported Database Types

The Embeddable CLI supports connections to:

- **PostgreSQL**
- **MySQL**
- **BigQuery**
- **Snowflake**
- **Amazon Redshift**

## Creating Connections

### Interactive Mode

The easiest way to create a connection:

```bash
embed database connect
```

This will prompt you for:
1. Database type
2. Connection details (host, port, credentials, etc.)
3. Test the connection before saving

### Non-Interactive Mode

For scripting or automation, use JSON configuration:

```bash
# Inline JSON
embed database connect --json '{"name":"prod-db","type":"postgresql",...}'

# From file
embed database connect --file connection.json
```

## Database-Specific Configuration

### PostgreSQL

```json
{
  "name": "postgres-prod",
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "myapp",
  "username": "readonly_user",
  "password": "secure_password"
}
```

### MySQL

```json
{
  "name": "mysql-prod",
  "type": "mysql",
  "host": "mysql.example.com",
  "port": 3306,
  "database": "analytics",
  "username": "readonly_user",
  "password": "secure_password"
}
```

### BigQuery

BigQuery requires a service account JSON configuration:

```json
{
  "name": "bigquery-prod",
  "type": "bigquery",
  "config": {
    "type": "service_account",
    "project_id": "your-project-id",
    "private_key_id": "key-id",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "client_email": "service-account@your-project.iam.gserviceaccount.com",
    "client_id": "123456789",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token"
  }
}
```

### Snowflake

```json
{
  "name": "snowflake-prod",
  "type": "snowflake",
  "config": {
    "account": "your-account.snowflakecomputing.com",
    "username": "readonly_user",
    "password": "secure_password",
    "warehouse": "COMPUTE_WH",
    "database": "ANALYTICS_DB",
    "schema": "PUBLIC"
  }
}
```

### Amazon Redshift

```json
{
  "name": "redshift-prod",
  "type": "redshift",
  "config": {
    "host": "redshift-cluster.abc123.region.redshift.amazonaws.com",
    "port": 5439,
    "database": "analytics",
    "username": "readonly_user",
    "password": "secure_password"
  }
}
```

## Connection Management

### List Connections
```bash
embed database list
```

Shows all configured connections with their details.

### Test Connections
```bash
# Test specific connection
embed database test <connection-id>

# Test during creation (default)
embed database connect

# Skip test during creation
embed database connect --skip-test
```

### Remove Connections
```bash
embed database remove <connection-id>
```

## Security Best Practices

### Database User Permissions

Create dedicated read-only users for Embeddable:

**PostgreSQL:**
```sql
-- Create read-only user
CREATE USER embeddable_readonly WITH PASSWORD 'secure_password';

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO embeddable_readonly;

-- Grant select on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO embeddable_readonly;

-- Grant select on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO embeddable_readonly;
```

**MySQL:**
```sql
-- Create read-only user
CREATE USER 'embeddable_readonly'@'%' IDENTIFIED BY 'secure_password';

-- Grant select permissions
GRANT SELECT ON myapp.* TO 'embeddable_readonly'@'%';

FLUSH PRIVILEGES;
```

### Network Security

1. **Firewall Rules**: Only allow connections from Embeddable's IP ranges
2. **SSL/TLS**: Always use encrypted connections when possible
3. **VPN/Private Networks**: Consider using private networking for sensitive data
4. **IP Whitelisting**: Restrict database access to specific IP addresses

### Credential Management

1. **Rotate Passwords**: Regularly update database passwords
2. **Strong Passwords**: Use complex, unique passwords
3. **Service Accounts**: Use dedicated service accounts for BigQuery
4. **Least Privilege**: Grant only necessary permissions

## Connection Testing

The CLI automatically tests connections when creating them. Test failures show helpful error messages:

### Common Connection Issues

**Connection Refused:**
- Check host and port are correct
- Verify database server is running
- Check firewall rules

**Authentication Failed:**
- Verify username and password
- Check user has connection permissions
- Ensure user exists in the database

**Database Not Found:**
- Verify database name is correct
- Check user has access to the database
- Ensure database exists

**Timeout:**
- Check network connectivity
- Verify firewall rules
- Ensure database accepts connections

## Advanced Configuration

### Connection Pooling

For high-traffic applications, consider connection pooling settings in your database configuration.

### SSL Configuration

Enable SSL for secure connections:

**PostgreSQL with SSL:**
```json
{
  "name": "postgres-ssl",
  "type": "postgresql",
  "host": "secure-db.example.com",
  "port": 5432,
  "database": "myapp",
  "username": "user",
  "password": "pass",
  "ssl": true
}
```

### Custom Ports

Use non-standard ports when needed:

```json
{
  "name": "custom-port-db",
  "type": "postgresql",
  "host": "db.example.com",
  "port": 5433,
  "database": "myapp",
  "username": "user",
  "password": "pass"
}
```

## Troubleshooting

For connection issues, see the [Troubleshooting Guide](troubleshooting.md).

For examples of complete database setup workflows, see [Examples](examples.md).