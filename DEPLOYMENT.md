# AI Glossary Pro - Comprehensive Deployment Guide

This guide provides detailed instructions for deploying AI Glossary Pro to production environments, including all configuration requirements, deployment platforms, and best practices.

## Table of Contents
- [System Requirements](#system-requirements)
- [Environment Variables](#environment-variables)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Database Setup](#database-setup)
- [Deployment Platforms](#deployment-platforms)
  - [Vercel Deployment](#vercel-deployment)
  - [AWS EC2 Deployment](#aws-ec2-deployment)
  - [Railway Deployment](#railway-deployment)
  - [Render Deployment](#render-deployment)
  - [Self-Hosted Deployment](#self-hosted-deployment)
- [Firebase Configuration](#firebase-configuration)
- [Email Service Setup](#email-service-setup)
- [Redis Configuration](#redis-configuration)
- [CDN Configuration](#cdn-configuration)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Production Considerations](#production-considerations)
- [Rollback Procedures](#rollback-procedures)

## System Requirements

### Minimum Requirements
- **Node.js**: 18.x or higher (20.x recommended)
- **NPM**: 9.x or higher
- **PostgreSQL**: 14.x or higher
- **Redis**: 6.x or higher (optional but recommended)
- **Memory**: 2GB RAM minimum (4GB recommended)
- **Storage**: 5GB free space minimum
- **CPU**: 2 vCPUs minimum

### Recommended Production Stack
- **Node.js**: 20.x LTS
- **PostgreSQL**: 16.x with connection pooling
- **Redis**: 7.x for caching and sessions
- **Reverse Proxy**: Nginx or Cloudflare
- **Process Manager**: PM2 or systemd
- **Monitoring**: Sentry, PostHog, Google Analytics

## Environment Variables

### Required Variables

Create a `.env.production` file with all required environment variables:

```bash
# ===================================
# MANDATORY - Core Configuration
# ===================================

# Application
NODE_ENV=production
PORT=3001
VITE_APP_TITLE="AI/ML Glossary Pro"
VITE_APP_URL=https://aiglossarypro.com
VITE_API_BASE_URL=https://aiglossarypro.com

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Security - Generate secure secrets (32+ characters)
JWT_SECRET=your-secure-jwt-secret-min-32-chars
SESSION_SECRET=your-secure-session-secret-min-32-chars
COOKIE_SECRET=your-secure-cookie-secret-min-32-chars

# ===================================
# MANDATORY - Firebase Authentication
# ===================================

# Frontend Firebase config
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxxxxx

# Backend Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_BASE64=your-base64-encoded-private-key

# ===================================
# MANDATORY - Email Configuration
# ===================================

# Primary email service (Resend recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@aiglossarypro.com
EMAIL_FROM_NAME=AI Glossary Pro
EMAIL_ENABLED=true

# ===================================
# Optional but Recommended
# ===================================

# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_API_SECRET=your-ga4-api-secret
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_POSTHOG_HOST=https://app.posthog.com

# Error Monitoring
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567
SENTRY_ENVIRONMENT=production
VITE_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567

# Redis Cache (highly recommended)
REDIS_URL=redis://user:password@host:port/0
ENABLE_REDIS_CACHE=true

# Monetization
GUMROAD_ACCESS_TOKEN=your-gumroad-access-token
GUMROAD_WEBHOOK_SECRET=your-webhook-secret
VITE_GUMROAD_PRODUCT_URL=https://gumroad.com/l/your-product-id
```

### Environment Variable Descriptions

#### Core Configuration
- `NODE_ENV`: Must be set to "production" for production deployments
- `PORT`: Server port (default: 3001)
- `DATABASE_URL`: PostgreSQL connection string with SSL enabled
- `JWT_SECRET`: Used for JWT token signing (min 32 characters)
- `SESSION_SECRET`: Used for session encryption (min 32 characters)
- `COOKIE_SECRET`: Used for cookie signing (min 32 characters)

#### Firebase Configuration
- `VITE_FIREBASE_*`: Frontend Firebase configuration (from Firebase Console > Project Settings)
- `FIREBASE_PROJECT_ID`: Firebase project identifier
- `FIREBASE_CLIENT_EMAIL`: Service account email
- `FIREBASE_PRIVATE_KEY_BASE64`: Base64 encoded private key from service account JSON

#### Email Service
- `RESEND_API_KEY`: Resend.com API key for transactional emails
- `EMAIL_FROM`: Sender email address (must be verified in Resend)
- `EMAIL_FROM_NAME`: Display name for emails
- `EMAIL_ENABLED`: Enable/disable email functionality

#### Analytics & Monitoring
- `VITE_GA_MEASUREMENT_ID`: Google Analytics 4 measurement ID
- `GA_API_SECRET`: GA4 API secret for server-side tracking
- `VITE_POSTHOG_KEY`: PostHog project API key
- `SENTRY_DSN`: Sentry error tracking DSN

#### Redis Configuration
- `REDIS_URL`: Full Redis connection URL
- `ENABLE_REDIS_CACHE`: Enable Redis caching layer
- `REDIS_CACHE_TTL`: Cache time-to-live in seconds (default: 3600)

## Pre-Deployment Checklist

### 1. Configuration Validation
```bash
# Validate all required environment variables
npm run validate:production

# Check production configuration
npm run check:production

# Validate specific services
npm run config:validate
```

### 2. Build Verification
```bash
# Run production build
npm run build

# Analyze bundle size
npm run bundle:analyze

# Check performance budget
npm run perf:analyze
```

### 3. Database Preparation
```bash
# Check database connection
npm run db:status

# Run migrations
npm run db:push

# Apply performance indexes
npm run db:indexes
npm run db:indexes-enhanced
npm run db:search-indexes

# Create test data (optional)
npm run create:test-users
```

### 4. Security Audit
```bash
# Run security audit
npm audit

# Check for vulnerabilities
npm audit fix

# Validate HTTPS configuration
# Ensure all URLs use HTTPS in production
```

## Database Setup

### PostgreSQL Setup

#### Option 1: Neon (Recommended for Serverless)
1. Create account at https://neon.tech
2. Create new project
3. Copy connection string from dashboard
4. Add `?sslmode=require` to connection string

#### Option 2: Supabase
1. Create account at https://supabase.com
2. Create new project
3. Navigate to Settings > Database
4. Use "Transaction Mode" connection string
5. Add to `DATABASE_URL` environment variable

#### Option 3: AWS RDS
1. Create PostgreSQL instance in RDS
2. Configure security groups for access
3. Enable SSL/TLS
4. Use connection string format:
   ```
   postgresql://username:password@endpoint.region.rds.amazonaws.com:5432/dbname?sslmode=require
   ```

### Database Migration Steps

1. **Initial Schema Setup**
   ```bash
   # Push schema to database
   npm run db:push
   ```

2. **Apply Indexes**
   ```bash
   # Standard performance indexes
   npm run db:indexes

   # Enhanced indexes for complex queries
   npm run db:indexes-enhanced

   # Search-specific indexes
   npm run db:search-indexes
   ```

3. **Verify Setup**
   ```bash
   # Check database status
   npm run db:status
   ```

4. **Import Initial Data** (if applicable)
   ```bash
   # Import terms from CSV/Excel
   npm run import:optimized -- --file data/terms.csv
   ```

## Deployment Platforms

### Vercel Deployment

#### Prerequisites
- Vercel account
- Vercel CLI installed (`npm i -g vercel`)

#### Deployment Steps

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Configure Project**
   Create `vercel.json`:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": null,
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "/api/index.js"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy**
   ```bash
   # Deploy to Vercel
   vercel --prod

   # Set environment variables
   vercel env add DATABASE_URL production
   vercel env add JWT_SECRET production
   # ... add all other variables
   ```

4. **Configure Custom Domain**
   - Go to Vercel Dashboard > Settings > Domains
   - Add your custom domain
   - Update DNS records

### AWS EC2 Deployment

#### Prerequisites
- AWS account
- EC2 instance (t3.medium or larger)
- Elastic IP assigned
- Security groups configured

#### Deployment Steps

1. **Server Setup**
   ```bash
   # Connect to EC2 instance
   ssh -i your-key.pem ubuntu@your-instance-ip

   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 20.x
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install build tools
   sudo apt-get install -y build-essential

   # Install PM2
   sudo npm install -g pm2

   # Install Nginx
   sudo apt-get install -y nginx
   ```

2. **Application Setup**
   ```bash
   # Clone repository
   git clone https://github.com/your-repo/aiglossarypro.git
   cd aiglossarypro

   # Install dependencies
   npm install

   # Create production env file
   nano .env.production
   # Add all environment variables

   # Build application
   npm run build
   ```

3. **PM2 Configuration**
   Create `ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [{
       name: 'aiglossary-pro',
       script: './dist/index.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3001
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };
   ```

4. **Start Application**
   ```bash
   # Start with PM2
   pm2 start ecosystem.config.js

   # Save PM2 configuration
   pm2 save

   # Setup PM2 startup script
   pm2 startup
   ```

5. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name aiglossarypro.com www.aiglossarypro.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

6. **SSL Setup with Let's Encrypt**
   ```bash
   # Install Certbot
   sudo snap install --classic certbot
   sudo ln -s /snap/bin/certbot /usr/bin/certbot

   # Get SSL certificate
   sudo certbot --nginx -d aiglossarypro.com -d www.aiglossarypro.com
   ```

### Railway Deployment

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy**
   ```bash
   # Login to Railway
   railway login

   # Initialize project
   railway init

   # Deploy
   railway up

   # Add environment variables
   railway variables set DATABASE_URL="your-database-url"
   # ... set all other variables
   ```

### Render Deployment

1. **Create `render.yaml`**
   ```yaml
   services:
     - type: web
       name: aiglossary-pro
       runtime: node
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: DATABASE_URL
           fromDatabase:
             name: aiglossary-db
             property: connectionString
   
   databases:
     - name: aiglossary-db
       plan: starter
       databaseName: aiglossary
       user: aiglossary
   ```

2. **Deploy via Dashboard**
   - Connect GitHub repository
   - Select branch
   - Deploy

### Self-Hosted Deployment

#### Using Docker

1. **Create `Dockerfile`**
   ```dockerfile
   FROM node:20-alpine

   WORKDIR /app

   # Copy package files
   COPY package*.json ./
   RUN npm ci --only=production

   # Copy application files
   COPY . .

   # Build application
   RUN npm run build

   # Expose port
   EXPOSE 3001

   # Start application
   CMD ["node", "dist/index.js"]
   ```

2. **Create `docker-compose.yml`**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3001:3001"
       environment:
         - NODE_ENV=production
       env_file:
         - .env.production
       depends_on:
         - postgres
         - redis

     postgres:
       image: postgres:16
       environment:
         POSTGRES_DB: aiglossary
         POSTGRES_USER: aiglossary
         POSTGRES_PASSWORD: your-secure-password
       volumes:
         - postgres_data:/var/lib/postgresql/data

     redis:
       image: redis:7-alpine
       command: redis-server --requirepass your-redis-password
       volumes:
         - redis_data:/data

   volumes:
     postgres_data:
     redis_data:
   ```

3. **Deploy**
   ```bash
   # Build and start services
   docker-compose up -d

   # View logs
   docker-compose logs -f
   ```

## Firebase Configuration

### Setting Up Firebase Authentication

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Create new project
   - Enable Authentication

2. **Enable Auth Providers**
   - Navigate to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google (optional)
   - Enable GitHub (optional)

3. **Get Configuration**
   - Go to Project Settings > General
   - Copy web app configuration
   - Add to `VITE_FIREBASE_*` environment variables

4. **Generate Service Account**
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Download JSON file
   - Convert to base64:
     ```bash
     cat serviceAccountKey.json | base64 -w 0
     ```
   - Add to `FIREBASE_PRIVATE_KEY_BASE64`

5. **Configure Authorized Domains**
   - Go to Authentication > Settings
   - Add your production domain to authorized domains

## Email Service Setup

### Resend Configuration (Recommended)

1. **Create Resend Account**
   - Sign up at https://resend.com
   - Verify your domain

2. **Generate API Key**
   - Go to API Keys
   - Create new API key
   - Add to `RESEND_API_KEY`

3. **Verify Domain**
   - Add DNS records as instructed
   - Wait for verification

4. **Test Email**
   ```bash
   npm run test:email
   ```

### Alternative: AWS SES

1. **Setup SES**
   ```bash
   # Configure AWS credentials
   aws configure

   # Verify domain
   aws ses verify-domain-identity --domain aiglossarypro.com

   # Verify email address
   aws ses verify-email-identity --email-address noreply@aiglossarypro.com
   ```

2. **Update Environment**
   ```bash
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   EMAIL_PROVIDER=ses
   ```

### Alternative: SMTP

1. **Configure SMTP**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-specific-password
   EMAIL_PROVIDER=smtp
   ```

## Redis Configuration

### Redis Setup Options

#### Option 1: Redis Cloud
1. Sign up at https://redis.com
2. Create new database
3. Copy connection string
4. Add to `REDIS_URL`

#### Option 2: AWS ElastiCache
1. Create Redis cluster in ElastiCache
2. Configure security groups
3. Use connection endpoint

#### Option 3: Self-Hosted
```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: requirepass your-secure-password
# Set: bind 0.0.0.0

# Restart Redis
sudo systemctl restart redis

# Test connection
redis-cli -h localhost -a your-secure-password ping
```

### Redis Configuration in App

```bash
# Required environment variables
REDIS_URL=redis://user:password@host:port/0
REDIS_ENABLED=true
ENABLE_REDIS_CACHE=true
REDIS_CACHE_TTL=3600
REDIS_CACHE_PREFIX=aiglossary:
```

## CDN Configuration

### CloudFlare Setup

1. **Add Site to CloudFlare**
   - Add your domain
   - Update nameservers
   - Wait for propagation

2. **Configure Settings**
   - SSL/TLS: Full (strict)
   - Always Use HTTPS: On
   - Auto Minify: JavaScript, CSS, HTML
   - Brotli: On

3. **Page Rules**
   ```
   *aiglossarypro.com/api/*
   - Cache Level: Bypass
   
   *aiglossarypro.com/assets/*
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   ```

### AWS CloudFront Setup

1. **Create Distribution**
   ```bash
   # Configure in environment
   CDN_PROVIDER=cloudfront
   AWS_CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
   ```

2. **Configure Origins**
   - Origin Domain: your-app-domain.com
   - Origin Protocol: HTTPS Only

3. **Configure Behaviors**
   - `/api/*`: No caching
   - `/assets/*`: Cache with long TTL

## Post-Deployment Verification

### 1. Health Checks

```bash
# Check application health
curl https://aiglossarypro.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-22T10:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "email": "configured"
  }
}
```

### 2. Service Verification

```bash
# Test database connection
npm run db:status

# Test email service
npm run test:email

# Test analytics
npm run test:analytics

# Test authentication
curl -X POST https://aiglossarypro.com/api/auth/test
```

### 3. Performance Testing

```bash
# Run Lighthouse test
npm run lighthouse

# Check Core Web Vitals
npm run perf:analyze

# Load testing (using k6)
k6 run scripts/load-test.js
```

### 4. Security Verification

```bash
# Check SSL configuration
curl -I https://aiglossarypro.com

# Verify security headers
curl -I https://aiglossarypro.com | grep -E "(Strict-Transport|Content-Security|X-Frame)"

# Test rate limiting
for i in {1..150}; do curl https://aiglossarypro.com/api/terms; done
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Database Connection Failed
```
Error: connect ECONNREFUSED
```
**Solutions:**
- Verify `DATABASE_URL` format
- Check database server is running
- Verify SSL mode is enabled
- Check firewall/security group rules

#### 2. Firebase Authentication Error
```
Error: Firebase ID token has incorrect "aud" claim
```
**Solutions:**
- Verify `FIREBASE_PROJECT_ID` matches
- Check Firebase configuration in frontend
- Ensure service account is correct
- Regenerate and update private key

#### 3. Email Sending Failed
```
Error: Email service not configured
```
**Solutions:**
- Verify `RESEND_API_KEY` is set
- Check domain verification status
- Test with `npm run test:email`
- Check email service logs

#### 4. Redis Connection Error
```
Error: Redis connection refused
```
**Solutions:**
- Verify `REDIS_URL` format
- Check Redis server is running
- Verify authentication credentials
- Check network connectivity

#### 5. High Memory Usage
```
Error: JavaScript heap out of memory
```
**Solutions:**
- Increase Node.js memory limit:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npm start
  ```
- Enable Redis caching
- Optimize database queries
- Implement pagination

### Debug Mode

Enable debug mode for detailed logging:

```bash
# In environment variables
VITE_ENABLE_DEBUG_MODE=true
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
ENABLE_ERROR_LOGGING=true
```

## Production Considerations

### Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use secret management services
   - Rotate secrets regularly
   - Use strong, unique passwords

2. **HTTPS Configuration**
   - Force HTTPS redirect
   - Use HSTS headers
   - Implement CSP headers
   - Regular SSL certificate renewal

3. **Authentication**
   - Implement rate limiting
   - Use secure session configuration
   - Enable 2FA for admin accounts
   - Regular security audits

4. **Data Protection**
   - Encrypt sensitive data
   - Regular database backups
   - GDPR compliance
   - Data retention policies

### Performance Optimization

1. **Caching Strategy**
   ```bash
   # Enable all caching layers
   ENABLE_REDIS_CACHE=true
   ENABLE_MEMORY_CACHE=true
   CACHE_TTL_SECONDS=3600
   ```

2. **Database Optimization**
   - Use connection pooling
   - Implement query caching
   - Regular index maintenance
   - Monitor slow queries

3. **Asset Optimization**
   - Enable CDN for static assets
   - Implement image optimization
   - Use Brotli compression
   - Lazy load components

### Monitoring and Alerting

1. **Application Monitoring**
   - Sentry for error tracking
   - PostHog for analytics
   - Custom health endpoints
   - Performance metrics

2. **Infrastructure Monitoring**
   - Server resource usage
   - Database performance
   - Redis memory usage
   - Network latency

3. **Alerting Rules**
   - High error rate
   - Database connection issues
   - Memory usage > 80%
   - Response time > 1s

### Backup and Disaster Recovery

1. **Database Backups**
   ```bash
   # Automated daily backups
   0 2 * * * pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

2. **Application Backups**
   - Git repository backups
   - Environment variable backups
   - User uploaded content backups

3. **Recovery Procedures**
   - Document recovery steps
   - Test recovery process
   - Maintain recovery time objectives

## Rollback Procedures

### Quick Rollback

1. **Application Rollback**
   ```bash
   # Using PM2
   pm2 deploy production revert 1

   # Using Git
   git checkout previous-version-tag
   npm install
   npm run build
   pm2 restart all
   ```

2. **Database Rollback**
   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup-20250122.sql
   ```

3. **Environment Rollback**
   - Restore previous environment variables
   - Revert configuration changes
   - Clear caches

### Rollback Checklist

- [ ] Identify issue requiring rollback
- [ ] Notify team of rollback
- [ ] Stop current deployment
- [ ] Restore previous version
- [ ] Verify services are running
- [ ] Test critical functionality
- [ ] Document rollback reason
- [ ] Plan fix for next deployment

## Support and Resources

### Getting Help

1. **Documentation**
   - Check this deployment guide
   - Review error logs
   - Consult service documentation

2. **Debugging Steps**
   - Enable debug logging
   - Check all service connections
   - Review recent changes
   - Test in isolation

3. **Common Commands**
   ```bash
   # Check status
   npm run db:status
   pm2 status
   
   # View logs
   pm2 logs
   tail -f logs/error.log
   
   # Restart services
   pm2 restart all
   sudo systemctl restart nginx
   ```

### Useful Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Firebase Documentation](https://firebase.google.com/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

Remember: Always test deployments in a staging environment before deploying to production. Keep backups of all critical data and maintain a rollback plan.