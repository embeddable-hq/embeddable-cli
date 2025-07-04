# Examples

Common workflows and real-world examples using the Embeddable CLI.

## Quick Start Examples

### Complete First-Time Setup

```bash
# 1. Run the setup wizard (recommended for new users)
embed setup
# Follow prompts to configure API, database, and environment

# 2. Verify setup
embed config
embed database list
embed env list
```

### Manual Setup Flow

```bash
# 1. Initialize authentication
embed init

# 2. Create database connection
embed database connect

# 3. Create environment
embed env create

# 4. Set as default
embed env set-default production

# 5. Generate token
embed token
```

## Database Connection Examples

### PostgreSQL Connection

```bash
# Interactive setup
embed database connect
# Choose PostgreSQL, enter details

# Or using JSON
embed database connect --json '{
  "name": "postgres-prod",
  "type": "postgresql", 
  "host": "db.example.com",
  "port": 5432,
  "database": "analytics",
  "username": "embeddable_readonly",
  "password": "secure_password"
}'
```

### BigQuery Connection

```bash
# Create service account JSON file first
cat > bigquery-config.json << 'EOF'
{
  "name": "bigquery-analytics",
  "type": "bigquery",
  "config": {
    "type": "service_account",
    "project_id": "my-analytics-project",
    "private_key_id": "key-id",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "client_email": "embeddable@my-project.iam.gserviceaccount.com",
    "client_id": "123456789",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token"
  }
}
EOF

# Create connection from file
embed database connect --file bigquery-config.json
```

### Multiple Database Setup

```bash
# Primary PostgreSQL database
embed database connect --json '{
  "name": "main-db",
  "type": "postgresql",
  "host": "postgres.example.com",
  "port": 5432,
  "database": "app_production",
  "username": "embeddable_user",
  "password": "secure_pass"
}'

# Analytics data warehouse
embed database connect --json '{
  "name": "warehouse",
  "type": "snowflake",
  "config": {
    "account": "company.snowflakecomputing.com",
    "username": "analytics_user",
    "password": "secure_pass",
    "warehouse": "ANALYTICS_WH",
    "database": "ANALYTICS_DB",
    "schema": "PUBLIC"
  }
}'
```

## Environment Management Examples

### Development/Staging/Production Setup

```bash
# Development environment
embed env create
# Name: development
# Map: main_db -> local-postgres, analytics -> local-snowflake

# Staging environment  
embed env create
# Name: staging
# Map: main_db -> staging-postgres, analytics -> staging-snowflake

# Production environment
embed env create
# Name: production
# Map: main_db -> prod-postgres, analytics -> prod-snowflake

# Set production as default
embed env set-default production
```

### Multi-Tenant Environment Setup

```bash
# Customer A environment
embed env create
# Name: customer-a-prod
# Map: main_db -> postgres-customer-a, analytics -> bigquery-customer-a

# Customer B environment
embed env create  
# Name: customer-b-prod
# Map: main_db -> postgres-customer-b, analytics -> bigquery-customer-b

# List all environments
embed env list
```

## Token Generation Examples

### Basic Token for Public Dashboard

```bash
# Generate token for public dashboard
embed token public-metrics-dashboard

# Configuration:
# Expiration: 7d
# User ID: (none)
# Security filters: (none)
```

### Customer-Specific Dashboard Token

```bash
# Generate token for customer dashboard
embed token customer-analytics --env production

# Configuration:
# Expiration: 4h
# User ID: customer_123
# Security filters: {"customer_id": 123, "plan": "enterprise"}
```

### Internal Dashboard with Department Access

```bash
# Generate token for sales dashboard
embed token sales-dashboard --env production

# Configuration:
# Expiration: 8h
# User ID: employee_456
# Security filters: {"department": "sales", "region": "us-east", "role": "manager"}
```

## Multi-Environment Workflows

### Feature Development Workflow

```bash
# 1. Create feature branch environment
embed env create
# Name: feature-new-metrics
# Map data sources to staging databases

# 2. Test with feature environment
embed token new-dashboard --env feature-new-metrics

# 3. Deploy to staging
embed token new-dashboard --env staging

# 4. Deploy to production
embed token new-dashboard --env production
```

### A/B Testing Setup

