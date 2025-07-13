# Production Environment Configuration Guide

## 🎯 Quick Start

This guide provides everything you need to configure AI Glossary Pro for production deployment.

## 📋 Environment Variables Checklist

### ✅ CRITICAL (Required for Basic Functionality)

These variables are **absolutely required** for the application to work in production:

```bash
# Application Configuration
NODE_ENV=production                    # REQUIRED: Sets production mode
PORT=3000                             # Server port (default: 3000)
BASE_URL=https://yourdomain.com       # REQUIRED: Your production domain

# Database Configuration  
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require  # REQUIRED: Database connection
PGDATABASE=your_database              # Database name
PGHOST=your-host.amazonaws.com        # Database host
PGPORT=5432                          # Database port
PGUSER=your_username                 # Database username  
PGPASSWORD=your_password             # Database password

# Security
SESSION_SECRET=your-64-char-session-secret-here        # REQUIRED: 64+ character secret
JWT_SECRET=your-64-char-jwt-secret-here               # REQUIRED: 64+ character secret
```

### 🚀 ESSENTIAL (Highly Recommended)

These variables enable core business functionality:

```bash
# Email Service (Choose ONE)
EMAIL_ENABLED=true
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME="AI Glossary Pro"

# Option 1: Resend (Recommended - Modern & Developer-Friendly)
RESEND_API_KEY=re_your-resend-api-key-here

# Option 2: Traditional SMTP (Alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Processing
GUMROAD_WEBHOOK_SECRET=your-gumroad-webhook-secret-from-dashboard

# Firebase Authentication
VITE_FIREBASE_API_KEY=AIzaSyBqJ7OMRjr54_CMJpEDMWKR6XQ4Y8qzfdg
VITE_FIREBASE_AUTH_DOMAIN=aiglossarypro.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=aiglossarypro
VITE_FIREBASE_STORAGE_BUCKET=aiglossarypro.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=449850174939
VITE_FIREBASE_APP_ID=1:449850174939:web:08d7973752807207d24bfe

# Firebase Admin SDK
FIREBASE_PROJECT_ID=aiglossarypro
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@aiglossarypro.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_BASE64=your-base64-encoded-private-key
```

### 📊 MONITORING (Production Best Practices)

Essential for production monitoring and debugging:

```bash
# Error Tracking (Recommended)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0

# Analytics (Recommended)
POSTHOG_API_KEY=phc_your-posthog-api-key
POSTHOG_HOST=https://app.posthog.com

# Google Analytics (Optional)
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA4_ENABLED=true

# Logging
LOG_LEVEL=warn                        # Production: error, warn, or info
LOG_FILE=logs/production.log
```

### 💰 BUSINESS FEATURES (For Revenue)

Configure these for full business functionality:

```bash
# Gumroad Product Configuration
VITE_GUMROAD_PRODUCT_URL=https://pranaysuyash.gumroad.com/l/ggczfy
VITE_GUMROAD_DISCOUNT_URL=https://pranaysuyash.gumroad.com/l/ggczfy/EARLY500
VITE_GUMROAD_BASE_PRICE=249
VITE_GUMROAD_EARLY_BIRD_PRICE=179
VITE_PPP_MIN_PRICE=99
VITE_PPP_MAX_DISCOUNT=60
VITE_PPP_ENABLED=true
VITE_EARLY_BIRD_SAVINGS=70

# Enhanced Features
USE_ENHANCED_STORAGE=true
```

### 🔧 OPTIONAL ENHANCEMENTS

These improve functionality but aren't required:

```bash
# AI Features (Optional)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
OPENAI_API_URL=https://api.openai.com/v1

# File Storage (Optional)
AWS_ACCESS_KEY_ID=AKIA2SSKQWTVLHT3HPCS
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket

# Caching & Performance (Optional but Recommended)
REDIS_ENABLED=true
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=your-redis-password  # If using authenticated Redis

# Additional Authentication (Backup)
JWT_EXPIRES_IN=7d

# Security & Performance
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=52428800
```

## 🔐 Security Best Practices

### Generating Secure Secrets

Generate strong secrets for production:

```bash
# Generate 64-character secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or use openssl
openssl rand -base64 32

# Session Secret Example
SESSION_SECRET=JCmY1YTJ2lXuEKhHgKZURZfub9S7WNQgy5Om2NFDdWu3dg0CtqB7wQGyXHzQG2sqDVAkGE9H9ual6uc1cVn8LA==
```

