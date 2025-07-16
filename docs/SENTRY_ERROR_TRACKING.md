# Sentry Error Tracking for AI Glossary Pro

## 🎯 Overview

Sentry provides comprehensive error tracking and performance monitoring for AI Glossary Pro, enabling real-time visibility into application health, user experience issues, and system performance across both frontend and backend components.

## 🏗️ Architecture

### Error Tracking Stack

- **Frontend**: `@sentry/react` with browser tracing and session replay
- **Backend**: `@sentry/node` with Node.js profiling and Express integration
- **Performance**: Transaction tracing, database query monitoring, API response times
- **User Context**: Authentication state, user journey tracking, session management

### Data Flow

```
User Action → Error/Event → Sentry SDK → Filter/Sanitize → Sentry Cloud → Dashboard/Alerts
```

## 🚀 Quick Setup

### 1. Get Sentry DSN

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project:
   - Platform: **Node.js**
   - Framework: **Express**
   - Name: **AI Glossary Pro**
3. Copy the DSN from project settings

### 2. Automated Setup

```bash
# Run the interactive setup script
./scripts/setup-sentry-production.sh

# Follow the prompts to configure your DSN
```

### 3. Manual Configuration

Add to `.env.production`:

```bash
# Sentry Error Tracking
SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/1234567
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=aiglossary-pro@1.0.0

# Frontend Sentry
VITE_SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/1234567
```

## 🔧 Configuration

### Backend Configuration

The backend Sentry configuration (`server/config/sentry.ts`) includes:

```javascript
// Initialize Sentry with comprehensive monitoring
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% of transactions
  profilesSampleRate: 0.1, // 10% of transactions
  
  integrations: [
    nodeProfilingIntegration(),      // Performance profiling
    new Sentry.Integrations.Http(),  // HTTP request tracking
    new Sentry.Integrations.Express(), // Express middleware
    new Sentry.Integrations.Console(), // Console errors
  ],
  
  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove passwords, secrets, tokens
    return sanitizeEvent(event);
  }
});
```

### Frontend Configuration

The frontend Sentry configuration (`client/src/utils/sentry.ts`) includes:

```javascript
// Initialize React Sentry with browser features
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  
  integrations: [
    Sentry.browserTracingIntegration(), // Page load performance
    Sentry.replayIntegration({         // Session replay
      maskAllText: false,
      blockAllMedia: true,
    }),
  ],
  
  // Session replay configuration
  replaysSessionSampleRate: 0.01,  // 1% of sessions
  replaysOnErrorSampleRate: 1.0,   // 100% of error sessions
});
```

## 📊 Features and Capabilities

### Error Tracking

#### Automatic Error Capture

```javascript
// Uncaught exceptions
throw new Error('Something went wrong');

// Unhandled promise rejections
Promise.reject(new Error('Async error'));

// Express middleware errors
app.use((err, req, res, next) => {
  // Automatically captured by Sentry
});
```

#### Manual Error Capture

```javascript
import { captureException, captureMessage } from '../config/sentry.js';

// Capture exceptions with context
captureException(error, {
  user: { id: 'user123', email: 'user@example.com' },
  tags: { component: 'api', endpoint: '/terms' },
  extra: { termId: '123', query: 'neural networks' },
  level: 'error'
});

// Capture custom messages
captureMessage('Payment processed successfully', 'info', {
  tags: { component: 'payment', provider: 'gumroad' },
  extra: { amount: 29.99, orderId: 'order-123' }
});
```

### Performance Monitoring

#### Transaction Tracking

```javascript
import { startTransaction } from '../config/sentry.js';

// Track database operations
const transaction = startTransaction('Database Query', 'db.query', 'Fetch terms');
try {
  const results = await db.query('SELECT * FROM terms');
  transaction.setTag('resultCount', results.length);
  return results;
} finally {
  transaction.finish();
}
```

#### API Performance

```javascript
// Automatic API endpoint monitoring
app.get('/api/terms/:id', async (req, res) => {
  // Request automatically tracked
  const term = await getTermById(req.params.id);
  res.json(term);
});
```

### User Context and Breadcrumbs

#### User Context

```javascript
import { setUser, addBreadcrumb } from '../config/sentry.js';

// Set user context on login
setUser({
  id: user.id,
  email: user.email,
  username: user.username
});

// Add breadcrumbs for user actions
addBreadcrumb('User searched for terms', 'search', 'info', {
  query: 'machine learning',
  resultCount: 42
});
```

#### Navigation Tracking

```javascript
// Frontend breadcrumb tracking
import { captureUserAction } from '../utils/sentry.ts';

// Track user interactions
captureUserAction('term_view', {
  termId: 'neural-networks',
  category: 'deep-learning',
  userId: currentUser.id
});
```