```bash
# Environment A (control)
embed env create  
# Name: experiment-control
# Map: main_db -> prod-postgres, analytics -> bigquery-control

# Environment B (variant)
embed env create
# Name: experiment-variant  
# Map: main_db -> prod-postgres, analytics -> bigquery-variant

# Generate tokens for each variant
embed token experiment-dashboard --env experiment-control
embed token experiment-dashboard --env experiment-variant
```

## Scripted Automation Examples

### Automated Environment Setup

```bash
#!/bin/bash
# setup-environments.sh

set -e

echo "Setting up development environments..."

# Development
embed database connect --json '{
  "name": "dev-postgres",
  "type": "postgresql",
  "host": "localhost",
  "port": 5432,
  "database": "myapp_dev",
  "username": "dev_user",
  "password": "dev_pass"
}'

embed env create
# Follow prompts or automate with expect/similar

echo "Development environment ready!"
```

### Token Generation Script

```bash
#!/bin/bash
# generate-customer-token.sh

CUSTOMER_ID=$1
EMBEDDABLE_ID=$2

if [[ -z "$CUSTOMER_ID" || -z "$EMBEDDABLE_ID" ]]; then
  echo "Usage: $0 <customer-id> <embeddable-id>"
  exit 1
fi

echo "Generating token for customer $CUSTOMER_ID..."

# Note: This would need to be adapted for non-interactive use
embed token "$EMBEDDABLE_ID" --env production
```

### Batch Customer Setup

```bash
#!/bin/bash
# setup-customers.sh

CUSTOMERS=("customer-a" "customer-b" "customer-c")

for customer in "${CUSTOMERS[@]}"; do
  echo "Setting up environment for $customer..."
  
  # Create customer database connection
  embed database connect --json "{
    \"name\": \"${customer}-db\",
    \"type\": \"postgresql\",
    \"host\": \"${customer}.db.example.com\",
    \"port\": 5432,
    \"database\": \"${customer}_prod\",
    \"username\": \"embeddable_user\",
    \"password\": \"${customer}_secure_pass\"
  }"
  
  # Create customer environment would need interactive handling
  # embed env create (automated with expect or similar tool)
  
  echo "✅ $customer setup complete"
done
```

## Integration Examples

### Node.js Application Integration

```javascript
// server.js - Express.js example
const express = require('express');
const { exec } = require('child_process');
const app = express();

// Generate dashboard token for authenticated user
app.post('/api/dashboard-token', (req, res) => {
  const { embeddableId, userId } = req.body;
  
  // In production, you'd call the Embeddable API directly
  // This example shows CLI integration for demonstration
  const command = `embed token ${embeddableId} --env production`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: 'Token generation failed' });
    }
    
    // Parse CLI output to extract token
    const token = extractTokenFromOutput(stdout);
    res.json({ token });
  });
});

function extractTokenFromOutput(output) {
  // Implementation to parse CLI output and extract token
  const lines = output.split('\n');
  // Find token in output...
  return token;
}
```

### CI/CD Pipeline Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy Dashboard

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install Embeddable CLI
        run: |
          curl -L https://github.com/embeddable-hq/embeddable-cli/releases/latest/download/embed-linux-x64.tar.gz | tar xz
          chmod +x embed-linux-x64
          sudo mv embed-linux-x64 /usr/local/bin/embed
      
      - name: Configure CLI
        run: |
          embed auth login
        env:
          EMBEDDABLE_API_KEY: ${{ secrets.EMBEDDABLE_API_KEY }}
          EMBEDDABLE_REGION: ${{ secrets.EMBEDDABLE_REGION }}
      
      - name: Test database connections
        run: |
          embed database list
          embed database test production-db
      
      - name: Validate environments
        run: |
          embed env list
          embed config
```

## Troubleshooting Examples

### Debug Connection Issues

```bash
# Enable debug mode
export DEBUG=1

# Test connection with detailed output
embed database test problematic-connection

# Check configuration
embed config

# Verify API connectivity
embed auth status
```

### Fix Environment Issues

```bash
# List all environments and their mappings
embed env list

# Check if environment exists
embed env list | grep "my-environment"

# Reset default environment
embed env set-default production

# Verify token generation works
embed token test-dashboard --env production
```

### Validate Complete Setup

```bash
# Full system check
echo "=== Authentication ==="
embed auth status

echo "=== Database Connections ==="
embed database list

echo "=== Environments ==="
embed env list

echo "=== Configuration ==="
embed config

echo "=== Test Token Generation ==="
embed token --help
```

For more detailed troubleshooting, see the [Troubleshooting Guide](troubleshooting.md).