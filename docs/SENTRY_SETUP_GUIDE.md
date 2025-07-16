# Sentry Error Tracking Setup Guide

## 🎯 What is Sentry?

Sentry is a real-time error tracking service that helps you:
- Monitor and fix crashes in real-time
- Track performance issues
- Debug production errors with detailed stack traces
- Get alerts when errors occur

## 📋 Setup Steps

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Click "Get Started"
3. Create a free account (14-day trial, then free tier available)

### 2. Create a New Project

1. Click "Create Project"
2. Select platform: **React**
3. Set alert frequency: "Alert me on every new issue"
4. Project name: `aiglossarypro`
5. Team: Create new team or use existing

### 3. Get Your DSN

After creating the project, you'll see a screen with your DSN:

```javascript
Sentry.init({
  dsn: "https://YOUR_DSN_HERE@sentry.io/PROJECT_ID",
});
```

Copy the DSN value (starts with `https://`).

### 4. Add to Environment

Add your DSN to `.env.production`:

```bash
# Error Tracking
SENTRY_DSN=https://YOUR_DSN_HERE@sentry.io/PROJECT_ID
VITE_SENTRY_DSN=https://YOUR_DSN_HERE@sentry.io/PROJECT_ID
```

### 5. Configure Sentry Settings

In your Sentry project settings:

1. **Project Settings → General**
   - Set project name: AI Glossary Pro
   - Add project slug: aiglossarypro

2. **Project Settings → Security & Privacy**
   - Enable: "Require TLS/SSL for inbound requests"
   - Set allowed domains: `aiglossarypro.com`

3. **Project Settings → Alerts**
   - Create alert rules for:
     - New errors
     - High error rates
     - Performance degradation

4. **Project Settings → Data Privacy**
   - Enable: "Scrub IP addresses"
   - Add sensitive fields to scrub:
     - password
     - token
     - secret
     - apiKey

## 🔧 Features Already Implemented

Your codebase already has:

✅ **Error Filtering** - Sensitive data is automatically filtered
✅ **Performance Monitoring** - Tracks slow operations
✅ **Session Replay** - Records user sessions when errors occur
✅ **User Context** - Associates errors with user IDs
✅ **Error Boundaries** - React components wrapped for error catching
✅ **Custom Error Types** - UI errors, API errors tracked separately

## 📊 What Sentry Will Track

### Automatic Tracking
- JavaScript errors
- Unhandled promise rejections
- Network request failures
- Performance issues
- Slow database queries

### Custom Tracking (Already Set Up)
- UI component errors
- API endpoint failures
- User actions (breadcrumbs)
- Performance metrics

## 🚨 Alert Configuration

### Recommended Alert Rules

1. **Critical Errors**
   - Condition: First seen error
   - Action: Email immediately

2. **Error Rate Spike**
   - Condition: Error rate > 10/minute
   - Action: Email + Slack notification

3. **Performance Degradation**
   - Condition: Page load > 5 seconds
   - Action: Email notification

## 📈 Dashboard Setup

### Key Metrics to Monitor

1. **Error Rate** - Errors per hour/day
2. **Affected Users** - Unique users experiencing errors
3. **Performance** - Page load times, API response times
4. **Trends** - Error patterns over time

### Create Custom Dashboards

1. Go to Dashboards → Create Dashboard
2. Add widgets for:
   - Error frequency by page
   - Top errors by occurrence
   - Performance by endpoint
   - User session replays

## 🔍 Debugging with Sentry

### When an Error Occurs

1. **Email Alert** - Get notified immediately
2. **Error Details** - View full stack trace
3. **User Context** - See which user was affected
4. **Session Replay** - Watch what the user did
5. **Breadcrumbs** - See events leading to error

### Source Maps

For production debugging, upload source maps:

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Upload source maps after build
sentry-cli releases files RELEASE_VERSION upload-sourcemaps ./dist
```

## 💰 Pricing

### Free Tier Includes
- 5,000 errors/month
- 10,000 performance events
- 50 session replays
- 1 team member

### Paid Plans
- Team: $26/month (50K errors)
- Business: $80/month (100K errors)
- Enterprise: Custom pricing

## ✅ Integration Checklist

- [ ] Create Sentry account
- [ ] Create React project
- [ ] Copy DSN to `.env.production`
- [ ] Configure privacy settings
- [ ] Set up alert rules
- [ ] Test error tracking locally
- [ ] Verify production tracking

## 🧪 Testing Sentry

### Local Testing

```javascript
// Add to any component to test
const testSentryError = () => {
  throw new Error("Test Sentry error tracking");
};

// Or in console
window.Sentry.captureException(new Error("Test error"));
```

### Production Testing

After deployment:
1. Trigger a test error
2. Check Sentry dashboard
3. Verify email alerts work
4. Test session replay

## 📞 Support

- **Documentation**: [docs.sentry.io](https://docs.sentry.io)
- **Support**: support@sentry.io
- **Status**: [status.sentry.io](https://status.sentry.io)

---

Your Sentry integration is ready! Just add your DSN and deploy. 🚀