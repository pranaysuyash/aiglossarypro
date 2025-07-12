# Production Monitoring & Analytics Setup Guide

## 🔍 Overview

This guide covers the complete setup of monitoring, analytics, and observability for the AI/ML Glossary Pro application in production.

## 📊 Monitoring Stack

### 1. Error Tracking (Sentry)

#### Setup Process
1. **Create Sentry Account**
   - Visit [sentry.io](https://sentry.io)
   - Create new organization and project
   - Select "Node.js" and "React" platforms

2. **Configuration**
   ```bash
   # Environment variables
   SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   SENTRY_ENVIRONMENT=production
   SENTRY_RELEASE=1.0.0
   ```

3. **Features Enabled**
   - Error tracking and alerting
   - Performance monitoring
   - Release tracking
   - User context and breadcrumbs

#### Monitoring Capabilities
- **Server-side errors**: Unhandled exceptions, API errors
- **Client-side errors**: JavaScript errors, React component errors
- **Performance**: Slow transactions, database queries
- **Releases**: Deploy tracking, regression detection

### 2. Analytics (PostHog)

#### Setup Process
1. **Create PostHog Account**
   - Visit [posthog.com](https://posthog.com)
   - Create new project
   - Get project API key

2. **Configuration**
   ```bash
   # Client-side analytics
   VITE_POSTHOG_KEY=phc_your-posthog-key
   POSTHOG_HOST=https://app.posthog.com
   
   # Server-side analytics
   POSTHOG_API_KEY=your-server-side-api-key
   ```

3. **Events Tracked**
   - User registration and login
   - Term searches and views
   - Premium upgrade funnel
   - Payment completion
   - Content engagement

#### Analytics Features
- **User tracking**: Session recording, heatmaps
- **Conversion funnels**: Registration → Premium upgrade
- **Feature flags**: A/B testing capabilities
- **Cohort analysis**: User retention and engagement

### 3. Google Analytics 4

#### Setup Process
1. **Create GA4 Property**
   - Visit [analytics.google.com](https://analytics.google.com)
   - Create new GA4 property
   - Set up data streams

2. **Configuration**
   ```bash
   VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   VITE_GA4_API_SECRET=your-ga4-api-secret
   ```

3. **Enhanced Ecommerce**
   - Purchase tracking
   - Revenue attribution
   - Product performance
   - Customer lifetime value

## 🚨 Alerting & Notifications

### 1. Error Rate Alerts

#### Sentry Alerts
```yaml
# Alert rules in Sentry
Error Rate Alert:
  condition: error_rate > 5%
  time_window: 5 minutes
  notification: email, slack

Performance Alert:
  condition: p95_response_time > 2000ms
  time_window: 10 minutes
  notification: email

New Issue Alert:
  condition: new_error_detected
  notification: slack, email
```

#### Custom Health Checks
```bash
# Health check endpoints to monitor
/api/health              # Application health
/api/db/health          # Database connectivity
/api/cache/health       # Redis connectivity
/api/webhooks/gumroad/health  # Payment webhooks
```

### 2. Performance Monitoring

#### Key Metrics to Track
```yaml
Application Metrics:
  - Response time (P50, P95, P99)
  - Error rate (4xx, 5xx)
  - Throughput (requests per minute)
  - Memory usage
  - CPU utilization

Database Metrics:
  - Query response time
  - Connection pool usage
  - Slow query count
  - Lock waits

Cache Metrics:
  - Hit rate
  - Memory usage
  - Eviction rate
  - Connection count

Business Metrics:
  - User registrations
  - Premium conversions
  - Revenue
  - Active users
```

### 3. Uptime Monitoring

#### External Monitoring Services
```yaml
Uptime Robot Configuration:
  monitors:
    - url: https://aimlglossary.com
      interval: 5 minutes
      alert_contacts: [email, sms]
    
    - url: https://aimlglossary.com/api/health
      interval: 5 minutes
      alert_contacts: [email]
    
    - url: https://aimlglossary.com/api/webhooks/gumroad/health
      interval: 15 minutes
      alert_contacts: [email]
```

## 📈 Performance Monitoring

### 1. Lighthouse Monitoring

#### Automated Performance Audits
```bash
# Lighthouse CI configuration in .github/workflows/lighthouse.yml
name: Lighthouse CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
```

#### Performance Budgets
```javascript
// lighthouse.config.js
module.exports = {
  ci: {
    collect: {
      url: ['https://aimlglossary.com', 'https://aimlglossary.com/terms'],
      startServerCommand: 'npm run start',
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-cpu-idle': ['error', { maxNumericValue: 3000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### 2. Real User Monitoring (RUM)

#### Web Vitals Tracking
```javascript
// Client-side performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to PostHog
  posthog.capture('web_vital', {
    metric_name: metric.name,
    metric_value: metric.value,
    metric_rating: metric.rating,
  });
  
  // Send to GA4
  gtag('event', metric.name, {
    metric_value: metric.value,
    custom_parameter: metric.rating,
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## 🔐 Security Monitoring

### 1. Security Headers Monitoring

#### Security Headers Checklist
```bash
# Headers to monitor
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### 2. Authentication Monitoring

#### Auth Event Tracking
```javascript
// Track authentication events
const authEvents = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  ACCOUNT_LOCKED: 'account_locked',
  SUSPICIOUS_LOGIN: 'suspicious_login',
};

// Monitor for suspicious patterns
const suspiciousPatterns = {
  multipleFailedLogins: 5,
  loginFromNewLocation: true,
  unusualLoginTime: true,
};
```

## 💰 Business Intelligence

### 1. Revenue Tracking

#### Gumroad Sales Analytics
```javascript
// Track purchase events
const purchaseEvents = {
  PURCHASE_INITIATED: 'purchase_initiated',
  PURCHASE_COMPLETED: 'purchase_completed',
  PURCHASE_FAILED: 'purchase_failed',
  REFUND_REQUESTED: 'refund_requested',
  REFUND_PROCESSED: 'refund_processed',
};

// Revenue metrics
const revenueMetrics = {
  totalRevenue: 'sum of all completed purchases',
  averageOrderValue: 'average purchase amount',
  conversionRate: 'purchases / visits',
  customerLifetimeValue: 'revenue per customer',
  churnRate: 'refunds / purchases',
};
```

### 2. User Engagement Tracking

#### Content Engagement Metrics
```javascript
// Track user interactions
const engagementEvents = {
  TERM_VIEWED: 'term_viewed',
  SEARCH_PERFORMED: 'search_performed',
  CATEGORY_BROWSED: 'category_browsed',
  BOOKMARK_ADDED: 'bookmark_added',
  CONTENT_SHARED: 'content_shared',
  TIME_ON_PAGE: 'time_on_page',
  SCROLL_DEPTH: 'scroll_depth',
};

// Engagement metrics
const engagementMetrics = {
  pageViews: 'total page views',
  uniquePageViews: 'unique page views',
  bounceRate: 'single page sessions',
  sessionDuration: 'average session length',
  pagesPerSession: 'pages viewed per session',
};
```

## 📊 Dashboard Setup

### 1. Grafana Dashboard

#### Key Metrics Dashboard
```yaml
Grafana Panels:
  Application Health:
    - Response time (P50, P95, P99)
    - Error rate
    - Request volume
    - Active users
  
  Infrastructure:
    - CPU usage
    - Memory usage
    - Disk space
    - Network I/O
  
  Database:
    - Connection count
    - Query performance
    - Lock waits
    - Cache hit ratio
  
  Business Metrics:
    - Revenue (daily, monthly)
    - New registrations
    - Premium conversions
    - User retention
```

### 2. Custom Monitoring Scripts

#### Health Check Script
```bash
#!/bin/bash
# scripts/health-check.sh

# Application health
curl -f https://aimlglossary.com/api/health || exit 1

# Database health
npm run db:status || exit 1

# Redis health
redis-cli ping || exit 1

# External services
curl -f https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY" || exit 1

echo "All health checks passed"
```

#### Performance Monitoring Script
```bash
#!/bin/bash
# scripts/performance-monitor.sh

# Run Lighthouse audit
lighthouse https://aimlglossary.com \
  --chrome-flags="--headless" \
  --output=json \
  --output-path=./reports/lighthouse-$(date +%Y%m%d).json

# Analyze bundle size
npm run build:analyze

# Check Core Web Vitals
npm run perf:analyze
```

## 🚨 Incident Response

### 1. Incident Management

#### Alert Escalation
```yaml
Severity Levels:
  Critical (P0):
    - Site down
    - Payment system failure
    - Data breach
    Response: 15 minutes
    
  High (P1):
    - Elevated error rate (>10%)
    - Performance degradation (>5s response)
    - Authentication issues
    Response: 1 hour
    
  Medium (P2):
    - Elevated error rate (>5%)
    - Minor performance issues
    - Non-critical feature failures
    Response: 4 hours
    
  Low (P3):
    - Minor issues
    - Documentation problems
    - Enhancement requests
    Response: 24 hours
```

### 2. Runbooks

#### Common Issues
```markdown
## Database Connection Issues
1. Check database health: `npm run db:status`
2. Verify connection string: `echo $DATABASE_URL`
3. Check connection pool: Monitor active connections
4. Restart application if needed
5. Scale database if persistent

## High Error Rate
1. Check Sentry for error details
2. Identify error patterns
3. Check recent deployments
4. Rollback if necessary
5. Apply hotfix if identified

## Performance Degradation
1. Check resource utilization
2. Analyze slow queries
3. Check cache hit rates
4. Scale resources if needed
5. Optimize queries if identified
```

## 📝 Monitoring Checklist

### Pre-Production
- [ ] Sentry project configured and tested
- [ ] PostHog events tracking correctly
- [ ] GA4 enhanced ecommerce working
- [ ] Error alerts configured
- [ ] Performance monitoring active
- [ ] Health check endpoints responding

### Post-Production
- [ ] All monitoring dashboards populated
- [ ] Alert notifications working
- [ ] Performance baselines established
- [ ] Business metrics tracking
- [ ] Incident response procedures tested
- [ ] Team access and training completed

This comprehensive monitoring setup ensures full visibility into application health, performance, and business metrics.