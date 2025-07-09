# Service Configuration Guides

This document provides detailed setup instructions for each production service required by AI Glossary Pro.

## Table of Contents

1. [Database Configuration](#database-configuration)
2. [Email Service Configuration](#email-service-configuration)
3. [Analytics Configuration](#analytics-configuration)
4. [Error Monitoring Configuration](#error-monitoring-configuration)
5. [Payment Processing Configuration](#payment-processing-configuration)
6. [Infrastructure Services](#infrastructure-services)
7. [Security Configuration](#security-configuration)

---

## Database Configuration

### PostgreSQL Setup

#### Option 1: Managed Database Services (Recommended)

**Neon (Recommended)**
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Choose your region
4. Copy the connection string
5. Set as `DATABASE_URL` in your environment

**Supabase**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Set as `DATABASE_URL` in your environment

**Railway**
1. Go to [Railway Dashboard](https://railway.app/)
2. Create a new project
3. Add PostgreSQL service
4. Copy the connection string from variables
5. Set as `DATABASE_URL` in your environment

#### Option 2: Self-Hosted PostgreSQL

**Docker Setup**
```bash
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: aiglossary
      POSTGRES_USER: your_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

**Connection String Format**
```
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

**SSL Configuration for Production**
```
DATABASE_URL=postgresql://username:password@host:5432/database_name?sslmode=require
```

#### Database Migrations

Run migrations after database setup:
```bash
npm run db:migrate
```

---

## Email Service Configuration

### Option 1: SendGrid (Recommended for Production)

**Setup Steps:**
1. Go to [SendGrid](https://sendgrid.com/)
2. Create an account
3. Verify your email address
4. Create an API key:
   - Go to Settings → API Keys
   - Create API Key with "Full Access"
   - Copy the API key

**Domain Authentication (Recommended):**
1. Go to Settings → Sender Authentication
2. Authenticate Your Domain
3. Follow DNS record setup instructions
4. Verify domain

**Environment Variables:**
```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=smtp
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME="AI Glossary Pro"
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
```

### Option 2: Gmail (Good for Testing)

**Setup Steps:**
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings
3. Navigate to Security → App passwords
4. Generate app password for "Mail"
5. Use the 16-character app password

**Environment Variables:**
```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME="AI Glossary Pro"
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-char-app-password
```

### Option 3: Custom SMTP

**Common SMTP Providers:**

**Mailgun:**
```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=smtp
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME="AI Glossary Pro"
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your_mailgun_smtp_password
```

**AWS SES:**
```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=smtp
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME="AI Glossary Pro"
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_aws_ses_smtp_username
SMTP_PASSWORD=your_aws_ses_smtp_password
```

### Testing Email Configuration

```bash
# Test email delivery
npm run test:email your-test-email@example.com
```

---

## Analytics Configuration

### PostHog Analytics

**Setup Steps:**
1. Go to [PostHog](https://app.posthog.com/)
2. Create an account
3. Create a new project
4. Copy the Project API Key
5. Configure event tracking

**Environment Variables:**
```bash
VITE_POSTHOG_KEY=phc_your_project_api_key
POSTHOG_HOST=https://app.posthog.com
```

**Dashboard Configuration:**
1. Set up key metrics dashboards
2. Configure conversion funnels
3. Set up user cohorts
4. Configure alerts for important events

### Google Analytics 4

**Setup Steps:**
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property
3. Set up data streams for your website
4. Copy the Measurement ID (G-XXXXXXXXXX)
5. Enable Measurement Protocol:
   - Go to Admin → Data Streams
   - Click on your web stream
   - Go to Measurement Protocol API secrets
   - Create a new secret

**Environment Variables:**
```bash
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA4_API_SECRET=your_measurement_protocol_api_secret
```

**Enhanced Ecommerce Setup:**
1. Enable Enhanced Ecommerce in GA4
2. Set up custom events for:
   - Page views
   - User interactions
   - Conversion events
   - Purchase tracking

**Goals and Conversions:**
1. Set up conversion events
2. Configure funnels
3. Set up audiences
4. Configure custom dimensions

### Analytics Testing

```bash
# Test analytics tracking
npm run test:analytics
```

---

## Error Monitoring Configuration

### Sentry Setup

**Setup Steps:**
1. Go to [Sentry](https://sentry.io/)
2. Create an account
3. Create a new project (select Node.js)
4. Copy the DSN URL
5. Configure error tracking

**Environment Variables:**
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_DSN_DEV=https://your-dev-sentry-dsn@sentry.io/dev-project-id
```

**Project Configuration:**
1. Set up error notifications
2. Configure performance monitoring
3. Set up user feedback
4. Configure release tracking

**Performance Monitoring:**
1. Enable performance monitoring
2. Set up transaction monitoring
3. Configure database query monitoring
4. Set up custom metrics

**Alerting Rules:**
1. Set up error rate alerts
2. Configure performance degradation alerts
3. Set up new issue notifications
4. Configure user feedback alerts

### Testing Error Monitoring

```bash
# Test error capturing
npm run test:sentry
```

---

## Payment Processing Configuration

### Gumroad Setup

**Setup Steps:**
1. Go to [Gumroad](https://gumroad.com/)
2. Create an account
3. Create your product
4. Set up webhook URL
5. Generate webhook secret

**Product Configuration:**
1. Create your product (e.g., "AI Glossary Pro Lifetime Access")
2. Set price and description
3. Configure download/access method
4. Set up custom fields if needed

**Webhook Configuration:**
1. Go to Settings → Advanced → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/gumroad/webhook`
3. Generate webhook secret
4. Configure webhook events (sale, refund, etc.)

**Environment Variables:**
```bash
GUMROAD_WEBHOOK_SECRET=your_webhook_secret_key
BASE_URL=https://yourdomain.com
```

### Webhook Testing

**Test Webhook Locally:**
```bash
# Use ngrok for local testing
ngrok http 3000
# Use the ngrok URL for webhook testing
```

**Webhook Verification:**
```bash
# Test webhook processing
npm run test:webhook
```

---

## Infrastructure Services

### Redis Configuration (Optional)

**Option 1: Managed Redis (Recommended)**

**Upstash Redis:**
1. Go to [Upstash](https://upstash.com/)
2. Create a Redis database
3. Copy the Redis URL

**Railway Redis:**
1. Go to [Railway](https://railway.app/)
2. Add Redis service to your project
3. Copy the Redis URL from variables

**Environment Variables:**
```bash
REDIS_URL=redis://username:password@host:port
REDIS_ENABLED=true
```

**Option 2: Self-Hosted Redis**

**Docker Setup:**
```bash
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

### AWS S3 Configuration (Optional)

**Setup Steps:**
1. Create AWS account
2. Create S3 bucket
3. Create IAM user with S3 permissions
4. Generate access keys

**Environment Variables:**
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

**IAM Policy for S3:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

---

## Security Configuration

### SSL/TLS Configuration

**Option 1: Let's Encrypt (Free)**

**Using Certbot:**
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com
```

**Option 2: CloudFlare (Recommended)**

1. Sign up for CloudFlare
2. Add your domain
3. Update nameservers
4. Enable SSL/TLS encryption
5. Configure security settings

### Rate Limiting Configuration

**Environment Variables:**
```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
MAX_FILE_SIZE=10485760       # 10MB
```

### CORS Configuration

**Environment Variables:**
```bash
CORS_ORIGIN=https://yourdomain.com
```

**Multiple Origins:**
```bash
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### Security Headers

The application automatically configures security headers:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

---

## Environment-Specific Configurations

### Development Environment

**Minimal Configuration:**
```bash
# Core requirements
DATABASE_URL=postgresql://localhost:5432/aiglossary_dev
SESSION_SECRET=your-development-secret-32-chars
NODE_ENV=development
PORT=3000

# Email (optional in dev)
EMAIL_ENABLED=false

# Analytics (optional in dev)
VITE_POSTHOG_KEY=your-dev-posthog-key
```

### Staging Environment

**Full Configuration for Testing:**
```bash
# Core
DATABASE_URL=postgresql://staging-db-url
SESSION_SECRET=your-staging-secret-32-chars
NODE_ENV=staging
PORT=3000
BASE_URL=https://staging.yourdomain.com

# Email (use test service)
EMAIL_ENABLED=true
EMAIL_SERVICE=smtp
EMAIL_FROM=staging@yourdomain.com
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASSWORD=your-mailtrap-password

# Analytics (use test properties)
VITE_POSTHOG_KEY=your-staging-posthog-key
VITE_GA4_MEASUREMENT_ID=G-STAGING-ID
VITE_GA4_API_SECRET=your-staging-ga4-secret

# Error monitoring (use staging project)
SENTRY_DSN=https://staging-sentry-dsn@sentry.io/staging-id

# Payment (use sandbox)
GUMROAD_WEBHOOK_SECRET=your-staging-webhook-secret
```

### Production Environment

**Full Production Configuration:**
```bash
# Core
DATABASE_URL=postgresql://production-db-url
SESSION_SECRET=your-production-secret-32-chars
NODE_ENV=production
PORT=3000
BASE_URL=https://yourdomain.com

# Email (production service)
EMAIL_ENABLED=true
EMAIL_SERVICE=smtp
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME="AI Glossary Pro"
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key

# Analytics (production)
VITE_POSTHOG_KEY=your-production-posthog-key
VITE_GA4_MEASUREMENT_ID=G-PRODUCTION-ID
VITE_GA4_API_SECRET=your-production-ga4-secret

# Error monitoring (production)
SENTRY_DSN=https://production-sentry-dsn@sentry.io/production-id

# Payment (production)
GUMROAD_WEBHOOK_SECRET=your-production-webhook-secret

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
CORS_ORIGIN=https://yourdomain.com

# Infrastructure
REDIS_URL=redis://production-redis-url
```

---

## Validation and Testing

### Environment Validation

**Check Configuration:**
```bash
npm run check:production
```

**Test All Services:**
```bash
npm run validate:production
```

### Service-Specific Testing

**Database:**
```bash
npm run test:db
```

**Email:**
```bash
npm run test:email your-test-email@example.com
```

**Analytics:**
```bash
npm run test:analytics
```

**Error Monitoring:**
```bash
npm run test:sentry
```

**Payment Webhooks:**
```bash
npm run test:webhook
```

---

## Troubleshooting

### Common Issues

**Database Connection Issues:**
1. Check DATABASE_URL format
2. Verify database server is running
3. Check firewall settings
4. Verify SSL configuration

**Email Delivery Issues:**
1. Check SMTP credentials
2. Verify email service configuration
3. Check DNS records for domain authentication
4. Test with a simple email client

**Analytics Not Tracking:**
1. Verify API keys are correct
2. Check if services are enabled
3. Verify domain configuration
4. Check browser console for errors

**Payment Webhook Issues:**
1. Verify webhook URL is accessible
2. Check webhook secret configuration
3. Verify SSL certificate
4. Check webhook event logs

### Getting Help

**Resources:**
- [PostHog Documentation](https://posthog.com/docs)
- [Google Analytics Help](https://support.google.com/analytics)
- [Sentry Documentation](https://docs.sentry.io/)
- [Gumroad Help](https://help.gumroad.com/)
- [SendGrid Documentation](https://docs.sendgrid.com/)

**Support Channels:**
- Check service status pages
- Review error logs
- Test with minimal configuration
- Contact service support if needed

---

## Security Best Practices

### Environment Variables
- Never commit environment files to version control
- Use strong, unique secrets
- Rotate API keys regularly
- Use environment-specific configurations

### Database Security
- Use SSL connections in production
- Implement proper access controls
- Regular security updates
- Monitor for unusual activity

### Email Security
- Use domain authentication
- Implement SPF/DKIM records
- Monitor for spam complaints
- Use proper email templates

### API Security
- Implement rate limiting
- Use HTTPS for all communications
- Validate all inputs
- Monitor for unusual patterns

---

This guide provides comprehensive setup instructions for all production services. Always test configurations in a staging environment before deploying to production.