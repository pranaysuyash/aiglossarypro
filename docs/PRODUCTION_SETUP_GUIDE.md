# AI Glossary Pro - Production Setup Guide

## 🚀 Quick Production Checklist

### Critical Environment Variables to Configure

#### 1. Email Service (Choose One)

**Option A: Gmail SMTP (Easy Setup)**
```bash
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password  # Get from Google Account settings
FROM_EMAIL=noreply@aimlglossary.com
EMAIL_FROM_NAME="AI Glossary Pro"
```

**Option B: Resend (Recommended for Production)**
```bash
EMAIL_ENABLED=true
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Get from https://resend.com
EMAIL_FROM=noreply@aimlglossary.com
EMAIL_FROM_NAME="AI Glossary Pro"
```

**Option C: SendGrid**
```bash
EMAIL_ENABLED=true
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Get from SendGrid
EMAIL_FROM=noreply@aimlglossary.com
EMAIL_FROM_NAME="AI Glossary Pro"
```

#### 2. Google Analytics 4
1. Go to [Google Analytics](https://analytics.google.com)
2. Create a new property for aimlglossary.com
3. Get your Measurement ID (starts with G-)
4. Update in .env.production:
```bash
VITE_GA4_MEASUREMENT_ID=G-YOUR_ACTUAL_ID
VITE_GA4_ENABLED=true
```

#### 3. Gumroad Webhook Secret
1. Log in to [Gumroad](https://gumroad.com)
2. Go to Settings > Advanced > Webhooks
3. Add webhook URL: `https://aimlglossary.com/api/gumroad/webhooks/sale`
4. Generate and copy the webhook secret
5. Update in .env.production:
```bash
GUMROAD_WEBHOOK_SECRET=your-webhook-secret-here
```

#### 4. Production Domain Configuration
```bash
BASE_URL=https://aimlglossary.com
PRODUCTION_URL=https://aimlglossary.com
VITE_APP_URL=https://aimlglossary.com
VITE_API_BASE_URL=https://aimlglossary.com
```

#### 5. Sentry Error Tracking (Optional but Recommended)
1. Sign up at [Sentry.io](https://sentry.io)
2. Create a new project
3. Copy your DSN
4. Update in .env.production:
```bash
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567
VITE_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567
```

#### 6. Redis Configuration (For Production Caching)
```bash
REDIS_ENABLED=true
REDIS_URL=redis://user:password@your-redis-host:6379
# Or use individual settings:
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
```

## 📋 Complete Production Environment Template

Create a `.env.production` file with all these values:

```bash
# =================================================================================
# CRITICAL - MUST CONFIGURE BEFORE LAUNCH
# =================================================================================

# Application
NODE_ENV=production
PORT=3000
BASE_URL=https://aimlglossary.com
PRODUCTION_URL=https://aimlglossary.com
VITE_APP_URL=https://aimlglossary.com
VITE_API_BASE_URL=https://aimlglossary.com

# Database (Already Configured)
DATABASE_URL=postgresql://neondb_owner:npg_9dlJKInqoT1w@ep-wandering-morning-a5u0szvw.us-east-2.aws.neon.tech/neondb?sslmode=require

# Session Security (Already Configured)
SESSION_SECRET=JCmY1YTJ2lXuEKhHgKZURZfub9S7WNQgy5Om2NFDdWu3dg0CtqB7wQGyXHzQG2sqDVAkGE9H9ual6uc1cVn8LA==
JWT_SECRET=JCmY1YTJ2lXuEKhHgKZURZfub9S7WNQgy5Om2NFDdWu3dg0CtqB7wQGyXHzQG2sqDVAkGE9H9ual6uc1cVn8LA==

# Email Service (CONFIGURE THIS!)
EMAIL_ENABLED=true
# Option 1: Resend (Recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Option 2: Gmail SMTP
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@aimlglossary.com
EMAIL_FROM_NAME="AI Glossary Pro"

# Payment Processing (CONFIGURE THIS!)
GUMROAD_WEBHOOK_SECRET=your-gumroad-webhook-secret

# Analytics (CONFIGURE THIS!)
VITE_GA4_MEASUREMENT_ID=G-YOUR_ACTUAL_ID
VITE_GA4_ENABLED=true
VITE_GA4_API_SECRET=your-ga4-api-secret

# Error Tracking (CONFIGURE THIS!)
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567
VITE_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/1234567

# Redis Caching (CONFIGURE THIS!)
REDIS_ENABLED=true
REDIS_URL=redis://user:password@your-redis-host:6379

# =================================================================================
# ALREADY CONFIGURED - NO CHANGES NEEDED
# =================================================================================

# Firebase Auth
VITE_FIREBASE_API_KEY=AIzaSyBqJ7OMRjr54_CMJpEDMWKR6XQ4Y8qzfdg
VITE_FIREBASE_AUTH_DOMAIN=aiglossarypro.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=aiglossarypro
VITE_FIREBASE_STORAGE_BUCKET=aiglossarypro.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=449850174939
VITE_FIREBASE_APP_ID=1:449850174939:web:08d7973752807207d24bfe
FIREBASE_PROJECT_ID=aiglossarypro
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@aiglossarypro.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_BASE64=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQ0wyME9wZlJ0bG8rQVAKWUtURzBWbDgveHdlVWRUbnZ4a205eWNyUXpPRHhMVVNWSlRacHN1NGRhS0N3ZUtiVUtTM0RiZEhQYTJEMUFZSQo1b3g0a2UvcytSWWxEbm9mR1hzNnV1QXNWaEE4ZkxUMDVSSEhoNHVZSG5aT205N3lOREl6MUJvYjZFM0JvWjdJCmMyY2VaeXdyYVpaTDBRUzZRbi9kT1RabzNua09vOEhMeXlTL1ZnYmYvNk5vd0g4YldTdHlWZnV4cmVrYzdNOXcKN2w1czlhS0N0cHo1ZFROajAxOG1VdmpHZDNWS0kwQ0R5NmVoQkVTdjVYV3FOdTYvbXB1dWhJUmx2MHdFS2lhRwpwTXlzYUt1cUUyaTRzbk1RTzVWNmFnNU9pVk1kNnNPY1I4ZmtrMXBHMHJUZlhlaHpHVTlXbUh1NUdheGJRU1UwCjFXNnlKU1ZmQWdNQkFBRUNnZ0VBRTZmQXBpRE5pV2JURmdZc2tqNlkxNDdZNmsvdzNwTUdXMm9QeUs0OG5xKzIKRFBuekkzV2tHdXY1WjJ3TlIydTVnbnA4Z0Jna2V5c0FvQjZhcmxWQVJXc3FXQkhsU3RxZmJYMFhCVlFoR3djaAp2V3MyS1BjZFFNZERORUFHd0w1aU1kT0V5ZGhIbVVkNEU4N1lOcmNrUjRPaTJrdnBZSzM0MzJQcmlDaUFGZlRyCmxLQmQ2bHdaTHU5c0huVnlWVGdzNmZ0Vlpla3RadmkxY2drOUZzRUJsK0IzUGxsSXpUSEJSWHJBczBqV2lTYUwKRE9HbVk2eC92T2lFQnRQeWJIenNkNVN5c1BpblF2MEluYnRNSzBKeGV4Skh4ME1uQ3VKYjdUWHhheUdxb3Z5UAoyQTVsMG9nd3lDNFV5K2FuRW5SMWRiSWF2cDdtZ2xURjA0dzVCVmhZUFFLQmdRREJMUWJCVG9EaG1meWVDUkZ0CmlhSmJFYlFYbmNyc2xrbCtaVGErM0U1d054ZUJoazJBd3VlVVlRUDhGbWhQRkc5QS9GVGE5ZW8reGZldjhQUFIKVk9SaWxCNTFkczg2ZkhycEhTUTM3bGJVMnl1T2VRRE5aM0hjVjBrYm1UVFBUM040TEVQOW9mdFFUTURuWFo4LwpSeEJ5YkJCTEc0bEw4YktmWmdGeCszVVZuUUtCZ1FDNVZ4blFNWjBxb3dsZTJOMlBmS2pmRTRtdmRNYVY5ZWpjClFzenp0bk5uNmZwdnFITXliWHhyeHVmeXh5dEx5YjlqWlhyWmxYQmxnOXhmK1EwTVFYRUFuL1c3MWw4eW9SRUUKZnV1VUJLb01Xb21NNk9odmF1Z1VkQ09WdjN5U3I2YUNFL2VRWGMzaHY0SzMwRld5TjFGNlpRdzZpN082T1MvTApqSW1Dbi85VUt3S0JnSDlOb2ZjQU9oVHllclRXK3dJNXdxSExYK2gwVjBka254aEpzVE5FVWZqSGhaa1pIYmd1Ck9aamgrbE5GblFZSVRHMENIUldUSEFTMFI4OU50aEFNcHRtRURUS1IwbTBUblpoRVdScjIyWWc2eTFCLzA1U0oKaUZLUnZ4OE43dXh6eW4rMmhEUUFiSEwxc2VhSEh5di9OQXFEeHBVSWw0bFJ4Y29mMmZINHFhZE5Bb0dBYXQySwpDTDFTdmU3YnpGQ0hEK0QxRGdzWjdJME1wQkx5Zlc0VzlyOVFzNjM1dE1BUURCZU5FaWZTUGU0UlROVzdBUGpXCmFQYjlvOHJ3R25aank1bEFLdmdRbklueXdpS1V5VjdWUHJlaHhSVy9FZnlKYVJUZlZFdlM2TmxNWHRmZ3prZnQKQ3RUTGpVcjdlRGtyOEdKdEhJRi9GNUxOd3FhT3BITVlKclZTWjVrQ2dZRUFoWE1LS2VncGY2ZGNENTNUQUFmegppWlNNSlpXOUxORFpMSi9yUFBLMSs1QnpqTnozMVpERjdXUmxQWHpZM05TNGdTNGNIM3JnTjlHb0V1QmRLcTNtClVmZlZiN1FnUGM3TS9zNDAyanluSVNNNlBYYmhjUnRRcXpqNnVvc05EYjVxcS9GMGVDV3NWYmViUUVKdldrb1IKZW4va043ejlGUER4Tmd6VDkxb1dQd2s9Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K

# PostHog Analytics
POSTHOG_API_KEY=phc_mYHD50kDJLqHf9s9w2jMDeDpJYu3V8ySNJNmdNROZA1
VITE_POSTHOG_KEY=phc_mYHD50kDJLqHf9s9w2jMDeDpJYu3V8ySNJNmdNROZA1
VITE_PUBLIC_POSTHOG_KEY=phc_mYHD50kDJLqHf9s9w2jMDeDpJYu3V8ySNJNmdNROZA1
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
VITE_DISABLE_ANALYTICS=false  # Always false in production

# Gumroad Products
VITE_GUMROAD_PRODUCT_URL=https://pranaysuyash.gumroad.com/l/ggczfy
VITE_GUMROAD_DISCOUNT_URL=https://pranaysuyash.gumroad.com/l/ggczfy/EARLY500
VITE_GUMROAD_BASE_PRICE=249
VITE_GUMROAD_EARLY_BIRD_PRICE=179
VITE_PPP_MIN_PRICE=99
VITE_PPP_MAX_DISCOUNT=60
VITE_PPP_ENABLED=true
VITE_EARLY_BIRD_SAVINGS=70

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-s3-bucket-name

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_API_URL=https://api.openai.com/v1

# Features
USE_ENHANCED_STORAGE=true
VITE_ADSENSE_ENABLED=true
VITE_ADSENSE_CLIENT_ID=ca-pub-4029276457986605
```

## 🔧 Service Setup Instructions

### Email Service Setup

#### Gmail SMTP:
1. Go to Google Account settings
2. Enable 2-factor authentication
3. Generate an app-specific password
4. Use that password in SMTP_PASS

#### Resend:
1. Sign up at https://resend.com
2. Verify your domain
3. Get API key from dashboard
4. Add to RESEND_API_KEY

### Google Analytics 4:
1. Create property at https://analytics.google.com
2. Add your domain
3. Get Measurement ID
4. Optional: Create API secret for server-side tracking

### Gumroad Webhook:
1. Log in to Gumroad
2. Settings > Advanced > Webhooks
3. Add: https://aimlglossary.com/api/gumroad/webhooks/sale
4. Copy the generated secret

### Redis Setup:
- Use Redis Cloud: https://redis.com/try-free/
- Or Upstash: https://upstash.com/
- Or your VPS provider's Redis service

### Sentry:
1. Sign up at https://sentry.io
2. Create Node.js project
3. Copy DSN from project settings

## 🚀 Deployment Steps

1. Copy this configuration to your production server
2. Fill in all the CONFIGURE THIS! sections
3. Test email sending
4. Test payment webhook
5. Verify analytics tracking
6. Check error reporting

## ✅ Pre-Launch Verification

Run these commands to verify setup:
```bash
# Check environment variables
node scripts/validate-production-config.js

# Test email sending
node scripts/test-email.js

# Test payment webhook
node scripts/test-gumroad-webhook.js

# Verify analytics
node scripts/verify-analytics.js
```