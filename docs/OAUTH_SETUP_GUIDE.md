# OAuth Setup Guide for AI/ML Glossary Pro

This guide will walk you through setting up OAuth authentication for your application.

## 🔐 Google OAuth Setup

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name it "AI ML Glossary Pro" and create

### 2. Enable Google+ API
1. In the project dashboard, go to "APIs & Services" → "Enable APIs and Services"
2. Search for "Google+ API" and enable it
3. Also enable "Google Identity Toolkit API"

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in app information:
     - App name: "AI/ML Glossary Pro"
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if in development

### 4. Configure OAuth Client
1. Application type: "Web application"
2. Name: "AI ML Glossary Pro Web Client"
3. Authorized JavaScript origins:
   ```
   http://localhost:3000
   http://localhost:3001
   https://your-production-domain.com
   ```
4. Authorized redirect URIs:
   ```
   http://localhost:3001/api/auth/google/callback
   https://your-production-domain.com/api/auth/google/callback
   ```
5. Click "Create"

### 5. Save Credentials
Copy the Client ID and Client Secret and add to your `.env` file:
```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## 🐙 GitHub OAuth Setup

### 1. Create GitHub OAuth App
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"

### 2. Configure the App
Fill in the following:
- **Application name**: AI/ML Glossary Pro
- **Homepage URL**: https://your-production-domain.com (or http://localhost:3000 for dev)
- **Application description**: Comprehensive AI/ML reference with 10,000+ terms
- **Authorization callback URL**: 
  - Development: `http://localhost:3001/api/auth/github/callback`
  - Production: `https://your-production-domain.com/api/auth/github/callback`

### 3. Save Credentials
After creating, you'll get:
- Client ID
- Client Secret (click "Generate a new client secret")

Add to your `.env` file:
```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 💰 Gumroad Webhook Setup

### 1. Access Gumroad Settings
1. Log in to your Gumroad account
2. Go to Settings → Advanced → Webhooks

### 2. Create Webhook
1. Click "Create webhook"
2. Set the URL: `https://your-production-domain.com/api/gumroad/webhook`
3. Select events:
   - `sale.created` - When someone purchases
   - `sale.refunded` - When a refund is processed
   - `sale.canceled` - When a sale is canceled

### 3. Get Webhook Secret
Gumroad will provide a webhook secret. Add it to your `.env`:
```bash
GUMROAD_WEBHOOK_SECRET=your-gumroad-webhook-secret
```

## 🌐 Production URL Configuration

Update your `.env` file with production URLs:
```bash
# Production URLs
PRODUCTION_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com
BASE_URL=https://your-domain.com

# Update OAuth redirect URIs
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google/callback
GITHUB_REDIRECT_URI=https://your-domain.com/api/auth/github/callback
```

## ✅ Testing OAuth

### Local Development Testing
1. Ensure your `.env` file has all OAuth credentials
2. Start the development server: `npm run dev`
3. Visit http://localhost:3000
4. Click "Sign in" and test each provider

### Production Testing
1. Deploy with all environment variables set
2. Test each OAuth provider
3. Verify callbacks work correctly
4. Check that user data is saved to database

## 🚨 Common Issues & Solutions

### "Redirect URI mismatch" Error
- Ensure the callback URL in your OAuth app matches EXACTLY what's in your code
- Check for trailing slashes, http vs https, port numbers

### "Invalid client" Error  
- Double-check Client ID and Secret are copied correctly
- Ensure no extra spaces or newlines in env variables

### Users Can't Sign In
- Verify OAuth providers show as `true` at `/api/auth/providers`
- Check server logs for specific error messages
- Ensure database connection is working

## 🔒 Security Best Practices

1. **Never commit OAuth secrets** to version control
2. **Use different OAuth apps** for development and production
3. **Restrict OAuth app access** to only necessary scopes
4. **Regularly rotate secrets** especially if exposed
5. **Monitor OAuth usage** in provider dashboards

## 📝 Environment Variable Template

Here's a complete template for OAuth configuration:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# GitHub OAuth  
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=http://localhost:3001/api/auth/github/callback

# Gumroad
GUMROAD_WEBHOOK_SECRET=

# URLs (update for production)
PRODUCTION_URL=
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:3001
```

## 🚀 Next Steps

After configuring OAuth:
1. Test the complete authentication flow
2. Verify user sessions persist
3. Test the payment flow with Gumroad
4. Implement proper error handling for auth failures
5. Add user onboarding after first login