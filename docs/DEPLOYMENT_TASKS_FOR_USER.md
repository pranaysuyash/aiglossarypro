# Deployment Tasks Checklist for AI Glossary Pro

## 🚨 Critical Pre-Launch Tasks (Must Complete)

### 1. Environment Variables Setup
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Fill in all required values:
  - [ ] **Database**: Keep existing Neon `DATABASE_URL` or set up new
  - [ ] **Security**: Generate `SESSION_SECRET` (64 chars) and `JWT_SECRET` (32 chars)
    ```bash
    # Generate secrets:
    openssl rand -base64 48  # For SESSION_SECRET
    openssl rand -base64 32  # For JWT_SECRET
    ```
  - [ ] **AWS Credentials**: Add your AWS access keys and S3 bucket name
  - [ ] **OAuth**: Ensure Google/GitHub client ID and secrets are set
  - [ ] **Third-party APIs**: 
    - [ ] OpenAI API key
    - [ ] Resend API key (get from resend.com)
    - [ ] Gumroad webhook secret (from Gumroad dashboard)

### 2. OAuth Redirect URLs Update
- [ ] **Google Cloud Console** (console.cloud.google.com):
  - [ ] Add production callback URL: `https://aiglossarypro.com/api/auth/google/callback`
  - [ ] Add www variant: `https://www.aiglossarypro.com/api/auth/google/callback`
  - [ ] Remove localhost URLs (security)

- [ ] **GitHub OAuth Apps** (github.com/settings/developers):
  - [ ] Add production callback URL: `https://aiglossarypro.com/api/auth/github/callback`
  - [ ] Add www variant: `https://www.aiglossarypro.com/api/auth/github/callback`
  - [ ] Remove localhost URLs

### 3. Third-Party Service Setup
- [ ] **Resend Email Service**:
  - [ ] Sign up at resend.com (free tier: 3,000 emails/month)
  - [ ] Create API key
  - [ ] Add sending domain (optional but recommended)
  - [ ] Test with: `node scripts/test-email.js`

- [ ] **Redis Cache** (Choose one):
  - [ ] Option A: Upstash (recommended for start)
    - [ ] Sign up at upstash.com (free tier)
    - [ ] Create Redis database
    - [ ] Copy connection URL to `REDIS_URL`
  - [ ] Option B: AWS ElastiCache (later)

- [ ] **Analytics Setup**:
  - [ ] Google Analytics 4: Add your measurement ID
  - [ ] PostHog (optional): Add project API key
  - [ ] Sentry (optional): Add DSN for error tracking

### 4. Pre-Deployment Validation
- [ ] Run validation script:
  ```bash
  node scripts/pre-deployment-check.js
  ```
- [ ] Fix any errors reported
- [ ] Ensure Docker builds successfully:
  ```bash
  docker build -t aiglossarypro:test .
  ```

## 🚀 Deployment Tasks

### 5. AWS Account Setup
- [ ] **AWS Console Access**:
  - [ ] Log in to AWS Console
  - [ ] Ensure you have appropriate permissions
  - [ ] Select region (us-east-1 recommended)

- [ ] **Create ECR Repository**:
  ```bash
  aws ecr create-repository --repository-name aiglossarypro --region us-east-1
  ```

### 6. Deploy Application (Choose Path)
- [ ] **Option A: Quick Deploy** (Recommended for first launch):
  - [ ] Follow `docs/AWS_QUICK_DEPLOY.md`
  - [ ] Keep Neon database (free)
  - [ ] Use Upstash Redis (free)
  - [ ] Deploy to App Runner
  - [ ] Estimated time: 2-3 hours
  - [ ] Cost: ~$30-40/month

- [ ] **Option B: Full AWS Deploy** (For scale):
  - [ ] Follow `docs/AWS_DEPLOYMENT_BLUEPRINT.md`
  - [ ] Set up RDS PostgreSQL
  - [ ] Set up ElastiCache Redis
  - [ ] Configure VPC
  - [ ] Estimated time: 2-3 days
  - [ ] Cost: ~$75-120/month

### 7. Domain Configuration
- [ ] **In Namecheap**:
  - [ ] Add CNAME record for `www` → App Runner domain
  - [ ] Add redirect from root to www
  - [ ] Wait for DNS propagation (5-30 minutes)

- [ ] **In App Runner**:
  - [ ] Add custom domain
  - [ ] Wait for SSL certificate (automatic)
  - [ ] Update `PRODUCTION_URL` environment variable

### 8. Post-Deployment Verification
- [ ] Run through `docs/POST_DEPLOYMENT_CHECKLIST.md`
- [ ] Test critical features:
  - [ ] Homepage loads
  - [ ] Search works
  - [ ] OAuth login functions
  - [ ] Terms display correctly
  - [ ] Email sending works

## 📊 Optional But Recommended

### 9. Monitoring Setup
- [ ] **CloudWatch Alerts**:
  - [ ] High error rate alert
  - [ ] High response time alert
  - [ ] Billing alert at $100

- [ ] **Daily Checks** (First Week):
  - [ ] Review CloudWatch logs
  - [ ] Check error rates
  - [ ] Monitor costs
  - [ ] Review user registrations

### 10. Content & Data
- [ ] **Database Content**:
  - [ ] Verify all terms imported correctly
  - [ ] Run learning paths seed: `npm run seed:learning-paths`
  - [ ] Check daily rotation is working

- [ ] **Cleanup** (if needed):
  - [ ] Remove incomplete terms: `npm run cleanup:incomplete-terms`
  - [ ] Verify categories are correct

## 📝 Information I Need From You

To help you effectively, please provide:

1. **Current Status**:
   - [ ] Do you have AWS account ready?
   - [ ] Is Docker installed locally?
   - [ ] Do you have the production `.env` file started?

2. **Service Preferences**:
   - [ ] Prefer free tier services initially? (Neon, Upstash)
   - [ ] Or go straight to AWS services? (RDS, ElastiCache)

3. **Timeline**:
   - [ ] When do you want to launch?
   - [ ] Any specific deadline?

4. **Technical Comfort**:
   - [ ] Comfortable with AWS Console?
   - [ ] Familiar with Docker commands?
   - [ ] Need step-by-step guidance?

## 🎯 Recommended Order

1. **Today**: Environment setup (#1-4)
2. **Tomorrow**: AWS deployment (#5-7)
3. **Day 3**: Verification and monitoring (#8-9)
4. **Day 4-7**: Optimization and content (#10)

## 💬 How I Can Help

For each task, I can provide:
- Detailed step-by-step instructions
- Troubleshooting for any errors
- Alternative approaches if blocked
- Code snippets or commands
- Best practices and tips

Just let me know which task you're starting with and any questions you have!