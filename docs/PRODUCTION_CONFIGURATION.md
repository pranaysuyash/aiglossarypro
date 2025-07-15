# Production Configuration Guide

This document provides comprehensive instructions for configuring the AI Glossary Pro application for production deployment.

## Overview

The application requires several external services and configuration settings to function properly in production. This guide covers all necessary configurations, from database setup to third-party integrations.

## Required Environment Variables

### Database Configuration
```bash
# PostgreSQL Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Redis Cache (optional but recommended)
REDIS_URL="redis://username:password@host:port"
```

### Authentication & Security
```bash
# Firebase Authentication
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY_BASE64="base64-encoded-private-key"

# Session Security
SESSION_SECRET="your-very-secure-session-secret-minimum-64-characters"
JWT_SECRET="your-jwt-secret-key"

# CORS Configuration
CORS_ORIGIN="https://your-domain.com"
```

### Payment Processing
```bash
# Gumroad Integration
GUMROAD_SELLER_ID="your-gumroad-seller-id"
GUMROAD_PRODUCT_ID="your-gumroad-product-id"
GUMROAD_WEBHOOK_SECRET="your-gumroad-webhook-secret"

# Stripe (if using Stripe instead of Gumroad)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Email Services
```bash
# Resend Email Service (recommended)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@your-domain.com"

# Firebase Email (alternative)
FIREBASE_EMAIL_ENABLED="true"
```

### Analytics & Monitoring
```bash
# Google Analytics 4
GA4_MEASUREMENT_ID="G-XXXXXXXXXX"

# PostHog Analytics
POSTHOG_API_KEY="phc_..."
POSTHOG_HOST="https://app.posthog.com"

# Sentry Error Tracking
SENTRY_DSN="https://...@sentry.io/..."
```

### AI Services
```bash
# OpenAI API
OPENAI_API_KEY="sk-..."
OPENAI_API_URL="https://api.openai.com/v1"
```

### File Storage
```bash
# AWS S3 Storage
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

### CDN Configuration
```bash
# CloudFlare CDN
CLOUDFLARE_ZONE_ID="your-zone-id"
CLOUDFLARE_API_TOKEN="your-api-token"

# Custom CDN Domain
CDN_DOMAIN="https://cdn.your-domain.com"
```

## Service Setup Instructions

### 1. Database Setup (PostgreSQL)

**Option A: Self-hosted PostgreSQL**
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE aiglossary;
CREATE USER aiglossary_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE aiglossary TO aiglossary_user;
```

**Option B: Managed PostgreSQL (recommended)**
- **Neon**: https://neon.tech
- **Supabase**: https://supabase.com
- **AWS RDS**: https://aws.amazon.com/rds/
- **Railway**: https://railway.app

### 2. Redis Cache Setup

**Option A: Self-hosted Redis**
```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**Option B: Managed Redis (recommended)**
- **Upstash**: https://upstash.com
- **Redis Cloud**: https://redis.com/redis-enterprise-cloud/
- **AWS ElastiCache**: https://aws.amazon.com/elasticache/

### 3. Firebase Authentication Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Enable Authentication with these providers:
   - Email/Password
   - Google
   - GitHub
4. Generate service account key:
   - Project Settings → Service Accounts
   - Generate new private key
   - Base64 encode the entire JSON file

### 4. Payment Processing Setup

**Option A: Gumroad (simpler)**
1. Create account at https://gumroad.com
2. Create your product
3. Set up webhook endpoint: `https://your-domain.com/api/webhooks/gumroad`
4. Copy seller ID and product ID

**Option B: Stripe (more features)**
1. Create account at https://stripe.com
2. Get API keys from Dashboard
3. Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
4. Configure webhook events: `checkout.session.completed`, `customer.subscription.created`

### 5. Email Service Setup

**Option A: Resend (recommended)**
1. Sign up at https://resend.com
2. Verify your domain
3. Create API key
4. Configure SPF/DKIM records

**Option B: Firebase Email**
1. Enable Email Extensions in Firebase
2. Configure SMTP settings
3. Set up email templates

### 6. Analytics Setup

**Google Analytics 4:**
1. Create GA4 property at https://analytics.google.com
2. Get Measurement ID
3. Configure Enhanced Ecommerce