## 🎨 Usage Patterns

### Error Categories

#### API Errors

```javascript
// Database connectivity issues
captureException(new Error('Database connection timeout'), {
  tags: { component: 'database', operation: 'connect' },
  extra: { connectionString: 'postgresql://...', timeout: '5000ms' }
});

// External API failures
captureException(new Error('OpenAI API rate limit exceeded'), {
  tags: { component: 'ai', provider: 'openai' },
  extra: { endpoint: '/completions', retryAfter: '60s' }
});
```

#### Authentication Errors

```javascript
// Invalid tokens
captureException(new Error('JWT token expired'), {
  tags: { component: 'auth', action: 'token_validation' },
  extra: { tokenAge: '2h', userId: 'user123' }
});

// Login failures
captureMessage('Login attempt failed', 'warning', {
  tags: { component: 'auth', action: 'login' },
  extra: { reason: 'invalid_credentials', attempts: 3 }
});
```

#### Payment Errors

```javascript
// Gumroad webhook failures
captureException(new Error('Webhook signature verification failed'), {
  tags: { component: 'payment', provider: 'gumroad' },
  extra: { webhookId: 'webhook123', signature: '[redacted]' }
});

// Payment processing
captureMessage('Payment successfully processed', 'info', {
  tags: { component: 'payment', status: 'success' },
  extra: { amount: 29.99, currency: 'USD', orderId: 'order-456' }
});
```

### Frontend Error Handling

#### React Error Boundaries

```javascript
import { withErrorBoundary } from '../utils/sentry.ts';

// Wrap components with error boundaries
const SafeTermDisplay = withErrorBoundary(TermDisplay, {
  fallback: ErrorFallback,
  onError: (error, errorInfo) => {
    console.error('Term display error:', error);
  }
});
```

#### UI Error Tracking

```javascript
import { captureUIError } from '../utils/sentry.ts';

// Track component errors
try {
  await searchTerms(query);
} catch (error) {
  captureUIError(error, {
    component: 'SearchComponent',
    action: 'search_terms',
    userId: user.id,
    props: { query, filters }
  });
}
```

## 🔒 Security and Privacy

### Data Sanitization

#### Automatic Filtering

```javascript
// Sensitive data is automatically filtered
const sensitiveFields = ['password', 'secret', 'token', 'key'];

beforeSend(event, hint) {
  // Remove sensitive data from all contexts
  return sanitizeSensitiveData(event, sensitiveFields);
}
```

#### Manual Sanitization

```javascript
// Sanitize before sending
captureException(error, {
  extra: {
    userEmail: user.email,           // Safe to include
    password: '[FILTERED]',          // Manually filtered
    query: sanitizeQuery(query),     // Cleaned query
    timestamp: new Date().toISOString()
  }
});
```

### Environment-Based Filtering

```javascript
// Only send errors in production
beforeSend(event, hint) {
  if (process.env.NODE_ENV !== 'production') {
    return null; // Don't send in development
  }
  return event;
}
```

## 📈 Monitoring and Alerting

### Dashboard Metrics

Monitor these key metrics in your Sentry dashboard:

1. **Error Rate**: Errors per minute/hour
2. **User Impact**: Number of users affected
3. **Performance**: Transaction response times
4. **Release Health**: Error rate by release version
5. **Custom Metrics**: Business-specific events

### Alert Configuration

#### Error Alerts

```yaml
# Alert when error rate exceeds threshold
Error Rate Alert:
  condition: "error_rate > 10 per minute"
  channels: ["email", "slack"]
  environments: ["production"]

# Alert for new error types
New Issue Alert:
  condition: "new issue created"
  channels: ["slack"]
  filters: ["level:error", "level:fatal"]
```

#### Performance Alerts

```yaml
# Alert for slow transactions
Performance Alert:
  condition: "avg_transaction_duration > 2000ms"
  metric: "api_response_time"
  channels: ["email"]
```

### Custom Dashboards

Create dashboards for:

- **API Performance**: Response times by endpoint
- **User Experience**: Error rates by user segment
- **Feature Health**: Errors by application feature
- **Infrastructure**: Database and external service errors

## 🧪 Testing and Validation

### Test Scripts

```bash
# Quick configuration test
node scripts/test-sentry-setup.js

# Comprehensive testing
node scripts/test-sentry-comprehensive.js

# Check status
./scripts/sentry-status.sh
```

### Manual Testing

```javascript
// Test error capture
throw new Error('Test error for Sentry validation');

// Test performance monitoring
const transaction = Sentry.startTransaction({
  name: 'Test Transaction',
  op: 'test'
});
setTimeout(() => transaction.finish(), 1000);

// Test user context
Sentry.setUser({ id: 'test-user', email: 'test@example.com' });
```

