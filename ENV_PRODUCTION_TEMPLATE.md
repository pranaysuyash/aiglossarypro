# AI/ML Glossary Pro - Production Environment Configuration
# Copy this file to .env.production and fill in your actual values

# =================================================================================
# CRITICAL ENVIRONMENT VARIABLES (Required for launch)
# =================================================================================

# Database Configuration (REQUIRED)
DATABASE_URL=postgresql://username:password@hostname:5432/database_name

# Session Security (REQUIRED)
SESSION_SECRET=your-32-character-session-secret-here-generate-randomly

# Application Configuration (REQUIRED)
NODE_ENV=production
PORT=3000

# =================================================================================
# ESSENTIAL FOR PRODUCTION (Highly Recommended)
# =================================================================================

# Base URL for your domain
BASE_URL=https://aimlglossary.com

# Gumroad Payment Processing
GUMROAD_WEBHOOK_SECRET=your-gumroad-webhook-secret-from-dashboard

# Email Service (Choose ONE option below)
EMAIL_ENABLED=true
EMAIL_FROM=noreply@aimlglossary.com
EMAIL_FROM_NAME="AI Glossary Pro"

# Option 1: SendGrid (Recommended for production)
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key

# Option 2: Gmail (Good for testing)
# EMAIL_SERVICE=gmail
# EMAIL_USER=your-email@gmail.com
# EMAIL_APP_PASSWORD=your-16-char-app-password

# =================================================================================
# AUTHENTICATION (Choose ONE method)
# =================================================================================

# Option 1: Firebase Auth (Recommended)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY=your-firebase-private-key
# OR base64 encoded:
# FIREBASE_PRIVATE_KEY_BASE64=your-base64-encoded-private-key

# Option 2: Simple Auth with OAuth
# JWT_SECRET=your-jwt-secret-32-chars-minimum
# GOOGLE_CLIENT_ID=your-google-oauth-client-id
# GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
# GITHUB_CLIENT_ID=your-github-oauth-client-id  
# GITHUB_CLIENT_SECRET=your-github-oauth-client-secret

# =================================================================================
# MONITORING & ANALYTICS (Recommended)
# =================================================================================

# Error Tracking
SENTRY_DSN=your-sentry-dsn-url

# Analytics
POSTHOG_API_KEY=your-posthog-api-key
POSTHOG_HOST=https://app.posthog.com

# =================================================================================
# OPTIONAL ENHANCEMENTS
# =================================================================================

# Redis for Background Jobs (Optional but recommended)
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true

# AI Features (Optional)
OPENAI_API_KEY=sk-your-openai-api-key

# File Storage (Optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket

# =================================================================================
# DEPLOYMENT NOTES
# =================================================================================

# 1. MINIMUM VIABLE CONFIGURATION:
#    - DATABASE_URL, SESSION_SECRET, NODE_ENV, PORT
#    - BASE_URL, GUMROAD_WEBHOOK_SECRET
#    - Email service credentials
#    - Authentication method (Firebase OR OAuth)

# 2. RECOMMENDED ADDITIONS:
#    - SENTRY_DSN for error tracking
#    - POSTHOG_API_KEY for analytics
#    - REDIS_URL for background jobs

# 3. SECURITY CHECKLIST:
#    - Use strong, unique SESSION_SECRET (32+ characters)
#    - Enable SSL/TLS for database connection in production
#    - Never commit this .env file to version control
#    - Rotate API keys regularly
#    - Use environment-specific databases (separate dev/prod)

# 4. TESTING:
#    - Test email delivery with your chosen provider
#    - Verify Gumroad webhook with test purchase
#    - Check authentication flow with your auth method
#    - Monitor Sentry for any startup errors

# =================================================================================
# QUICK START FOR DIFFERENT PLATFORMS
# =================================================================================

# For Vercel:
# - Add all variables in Vercel dashboard
# - DATABASE_URL should point to Neon/PlanetScale
# - Use FIREBASE_PRIVATE_KEY_BASE64 for multiline key

# For Railway:
# - Add variables in Railway dashboard
# - DATABASE_URL automatically provided if using Railway Postgres
# - Use raw FIREBASE_PRIVATE_KEY with newlines

# For Heroku:
# - Use heroku config:set commands
# - DATABASE_URL automatically provided if using Heroku Postgres
# - Use FIREBASE_PRIVATE_KEY_BASE64 for multiline key

# For AWS/DigitalOcean:
# - Set up environment file in your deployment script
# - Ensure proper file permissions (600)
# - Consider using AWS Secrets Manager or similar