# AI Glossary Pro - Production Configuration Guide

This guide covers all the configuration steps needed to deploy AI Glossary Pro to production.

## Table of Contents
- [Prerequisites](#prerequisites)
- [1. Google Analytics 4 (GA4) Setup](#1-google-analytics-4-ga4-setup)
- [2. Email Configuration (Resend)](#2-email-configuration-resend)
- [3. Gumroad Webhook Configuration](#3-gumroad-webhook-configuration)
- [4. Production Domain Setup](#4-production-domain-setup)
- [5. CDN Configuration](#5-cdn-configuration)
- [6. Environment Variables](#6-environment-variables)
- [7. SSL/TLS Configuration](#7-ssltls-configuration)
- [8. Testing Production Configuration](#8-testing-production-configuration)

## Prerequisites

Before starting, ensure you have:
- A production domain with DNS access
- Accounts for required services (Google Analytics, Resend, Gumroad, etc.)
- Access to your hosting provider's configuration
- SSL certificates for your domain

## 1. Google Analytics 4 (GA4) Setup

### Step 1: Create a GA4 Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Click on "Admin" (gear icon in bottom left)
3. Click "Create Property"
4. Enter your property details:
   - Property name: "AI Glossary Pro"
   - Time zone: Your business time zone
   - Currency: Your preferred currency
5. Click "Next" and fill in business details

### Step 2: Set Up Web Data Stream

1. In the property, go to "Data Streams"
2. Click "Add stream" > "Web"
3. Enter:
   - Website URL: `https://yourdomain.com`
   - Stream name: "AI Glossary Pro Web"
4. Click "Create stream"

### Step 3: Get Your Measurement ID

1. In the data stream details, copy the "Measurement ID" (starts with `G-`)
2. Add to your `.env.production`:
   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### Step 4: Create API Secret for Server-Side Tracking

1. In the data stream page, scroll to "Additional Settings"
2. Click "Measurement Protocol API secrets"
3. Click "Create"
4. Enter a nickname: "Server Tracking"
5. Copy the secret value
6. Add to your `.env.production`:
   ```
   GA_API_SECRET=your_api_secret_here
   ```

### Step 5: Configure Enhanced Measurement

1. In the data stream, click "Enhanced measurement" settings
2. Enable:
   - Page views
   - Scrolls
   - Outbound clicks
   - Site search
   - File downloads
   - Form interactions

## 2. Email Configuration (Resend)

### Step 1: Create Resend Account

1. Go to [Resend](https://resend.com)
2. Sign up for an account
3. Verify your email address

### Step 2: Add and Verify Your Domain

1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain: `yourdomain.com`
4. Add the DNS records provided to your domain's DNS settings:
   - SPF record
   - DKIM records
   - MX record (optional, for receiving emails)
5. Wait for verification (usually takes a few minutes)

### Step 3: Create API Key

1. Go to "API Keys" in Resend dashboard
2. Click "Create API Key"
3. Name it: "AI Glossary Pro Production"
4. Select permissions: "Send emails"
5. Copy the API key
6. Add to your `.env.production`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=AI Glossary Pro
   EMAIL_ENABLED=true
   ```

### Step 4: Configure Email Templates (Optional)

The application already includes email templates for:
- Welcome emails
- Premium upgrade confirmation
- Password reset
- Support ticket notifications
- Refund notifications

No additional configuration needed unless you want to customize them.

## 3. Gumroad Webhook Configuration

### Step 1: Get Gumroad Access Token

1. Log in to [Gumroad](https://gumroad.com)
2. Go to Settings > Advanced > Applications
3. Click "Create Application"
4. Name: "AI Glossary Pro Webhooks"
5. Generate Access Token
6. Copy the token and add to `.env.production`:
   ```
   GUMROAD_ACCESS_TOKEN=your_access_token_here
   ```

### Step 2: Configure Webhooks

1. In Gumroad Settings > Advanced > Webhooks
2. Add webhook endpoints:

#### Sale Webhook
- URL: `https://yourdomain.com/api/gumroad/webhooks/sale`
- Events: Sale

#### Refund Webhook
- URL: `https://yourdomain.com/api/gumroad/webhooks/refund`
- Events: Refund

#### Dispute Webhook
- URL: `https://yourdomain.com/api/gumroad/webhooks/dispute`
- Events: Dispute

#### Cancellation Webhook (for subscriptions)
- URL: `https://yourdomain.com/api/gumroad/webhooks/cancellation`
- Events: Cancellation

### Step 3: Generate Webhook Secret

1. For each webhook, Gumroad will provide a signing secret
2. Copy the secret and add to `.env.production`:
   ```
   GUMROAD_WEBHOOK_SECRET=your_webhook_secret_here
   ```

### Step 4: Update Product URL

Add your Gumroad product URL to `.env.production`:
```
VITE_GUMROAD_PRODUCT_URL=https://gumroad.com/l/your-product-id
```

## 4. Production Domain Setup

### Step 1: Update Environment Variables

```env
VITE_APP_URL=https://yourdomain.com
VITE_API_BASE_URL=https://yourdomain.com
```

### Step 2: Configure CORS

The application automatically configures CORS based on `VITE_APP_URL`. No additional setup needed.

### Step 3: Update Firebase Authorized Domains

1. Go to Firebase Console > Authentication > Settings
2. Add your production domain to "Authorized domains":
   - `yourdomain.com`
   - `www.yourdomain.com` (if using www)

### Step 4: Update OAuth Redirect URIs

For Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project > APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   - `https://yourdomain.com/api/auth/google/callback`
   - `https://yourdomain.com/auth/callback`

For GitHub OAuth (if using):
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Update Authorization callback URL:
   - `https://yourdomain.com/api/auth/github/callback`

## 5. CDN Configuration

### Option A: Cloudflare (Recommended)

1. Add your domain to Cloudflare
2. Update your domain's nameservers to Cloudflare's
3. In Cloudflare dashboard:
   - Enable "Always Use HTTPS"
   - Set SSL/TLS to "Full (strict)"
   - Enable "Auto Minify" for JS, CSS, HTML
   - Create Page Rules:
     - `*yourdomain.com/api/*` - Cache Level: Bypass
     - `*yourdomain.com/assets/*` - Cache Level: Cache Everything, Edge Cache TTL: 1 month
     - `*yourdomain.com/*.js` - Cache Level: Cache Everything, Edge Cache TTL: 1 week
     - `*yourdomain.com/*.css` - Cache Level: Cache Everything, Edge Cache TTL: 1 week

4. Get your API credentials:
   - Zone ID: Found in Overview tab
   - API Token: Create in My Profile > API Tokens

5. Add to `.env.production`:
   ```
   CDN_PROVIDER=cloudflare
   CLOUDFLARE_ZONE_ID=your_zone_id
   CLOUDFLARE_API_TOKEN=your_api_token
   ```

### Option B: AWS CloudFront

1. Create a CloudFront distribution
2. Configure origins:
   - Origin Domain: Your server domain/IP
   - Origin Protocol: HTTPS only
3. Configure behaviors:
   - `/api/*` - Cache: Disabled
   - `/assets/*` - Cache: 1 year
   - Default - Cache: 1 day
4. Add to `.env.production`:
   ```
   CDN_PROVIDER=cloudfront
   AWS_CLOUDFRONT_DISTRIBUTION_ID=your_distribution_id
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   ```

## 6. Environment Variables

### Step 1: Copy Example File

```bash
cp .env.production.example .env.production
```

### Step 2: Generate Secure Secrets

Generate secure secrets for JWT and session:

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate session secret
openssl rand -base64 32

# Generate cookie secret
openssl rand -base64 32
```

Add these to your `.env.production`:
```
JWT_SECRET=your_generated_jwt_secret
SESSION_SECRET=your_generated_session_secret
COOKIE_SECRET=your_generated_cookie_secret
```

### Step 3: Configure Database

For PostgreSQL:
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

### Step 4: Configure Redis

```
REDIS_URL=redis://user:password@host:port
# Or individual settings:
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true
```

## 7. SSL/TLS Configuration

### Option 1: Let's Encrypt with Certbot (Recommended)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Set up auto-renewal
sudo certbot renew --dry-run
```

### Option 2: Use Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/aiglossarypro`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/aiglossarypro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Testing Production Configuration

### Step 1: Test Email Service

```bash
# Run the email test script
npm run test:email
```

### Step 2: Test Gumroad Webhooks

1. Use Gumroad's webhook testing tool in the dashboard
2. Or run the test script:
   ```bash
   npm run test:gumroad
   ```

### Step 3: Test Analytics

```bash
# Run analytics test
npm run test:analytics
```

### Step 4: Full Production Validation

```bash
# Run comprehensive production validation
npm run validate:production
```

This will check:
- All environment variables are set
- External services are reachable
- Database connection works
- Redis connection works
- Email service works
- Analytics tracking works
- Gumroad integration works

### Step 5: Monitor Logs

After deployment, monitor logs for any issues:
```bash
# If using PM2
pm2 logs ai-glossary-pro

# If using systemd
journalctl -u ai-glossary-pro -f

# Application logs
tail -f logs/app.log
```

## Next Steps

1. Set up monitoring and alerting (Sentry, Datadog, etc.)
2. Configure backup strategies for database
3. Set up CI/CD pipeline for automated deployments
4. Implement health checks and uptime monitoring
5. Configure rate limiting and DDoS protection
6. Set up log aggregation and analysis

## Troubleshooting

### Email not sending
- Verify Resend API key is correct
- Check domain verification in Resend dashboard
- Look for errors in server logs

### Gumroad webhooks failing
- Verify webhook URLs are accessible from internet
- Check webhook secret matches
- Test with Gumroad's webhook tester
- Check server logs for signature validation errors

### Analytics not tracking
- Verify GA4 measurement ID is correct
- Check that analytics is enabled in production
- Use GA4 DebugView to test tracking
- Check browser console for errors

### SSL/TLS issues
- Verify certificates are valid and not expired
- Check certificate paths in configuration
- Ensure ports 80 and 443 are open
- Test with SSL Labs: https://www.ssllabs.com/ssltest/