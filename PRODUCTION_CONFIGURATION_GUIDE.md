# Production Configuration Guide

## 🔧 Environment Configuration

### Core Application Settings

#### Required Environment Variables
```bash
# Application Core
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
BASE_URL=https://yourdomain.com

# Security Keys (Generate secure 32+ character strings)
SESSION_SECRET=your-super-secure-32-character-session-secret-here
JWT_SECRET=your-jwt-secret-key-here-also-32-characters-minimum
JWT_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Alternative PostgreSQL Configuration
PGDATABASE=your_database_name
PGHOST=your_host
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password

# Redis Configuration
REDIS_URL=redis://username:password@host:port/database
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_ENABLED=true
CACHE_TTL=3600

# Network & Security
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads
```

## 🔐 Authentication Configuration

### Firebase Authentication
```bash
# Client-side Configuration (VITE_ prefix required)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:your-app-id

# Server-side Configuration (for Firebase Admin SDK)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

### OAuth Provider Configuration
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=https://yourdomain.com/auth/github/callback
```

## 💳 Payment & Monetization Configuration

### Gumroad Configuration
```bash
# Gumroad Integration
GUMROAD_WEBHOOK_SECRET=your-gumroad-webhook-secret-key
GUMROAD_ACCESS_TOKEN=your-gumroad-access-token
VITE_GUMROAD_PRODUCT_URL=https://gumroad.com/l/your-product

# Required Webhook Endpoints to Configure in Gumroad:
# https://yourdomain.com/api/webhooks/gumroad/sale
# https://yourdomain.com/api/webhooks/gumroad/refund
# https://yourdomain.com/api/webhooks/gumroad/dispute
# https://yourdomain.com/api/webhooks/gumroad/cancellation
```

### Stripe Configuration (Alternative/Additional)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## 📧 Email Service Configuration

### Gmail Configuration
```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME="AI Glossary Pro"
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
```

### Generic SMTP Configuration
```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=smtp
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME="AI Glossary Pro"
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

### SendGrid Configuration
```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=sendgrid
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME="AI Glossary Pro"
SENDGRID_API_KEY=SG.your_sendgrid_api_key
```

## 🤖 AI & External Services Configuration

### OpenAI Configuration
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_MAX_TOKENS=2048
OPENAI_TEMPERATURE=0.7
```

### AWS S3 Configuration (for file storage)
```bash
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
```

### Google Drive API Configuration
```bash
GOOGLE_DRIVE_API_KEY=your-google-drive-api-key
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

## 📊 Monitoring & Analytics Configuration

### Error Tracking (Sentry)
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
```

### Analytics (PostHog)
```bash
VITE_POSTHOG_KEY=phc_your-posthog-key
POSTHOG_HOST=https://app.posthog.com
POSTHOG_API_KEY=your-server-side-api-key
```

### Google Analytics
```bash
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA4_API_SECRET=your-ga4-api-secret
```

## 🔒 SSL & Security Configuration

### SSL Certificate Configuration
```bash
# If handling SSL directly (not recommended - use reverse proxy)
SSL_CERT_PATH=/path/to/ssl/certificate.crt
SSL_KEY_PATH=/path/to/ssl/private.key
```

### Security Headers Configuration
```bash
# Content Security Policy
CSP_ENABLED=true
CSP_REPORT_URI=https://yourdomain.com/api/csp-report

# HSTS Configuration
HSTS_MAX_AGE=31536000
HSTS_INCLUDE_SUBDOMAINS=true
```

## 📈 Performance Configuration

### Caching Configuration
```bash
# Application-level caching
CACHE_ENABLED=true
CACHE_TTL=3600
CACHE_MAX_SIZE=100mb

# CDN Configuration
CDN_ENABLED=true
CDN_URL=https://cdn.yourdomain.com
```

### Database Performance
```bash
# Connection pooling
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000

# Query timeout
DB_QUERY_TIMEOUT=30000
```

## 🎯 Feature Flags Configuration

### Application Features
```bash
# Core features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_DEBUG_MODE=false

# Experimental features
VITE_ENABLE_3D_VISUALIZATION=true
VITE_ENABLE_AR_FEATURES=false
VITE_ENABLE_VR_FEATURES=false

# Monetization features
VITE_ENABLE_ADS=true
VITE_ENABLE_PREMIUM_FEATURES=true
VITE_ENABLE_REFERRAL_PROGRAM=true
```