### Environment File Security

1. **Never commit `.env` files** to version control
2. Use `.env.production.template` as a template
3. Store secrets in your deployment platform's secret management
4. Rotate secrets every 90 days
5. Use different secrets for each environment

## 📝 Setup Instructions

### Step 1: Copy Template
```bash
cp .env.production.template .env.production
```

### Step 2: Fill Required Variables
Edit `.env.production` and fill in all REQUIRED variables marked above.

### Step 3: Configure Email Service

#### Option A: Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Set `RESEND_API_KEY=re_your-api-key`
4. Set `EMAIL_ENABLED=true`

#### Option B: SMTP (Alternative)
1. Configure your SMTP provider (Gmail, SendGrid, etc.)
2. Set SMTP_* variables
3. Set `EMAIL_ENABLED=true`

### Step 4: Configure Monitoring

#### Sentry (Error Tracking)
1. Create account at [sentry.io](https://sentry.io)
2. Create new project for Node.js
3. Copy DSN to `SENTRY_DSN`

#### PostHog (Analytics)
1. Create account at [posthog.com](https://posthog.com)
2. Get API key
3. Set `POSTHOG_API_KEY`

### Step 5: Validate Configuration
```bash
# Validate all configuration
npm run config:validate

# Test email specifically
npm run test:email your@email.com

# Test all email types
npm run test:email -- --all
```

## 🚀 Deployment Platforms

### Vercel
```bash
# Set environment variables in Vercel dashboard
vercel env add SESSION_SECRET production
vercel env add DATABASE_URL production
# ... etc for all variables
```

### Railway
```bash
# Set via Railway dashboard or CLI
railway variables set SESSION_SECRET=your-secret
railway variables set DATABASE_URL=your-db-url
```

### Render
```bash
# Set in Render dashboard environment variables section
# Or via render.yaml file (without secrets)
```

### Docker
```bash
# Use environment file
docker run --env-file .env.production your-app

# Or individual variables
docker run -e NODE_ENV=production -e DATABASE_URL=... your-app
```

## 🧪 Testing & Validation

### Pre-Deployment Checklist

Run these commands before deploying:

```bash
# 1. Validate complete configuration
npm run config:validate

# 2. Test email functionality
npm run test:email your@email.com

# 3. Test database connection
npm run db:status

# 4. Run production build
npm run build

# 5. Test production build locally
npm run start
```

### Health Checks

After deployment, verify these endpoints:

```bash
# Basic health
curl https://yourdomain.com/api/health

# Extended health (includes external services)
curl https://yourdomain.com/api/health?extended=true

# Database health
curl https://yourdomain.com/api/monitoring/database
```

## 🔍 Troubleshooting

### Common Issues

#### Email Not Working
```bash
# Check configuration
npm run test:email your@email.com

# Common fixes:
# 1. Verify RESEND_API_KEY is correct
# 2. Ensure EMAIL_ENABLED=true
# 3. Check EMAIL_FROM is valid
# 4. For SMTP: verify credentials
```

#### Database Connection Fails
```bash
# Test database
npm run db:status

# Common fixes:
# 1. Verify DATABASE_URL format
# 2. Ensure SSL is enabled (?sslmode=require)
# 3. Check network connectivity
# 4. Verify credentials
```

#### Authentication Issues
```bash
# Check Firebase configuration
# 1. Verify all VITE_FIREBASE_* variables
# 2. Check FIREBASE_PRIVATE_KEY_BASE64 encoding
# 3. Ensure Firebase project is active
```

### Debug Mode

For troubleshooting, temporarily set:
```bash
LOG_LEVEL=debug
```

Then check logs for detailed information.

## 📋 Production Deployment Checklist

- [ ] All CRITICAL environment variables set
- [ ] Email service configured and tested
- [ ] Database connection verified with SSL
- [ ] Monitoring services configured
- [ ] Secrets are secure (64+ characters)
- [ ] Domain and SSL certificate configured
- [ ] Health checks responding
- [ ] Payment webhooks configured
- [ ] Analytics tracking working
- [ ] Error monitoring active
- [ ] Backup and recovery procedures in place

## 🆘 Support

If you encounter issues:

1. Run the configuration validator: `npm run config:validate`
2. Check the troubleshooting section above
3. Review application logs
4. Verify all environment variables are set correctly
5. Test individual components (email, database, etc.)

Your production deployment should be smooth with this configuration guide! 🚀