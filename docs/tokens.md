# Security Tokens

Learn how to generate and use security tokens for secure dashboard embedding.

## What are Security Tokens?

Security tokens are JWT tokens that enable secure embedding of Embeddable dashboards. They provide:

- **Authentication**: Verify the request is authorized
- **User Context**: Associate dashboard views with specific users
- **Row-Level Security**: Filter data based on user permissions
- **Time-Based Access**: Control how long the token remains valid

## Token Generation

### Basic Token Generation

```bash
embed token <embeddable-id>
```

### Interactive Token Generation

```bash
embed token
# CLI will prompt you to:
# 1. Select an embeddable from your workspace
# 2. Configure token options (user ID, expiration, filters)
```

### With Specific Environment

```bash
embed token <embeddable-id> --env production
```

## Token Configuration Options

When generating tokens interactively, you can specify:

### Expiration Time
How long the token remains valid:
- `1h` - 1 hour
- `24h` - 24 hours (default)
- `7d` - 7 days
- `30d` - 30 days

### User ID (Optional)
Links the dashboard view to a specific user:
```
User ID: user123
```

### Security Filters (Optional)
Row-level security rules in JSON format:
```json
{
  "customer_id": 123,
  "department": "sales",
  "region": "us-east"
}
```

## Token Usage

### Frontend Integration

Use the generated token in your web application:

```javascript
// Example with React
import { EmbeddedDashboard } from '@embeddable/react';

function Dashboard() {
  return (
    <EmbeddedDashboard
      token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      // other props
    />
  );
}
```

### Direct HTML Embedding

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.embeddable.com/sdk.js"></script>
</head>
<body>
  <div id="dashboard"></div>
  <script>
    embeddable.init({
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      container: '#dashboard'
    });
  </script>
</body>
</html>
```

## Security Context Examples

### Multi-Tenant SaaS Application

Filter data to show only the customer's own data:

```json
{
  "customer_id": 456,
  "plan_type": "premium"
}
```

### Internal Company Dashboard

Restrict access by department and role:

```json
{
  "department": "marketing",
  "role": "manager",
  "office_location": "new-york"
}
```

### Partner Portal

Limit data access to specific regions or products:

```json
{
  "partner_id": "ACME-CORP",
  "allowed_regions": ["us-west", "us-east"],
  "product_access": ["product-a", "product-b"]
}
```

### Geographic Restrictions

Show data only for specific geographic regions:

```json
{
  "country": "US",
  "state": "CA",
  "region": "west-coast"
}
```

## Token Security Best Practices

### Server-Side Generation
**Always generate tokens on your server**, never in client-side code:

```javascript
// ❌ BAD: Client-side token generation
const token = generateEmbeddableToken(apiKey, embeddableId);

// ✅ GOOD: Server-side token generation
app.post('/api/dashboard-token', async (req, res) => {
  const token = await generateEmbeddableToken({
    embeddableId: req.body.embeddableId,
    userId: req.user.id,
    filters: getUserFilters(req.user)
  });
  res.json({ token });
});
```

### Short Expiration Times
Use short-lived tokens to minimize security risks:
- **Interactive dashboards**: 1-4 hours
- **Automated reports**: 15-30 minutes
- **Public dashboards**: Longer periods acceptable

### User-Specific Filters
Always include user-specific security filters:

```javascript
// Generate user-specific filters
const securityFilters = {
  user_id: currentUser.id,
  organization_id: currentUser.organizationId,
  access_level: currentUser.role
};
```

### Validate User Permissions
Ensure users can only access data they're authorized to see:

```javascript
// Validate user has access to the dashboard
if (!userCanAccessDashboard(user, embeddableId)) {
  throw new Error('Unauthorized');
}

// Generate token with appropriate filters
const token = generateToken({
  embeddableId,
  userId: user.id,
  filters: getUserDataFilters(user)
});
```

## Token Lifecycle Management

### Token Refresh Strategy

For long-running dashboards, implement token refresh:

```javascript
// Client-side token refresh
async function refreshToken() {
  const response = await fetch('/api/refresh-dashboard-token', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${userAuthToken}` }
  });
  const { token } = await response.json();
  
  // Update dashboard with new token
  dashboard.updateToken(token);
}

// Refresh before expiration
setInterval(refreshToken, 30 * 60 * 1000); // 30 minutes
```

### Token Revocation

For sensitive applications, implement token revocation:

```javascript
// Server-side token tracking
const activeTokens = new Set();

// Generate and track token
function generateTrackedToken(params) {
  const token = generateToken(params);
  activeTokens.add(token);
  return token;
}

// Revoke user tokens on logout/role change
function revokeUserTokens(userId) {
  // Implementation depends on your token storage strategy
  activeTokens.forEach(token => {
    if (getTokenUserId(token) === userId) {
      activeTokens.delete(token);
    }
  });
}
```

## Common Use Cases

### Public Dashboards
For public-facing dashboards with no user-specific data:

```bash
# Generate token without user ID or filters
embed token public-dashboard-123
# Expiration: 7d (longer is acceptable for public data)
# User ID: (leave empty)
# Security filters: (none needed)
```

### Customer-Specific Dashboards
For SaaS applications where customers see only their data:

```bash
embed token customer-analytics-456
# User ID: customer_789
# Security filters: {"customer_id": 789, "plan": "enterprise"}
```

### Internal Analytics
For internal company dashboards with department-level access:

```bash
embed token internal-metrics-123
# User ID: employee_456
# Security filters: {"department": "sales", "office": "nyc"}
```

## Troubleshooting Tokens

### Token Validation Errors
- **Expired token**: Generate a new token
- **Invalid signature**: Check API key and region
- **Missing permissions**: Verify user has access to the embeddable

### Data Access Issues
- **No data visible**: Check security filters match your data structure
- **Partial data**: Verify filters aren't too restrictive
- **Wrong data**: Ensure filters correctly identify the user's data

### Performance Issues
- **Slow loading**: Consider optimizing security filter queries
- **Frequent refreshes**: Increase token expiration time if appropriate

For more troubleshooting help, see the [Troubleshooting Guide](troubleshooting.md).

For complete implementation examples, see [Examples](examples.md).