### AdSense Configuration
```bash
VITE_ADSENSE_ENABLED=true
VITE_ADSENSE_CLIENT_ID=ca-pub-your-adsense-id
VITE_AD_SLOT_HOMEPAGE=1234567890
VITE_AD_SLOT_SEARCH_RESULTS=0987654321
VITE_AD_SLOT_TERM_DETAIL=1122334455
VITE_AD_SLOT_SIDEBAR=5544332211
```

## 🔄 Backup & Recovery Configuration

### Backup Configuration
```bash
# Database backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=your-backup-bucket

# File backup
FILE_BACKUP_ENABLED=true
FILE_BACKUP_PATH=/backups
```

## 📝 Logging Configuration

### Application Logging
```bash
LOG_LEVEL=warn
LOG_FILE=logs/production.log
LOG_MAX_SIZE=10mb
LOG_MAX_FILES=5

# Structured logging
LOG_FORMAT=json
LOG_TIMESTAMP=true
```

## 🌐 Internationalization Configuration

### Localization
```bash
DEFAULT_LOCALE=en
SUPPORTED_LOCALES=en,es,fr,de,ja,zh
TRANSLATION_API_KEY=your-translation-api-key
```

## ⚡ Advanced Configuration

### Webhook Configuration
```bash
# Webhook retry configuration
WEBHOOK_RETRY_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=1000
WEBHOOK_TIMEOUT=30000

# Webhook security
WEBHOOK_SIGNATURE_HEADER=X-Signature
WEBHOOK_SIGNATURE_ALGORITHM=sha256
```

### Job Queue Configuration
```bash
# BullMQ configuration
QUEUE_REDIS_URL=redis://localhost:6379
QUEUE_CONCURRENCY=5
QUEUE_MAX_STALLED_COUNT=3
QUEUE_RETRY_ATTEMPTS=3
```

## 🛠️ Configuration Validation

### Environment Validation Script
```bash
#!/bin/bash
# validate-env.sh

echo "🔍 Validating production environment..."

# Check required variables
required_vars=(
  "NODE_ENV"
  "DATABASE_URL"
  "SESSION_SECRET"
  "EMAIL_FROM"
  "GUMROAD_WEBHOOK_SECRET"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required variable: $var"
    exit 1
  fi
done

echo "✅ All required environment variables are set"

# Run production setup checker
npm run setup:production-check
```

### Configuration Testing Commands
```bash
# Test database connection
npm run db:status

# Test Redis connection
redis-cli ping

# Test email configuration
npm run test:email your-email@domain.com

# Test webhook endpoints
curl -X POST https://yourdomain.com/api/webhooks/gumroad/health

# Test API endpoints
npm run test:api-endpoints

# Validate all configurations
npm run validate:production
```

## 📋 Quick Setup Commands

### Initial Setup
```bash
# Copy template
cp .env.production.template .env.production

# Edit configuration
nano .env.production

# Validate configuration
npm run setup:production-check

# Apply database schema
npm run db:push
npm run db:indexes-enhanced

# Build application
npm run build

# Start production server
npm run start
```

### Health Check Commands
```bash
# Application health
curl https://yourdomain.com/api/health

# Database health
npm run db:status

# Redis health
redis-cli ping

# Email health
npm run test:email health@yourdomain.com

# Complete system check
npm run audit:all
```

## 🔧 Configuration Best Practices

### Security Best Practices
1. **Never commit secrets** to version control
2. **Use environment-specific files** (.env.production, .env.staging)
3. **Rotate secrets regularly** (every 90 days)
4. **Use strong encryption** for sensitive data
5. **Enable audit logging** for all configuration changes

### Performance Best Practices
1. **Enable caching** at all levels
2. **Configure connection pooling** for databases
3. **Use CDN** for static assets
4. **Enable compression** (gzip/brotli)
5. **Monitor resource usage** continuously

### Monitoring Best Practices
1. **Set up alerts** for critical metrics
2. **Monitor error rates** and response times
3. **Track business metrics** (conversions, revenue)
4. **Log structured data** for easy analysis
5. **Regular performance audits**

This configuration guide provides all necessary settings for a production-ready deployment of the AI/ML Glossary Pro application.