**PostHog:**
1. Sign up at https://posthog.com
2. Create project
3. Get API key and host

### 7. CDN Setup

**CloudFlare:**
1. Add domain to CloudFlare
2. Configure DNS records
3. Enable caching rules for static assets
4. Set up SSL/TLS

**Custom CDN:**
1. Configure origin server
2. Set up cache headers
3. Configure CORS policies

## Deployment Configuration

### Environment-specific Settings

**Production (.env.production):**
```bash
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
ENABLE_SWAGGER=false
RATE_LIMIT_ENABLED=true
CACHE_TTL=3600
```

**Staging (.env.staging):**
```bash
NODE_ENV=staging
PORT=3001
LOG_LEVEL=debug
ENABLE_SWAGGER=true
RATE_LIMIT_ENABLED=false
CACHE_TTL=300
```

### Security Configuration

**SSL/TLS:**
- Use Let's Encrypt for free SSL certificates
- Enable HSTS headers
- Configure secure cookies

**Rate Limiting:**
```bash
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

**CORS:**
```bash
CORS_ORIGIN=https://your-domain.com
CORS_METHODS=GET,POST,PUT,DELETE
CORS_CREDENTIALS=true
```

### Performance Configuration

**Caching:**
```bash
REDIS_TTL=3600
STATIC_CACHE_TTL=86400
API_CACHE_TTL=300
```

**Compression:**
```bash
COMPRESSION_LEVEL=6
COMPRESSION_THRESHOLD=1024
```

## Health Checks & Monitoring

### Application Health Endpoints
- `/api/health` - Basic health check
- `/api/health/detailed` - Detailed system status
- `/api/admin/health` - Admin health check

### Monitoring Setup

**Sentry Error Tracking:**
```bash
SENTRY_DSN="https://...@sentry.io/..."
SENTRY_ENVIRONMENT="production"
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Log Configuration:**
```bash
LOG_LEVEL=info
LOG_FORMAT=json
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
```

### Database Monitoring
- Set up connection pooling
- Monitor query performance
- Configure backup schedules

## Build & Deploy Process

### 1. Build Application
```bash
npm run build
```

### 2. Database Migration
```bash
npm run db:push
```

### 3. Start Production Server
```bash
npm start
```

### 4. Process Management (PM2)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## Backup & Recovery

### Database Backups
```bash
# Daily backup script
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20240101.sql
```

### File Storage Backups
```bash
# S3 bucket backup
aws s3 sync s3://your-bucket s3://your-backup-bucket
```

## Testing Production Configuration

### 1. Environment Validation
```bash
npm run validate:production
```

### 2. Health Check Tests
```bash
curl https://your-domain.com/api/health
curl https://your-domain.com/api/health/detailed
```

### 3. Load Testing
```bash
npm install -g artillery
artillery run load-test.yml
```

## Common Issues & Troubleshooting

### 1. Database Connection Issues
- Check DATABASE_URL format
- Verify firewall/security group settings
- Test connection with `psql`

### 2. Authentication Problems
- Verify Firebase configuration
- Check API key permissions
- Validate JWT secret

### 3. Email Delivery Issues
- Check SPF/DKIM records
- Verify API key permissions
- Test with simple email first

### 4. Performance Issues
- Enable Redis caching
- Configure CDN properly
- Optimize database queries

## Security Checklist

- [ ] Enable SSL/TLS certificates
- [ ] Configure secure headers
- [ ] Set up rate limiting
- [ ] Enable CORS properly
- [ ] Use strong secrets
- [ ] Enable audit logging
- [ ] Configure firewall rules
- [ ] Set up monitoring alerts

## Maintenance Tasks

### Daily
- Monitor error logs
- Check system health
- Review performance metrics

### Weekly
- Database maintenance
- Log rotation
- Security updates

### Monthly
- Backup verification
- Performance optimization
- Security audit

## Support & Documentation

- **API Documentation**: https://your-domain.com/api/docs
- **Admin Panel**: https://your-domain.com/admin
- **Health Status**: https://your-domain.com/api/health

For additional support, refer to:
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Security Guide](./SECURITY_GUIDE.md)
- [Performance Guide](./PERFORMANCE_GUIDE.md)

---

**Last Updated**: 2025-07-15
**Version**: 1.0.0