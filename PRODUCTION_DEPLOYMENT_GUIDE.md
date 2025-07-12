# AI/ML Glossary Pro - Production Deployment Guide

## 🚀 Overview

This comprehensive guide covers the complete production deployment process for the AI/ML Glossary Pro application, including infrastructure setup, configuration, monitoring, and maintenance procedures.

## 📋 Prerequisites

### Required Services & Accounts
- [ ] Production PostgreSQL database (Neon, Railway, or self-hosted)
- [ ] Redis instance for caching and job queues (Redis Cloud, Railway, or self-hosted)
- [ ] Domain name and DNS management
- [ ] SSL certificate (Let's Encrypt or commercial)
- [ ] Email service (Gmail, SendGrid, or SMTP)
- [ ] Gumroad account for payments
- [ ] Firebase project for authentication
- [ ] Monitoring services (Sentry, PostHog)

### Development Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Git version control
- [ ] Production environment files configured

## 🔧 Infrastructure Setup

### 1. Database Configuration

#### PostgreSQL Setup
```bash
# Required environment variables
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Alternative format for connection pooling
PGDATABASE=your_database_name
PGHOST=your_host
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
```

#### Database Migration
```bash
# Apply database schema
npm run db:push

# Apply performance indexes
npm run db:indexes-enhanced

# Verify database status
npm run db:status
```

### 2. Redis Configuration

#### Redis Setup
```bash
# Redis connection
REDIS_URL=redis://username:password@host:port/database
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_ENABLED=true
```

### 3. Application Configuration

#### Core Environment Variables
```bash
# Application
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
BASE_URL=https://yourdomain.com

# Security
SESSION_SECRET=your-super-secure-32-character-session-secret-here
JWT_SECRET=your-jwt-secret-key-here-also-32-characters-minimum
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true
```

## 🔐 Authentication & Authorization

### Firebase Authentication Setup

1. **Create Firebase Project**
   ```bash
   # Visit https://console.firebase.google.com/
   # Create new project
   # Enable Authentication
   # Configure sign-in methods (Email/Password, Google, GitHub)
   ```

2. **Configure Environment Variables**
   ```bash
   # Client-side (VITE_ prefix)
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:your-app-id

   # Server-side (for admin SDK)
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
   ```

### OAuth Configuration

#### Google OAuth
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```

#### GitHub OAuth
```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=https://yourdomain.com/auth/github/callback
```

## 💳 Payment Integration

### Gumroad Configuration

1. **Product Setup**
   ```bash
   # Create product on Gumroad
   # Set up webhook endpoints
   # Configure product variants if needed
   ```

2. **Environment Variables**
   ```bash
   GUMROAD_WEBHOOK_SECRET=your-gumroad-webhook-secret-key
   GUMROAD_ACCESS_TOKEN=your-gumroad-access-token
   VITE_GUMROAD_PRODUCT_URL=https://gumroad.com/l/your-product
   ```

3. **Webhook Endpoints**
   ```
   https://yourdomain.com/api/webhooks/gumroad/sale
   https://yourdomain.com/api/webhooks/gumroad/refund
   https://yourdomain.com/api/webhooks/gumroad/dispute
   https://yourdomain.com/api/webhooks/gumroad/cancellation
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

### SMTP Configuration
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

### Email Testing
```bash
# Test email configuration
npm run test:email your-test-email@example.com
```

## 📊 Monitoring & Analytics

### Error Tracking (Sentry)
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Analytics (PostHog)
```bash
VITE_POSTHOG_KEY=phc_your-posthog-key
POSTHOG_HOST=https://app.posthog.com
```

### Google Analytics
```bash
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA4_API_SECRET=your-ga4-api-secret
```

## 🏗️ Build & Deployment

### Build Process

1. **Install Dependencies**
   ```bash
   npm install --production
   ```

2. **Build Application**
   ```bash
   # Standard build
   npm run build

   # CDN-optimized build
   npm run build:cdn

   # Build with analysis
   npm run build:analyze
   ```

3. **Verify Build**
   ```bash
   # Check production setup
   npm run check:production

   # Validate configuration
   npm run validate:production
   ```

### Deployment Options

#### Option 1: Docker Deployment
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### Option 2: Platform Deployment (Railway, Vercel, etc.)
```bash
# Set environment variables in platform dashboard
# Connect GitHub repository
# Configure build settings
# Deploy
```

#### Option 3: VPS Deployment
```bash
# Install Node.js, PostgreSQL, Redis, Nginx
# Clone repository
# Install dependencies
# Build application
# Configure reverse proxy
# Set up SSL
# Configure process manager (PM2)
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Static files
    location /assets/ {
        root /path/to/app/dist/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA routes
    location / {
        root /path/to/app/dist/public;
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔒 Security Configuration

### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### File Upload Security
```bash
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads
```

### SSL/TLS Configuration
```bash
# If handling SSL directly
SSL_CERT_PATH=/path/to/ssl/certificate.crt
SSL_KEY_PATH=/path/to/ssl/private.key
```

## 🧪 Testing & Validation

### Pre-Deployment Testing
```bash
# Run all tests
npm run test:all

# Visual regression tests
npm run test:visual

# Performance tests
npm run lighthouse

# API endpoint tests
npm run test:api-endpoints

# Email service test
npm run test:email your-email@example.com

# Analytics test
npm run test:analytics

# Webhook test
npm run test:webhook
```

### Production Validation
```bash
# Comprehensive production check
npm run setup:production-check

# Validate environment configuration
npm run validate:production

# Health checks
curl https://yourdomain.com/api/health
curl https://yourdomain.com/api/webhooks/gumroad/health
```

## 📋 Production Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database schema applied and indexed
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Monitoring services set up
- [ ] Email service configured and tested
- [ ] Payment webhooks configured
- [ ] Backup procedures established

### During Deployment
- [ ] Application builds successfully
- [ ] All services start without errors
- [ ] Database connections working
- [ ] Redis cache operational
- [ ] API endpoints responding
- [ ] Authentication flows working
- [ ] Payment processing functional

### Post-Deployment
- [ ] Performance monitoring active
- [ ] Error tracking operational
- [ ] Analytics collecting data
- [ ] Email notifications working
- [ ] Webhook endpoints responding
- [ ] SSL certificates valid
- [ ] Backup systems operational
- [ ] Load testing completed

## 🔄 Maintenance & Monitoring

### Health Checks
```bash
# Application health
curl https://yourdomain.com/api/health

# Database health
npm run db:status

# Redis health
redis-cli ping

# Email service health
npm run test:email health-check@yourdomain.com
```

### Performance Monitoring
```bash
# Lighthouse performance audit
npm run lighthouse

# Performance dashboard
npm run perf:dashboard

# Performance analysis
npm run perf:analyze
```

### Log Management
```bash
# Application logs
tail -f logs/production.log

# Error logs
tail -f logs/error.log

# Access logs
tail -f /var/log/nginx/access.log
```

### Backup Procedures
```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# File backup
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/

# Configuration backup
cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check connection
npm run db:status

# Verify environment variables
echo $DATABASE_URL

# Test direct connection
psql $DATABASE_URL
```

#### Email Service Issues
```bash
# Test email configuration
npm run test:email debug@yourdomain.com

# Check SMTP settings
telnet smtp.gmail.com 587
```

#### Payment Webhook Issues
```bash
# Check webhook endpoint
curl -X POST https://yourdomain.com/api/webhooks/gumroad/health

# Verify webhook signature
# Check Gumroad webhook logs
```

#### Performance Issues
```bash
# Check resource usage
top
free -h
df -h

# Analyze performance
npm run perf:analyze

# Check database performance
EXPLAIN ANALYZE SELECT * FROM your_slow_query;
```

## 📞 Support & Resources

### Documentation Links
- [Firebase Documentation](https://firebase.google.com/docs)
- [Gumroad API Documentation](https://help.gumroad.com/article/280-gumroad-api)
- [Sentry Documentation](https://docs.sentry.io/)
- [PostHog Documentation](https://posthog.com/docs)

### Emergency Contacts
- Database Provider Support
- Hosting Provider Support
- Domain Registrar Support
- SSL Certificate Provider

### Monitoring Dashboards
- Application Performance: [Your Monitoring URL]
- Error Tracking: [Your Sentry URL]
- Analytics: [Your PostHog URL]
- Uptime Monitoring: [Your Uptime Monitor URL]

---

## 🎯 Quick Start Commands

```bash
# Complete production setup
npm run setup:production-check
npm run build
npm run start

# Health check everything
npm run test:all
npm run validate:production

# Monitor in production
npm run perf:dashboard
tail -f logs/production.log
```

This guide provides a comprehensive roadmap for deploying the AI/ML Glossary Pro application to production. Follow the checklist carefully and test each component thoroughly before going live.