## 🚀 Deployment

### Production Checklist

- [ ] Sentry DSN configured in `.env.production`
- [ ] Environment set to `production`
- [ ] Release version configured
- [ ] Error filtering rules tested
- [ ] Alert rules configured
- [ ] Team access configured
- [ ] Integration tests passed

### Release Tracking

```bash
# Associate errors with releases
SENTRY_RELEASE=aiglossary-pro@1.2.0

# Track deployments
sentry-cli releases new $SENTRY_RELEASE
sentry-cli releases deploys $SENTRY_RELEASE new -e production
```

## 🔧 Troubleshooting

### Common Issues

#### DSN Not Working

```bash
# Test connectivity
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' \
  "https://your-dsn@sentry.io/api/1234567/store/"
```

#### Events Not Appearing

```javascript
// Check environment
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('SENTRY_DSN:', process.env.SENTRY_DSN ? 'configured' : 'missing');

// Force flush
await Sentry.flush(2000);
```

#### Performance Issues

```javascript
// Reduce sample rates
Sentry.init({
  tracesSampleRate: 0.01,        // 1% instead of 10%
  profilesSampleRate: 0.01,      // 1% instead of 10%
  replaysSessionSampleRate: 0.001 // 0.1% instead of 1%
});
```

### Debug Mode

```bash
# Enable Sentry debug logging
DEBUG=sentry:* node server/index.js

# Frontend debug
localStorage.setItem('DEBUG', 'sentry:*');
```

## 📊 Best Practices

### Error Handling Strategy

1. **Graceful Degradation**: Always provide fallbacks
2. **User-Friendly Messages**: Don't expose technical details
3. **Context Rich**: Include relevant debugging information
4. **Performance Aware**: Monitor impact of error tracking

### Performance Monitoring

1. **Sample Appropriately**: Balance data quality vs. performance
2. **Focus on Critical Paths**: Monitor key user journeys
3. **Set Thresholds**: Define acceptable performance baselines
4. **Regular Review**: Analyze trends and optimize bottlenecks

### Data Management

1. **Privacy First**: Filter sensitive data automatically
2. **Retention Policies**: Configure appropriate data retention
3. **Access Control**: Limit team access to production data
4. **Compliance**: Ensure GDPR/CCPA compliance for user data

## 🎯 Integration Examples

### Express Middleware

```javascript
import { sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from './config/sentry.js';

// Add Sentry middleware
app.use(sentryRequestHandler);
app.use(sentryTracingHandler);

// Your routes here
app.get('/api/terms', getTerms);

// Error handler (must be last)
app.use(sentryErrorHandler);
```

### React Error Boundaries

```javascript
import { ErrorBoundary } from '@sentry/react';

function App() {
  return (
    <ErrorBoundary 
      fallback={ErrorFallback}
      showDialog={false}
    >
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/terms/:id" element={<TermPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

### Custom Context

```javascript
// Add business context to errors
Sentry.withScope(scope => {
  scope.setTag('feature', 'search');
  scope.setTag('userType', 'premium');
  scope.setContext('search', {
    query: 'neural networks',
    resultCount: 42,
    duration: '150ms'
  });
  
  Sentry.captureException(error);
});
```

## 🔮 Advanced Features

### Custom Instrumentation

```javascript
// Custom performance instrumentation
const span = Sentry.startSpan({
  name: 'AI Content Generation',
  op: 'ai.generate'
}, async () => {
  const content = await openai.createCompletion(prompt);
  span.setData('tokens', content.usage.total_tokens);
  return content;
});
```

### Release Health

```javascript
// Track feature adoption
Sentry.addBreadcrumb({
  message: 'User enabled dark mode',
  category: 'feature.usage',
  data: { feature: 'dark_mode', enabled: true }
});
```

### Custom Metrics

```javascript
// Business metrics
Sentry.metrics.increment('search.performed', 1, {
  tags: { query_type: 'semantic', user_type: 'premium' }
});

Sentry.metrics.distribution('search.duration', duration, {
  tags: { complexity: 'high' }
});
```

## 📝 Maintenance

### Regular Tasks

1. **Weekly Review**: Check error trends and new issues
2. **Monthly Optimization**: Adjust sampling rates and filters
3. **Quarterly Audit**: Review data retention and access
4. **Release Updates**: Update SDK versions and configurations

### Health Checks

```bash
# Monitor Sentry health
curl -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  "https://sentry.io/api/0/projects/$ORG/$PROJECT/stats/"

# Check quota usage
curl -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  "https://sentry.io/api/0/organizations/$ORG/stats/"
```

---

*This Sentry configuration provides comprehensive error tracking and performance monitoring for AI Glossary Pro, ensuring optimal application reliability and user experience in production.*