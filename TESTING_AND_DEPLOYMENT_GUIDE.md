# AIGlossaryPro Testing and Deployment Guide

## Date: July 31, 2025

## Current Status Summary

### ✅ Backend Status
- **URL**: https://hkntj2murq.us-east-1.awsapprunner.com
- **Status**: Fully deployed and operational
- **Features**: Complete API with all features from main branch + new premium features

### ✅ Monorepo Migration Success
- All original features preserved
- New premium features: Gumroad integration, PPP pricing
- Analytics: PostHog, GA4, A/B testing
- Enhanced UX: Premium onboarding, email automation
- Performance: Redis caching, optimized queries

## Testing Checklist

### 1. Frontend Local Setup (5 minutes)
```bash
cd /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro
pnpm install
pnpm run dev:client
```
- Open http://localhost:5173
- Verify connection to production API

### 2. Core Functionality Tests

#### A. Search & Browse
- [ ] Search for AI terms (e.g., "machine learning", "neural network")
- [ ] Click through definitions
- [ ] Verify search results display correctly

#### B. Guest Limits
- [ ] View 10-20 terms as guest
- [ ] Verify preview counter appears
- [ ] Check that limits are enforced after threshold

#### C. Sign Up Flow
- [ ] Create test account via Firebase Auth
- [ ] Verify email verification process
- [ ] Check welcome email automation

#### D. Premium Upgrade
- [ ] Test Gumroad purchase flow
- [ ] Verify ₹179 early bird pricing displays
- [ ] Check PPP pricing adjustments based on location

#### E. A/B Testing
- [ ] Refresh landing page multiple times
- [ ] Verify different background variants appear
- [ ] Check that variants are tracked in analytics

### 3. Analytics Verification
- [ ] Open browser developer console
- [ ] Check for PostHog events firing
- [ ] Verify no CORS errors in network tab
- [ ] Confirm CTA clicks are tracked
- [ ] Check GA4 pageview events

## Frontend Deployment - AWS Amplify

### Why Amplify?
- **Cost**: ~$1-5/month (vs $10+/month for App Runner)
- **Features**: Auto GitHub deployments, CDN, SSL, custom domains
- **Maintenance**: Zero maintenance required

### Deployment Steps

1. **Access AWS Amplify Console**
   - Navigate to AWS Amplify in AWS Console
   - Click "New app" → "Host web app"

2. **Connect GitHub Repository**
   - Select GitHub as source
   - Authorize AWS Amplify
   - Choose repository: `pranaysuyash/AIGlossaryPro`
   - Select branch: `monorepo-migration`

3. **Configure Build Settings**
   ```yaml
   version: 1
   applications:
     - frontend:
         phases:
           preBuild:
             commands:
               - cd apps/client
               - npm install -g pnpm
               - pnpm install
           build:
             commands:
               - pnpm run build
         artifacts:
           baseDirectory: apps/client/dist
           files:
             - '**/*'
         cache:
           paths:
             - node_modules/**/*
   ```

4. **Add Environment Variables**
   ```
   VITE_API_BASE_URL=https://hkntj2murq.us-east-1.awsapprunner.com
   VITE_FIREBASE_API_KEY=<your-key>
   VITE_FIREBASE_AUTH_DOMAIN=<your-domain>
   VITE_FIREBASE_PROJECT_ID=<your-project-id>
   VITE_FIREBASE_STORAGE_BUCKET=<your-bucket>
   VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
   VITE_FIREBASE_APP_ID=<your-app-id>
   VITE_POSTHOG_API_KEY=<your-posthog-key>
   VITE_POSTHOG_HOST=<your-posthog-host>
   VITE_GA_MEASUREMENT_ID=<your-ga-id>
   ```

5. **Deploy**
   - Review settings
   - Click "Save and deploy"
   - Wait ~10 minutes for initial deployment

6. **Custom Domain Setup** (Optional)
   - Go to Domain management
   - Add your custom domain
   - Follow DNS configuration instructions

## Key Features to Test in Production

### 1. Smart Pricing System
- **Standard**: ₹249
- **Early Bird**: ₹179
- **PPP Discount**: ₹99 (location-based)

### 2. Guest Experience Flow
- 50 free term previews
- Signup prompt after limit
- Smooth transition to registered user

### 3. Premium Onboarding
- 5-step guided tour for new paying users
- Progress tracking
- Interactive tutorials

### 4. Analytics Events to Monitor
- Page views
- Search queries
- Term views
- CTA clicks
- Conversion funnel events
- A/B test variant assignments

## Post-Deployment Checklist

### Immediate (Day 1)
- [ ] Run through complete user journey (guest → signup → premium)
- [ ] Verify all API endpoints work with frontend
- [ ] Check analytics dashboards (PostHog, GA4)
- [ ] Test on multiple devices/browsers
- [ ] Verify email automations trigger

### Week 1 Monitoring
- [ ] Monitor error logs in AWS CloudWatch
- [ ] Check conversion rates in analytics
- [ ] Review A/B test performance
- [ ] Monitor API response times
- [ ] Check Redis cache hit rates

### Ongoing Optimization
- [ ] Analyze user behavior patterns
- [ ] Optimize based on A/B test results
- [ ] Monitor and improve conversion funnel
- [ ] Track feature usage analytics
- [ ] Gather user feedback

## Troubleshooting Guide

### Frontend Connection Issues
```bash
# Check API connectivity
curl https://hkntj2murq.us-east-1.awsapprunner.com/health

# Verify CORS headers
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS \
  https://hkntj2murq.us-east-1.awsapprunner.com/api/terms
```

### Common Issues & Solutions

1. **CORS Errors**
   - Verify API URL in frontend .env
   - Check backend CORS configuration
   - Ensure origin is whitelisted

2. **Authentication Failures**
   - Verify Firebase config in both frontend and backend
   - Check Firebase project settings
   - Ensure API keys match

3. **Analytics Not Tracking**
   - Verify PostHog/GA4 keys in .env
   - Check browser console for errors
   - Ensure analytics scripts load

## Success Metrics

### Technical
- [ ] Zero deployment errors
- [ ] < 2s page load time
- [ ] 99.9% uptime
- [ ] No CORS/auth errors

### Business
- [ ] Guest → Signup conversion > 10%
- [ ] Signup → Premium conversion > 5%
- [ ] User engagement metrics tracking
- [ ] A/B test data collection

## Next Steps After Deployment

1. **Marketing & Launch**
   - Announce on social media
   - Reach out to AI/ML communities
   - Create launch blog post

2. **Feature Roadmap**
   - User feedback collection
   - Feature prioritization
   - Continuous improvement

3. **Scaling Preparation**
   - Monitor usage patterns
   - Plan for traffic spikes
   - Optimize based on real usage

---

## Quick Commands Reference

```bash
# Local development
pnpm run dev:client

# Build for production
pnpm run build:client

# Run all tests
pnpm test

# Check TypeScript
pnpm run typecheck

# Lint code
pnpm run lint

# Monitor backend health
curl https://hkntj2murq.us-east-1.awsapprunner.com/health
```

## Support Resources

- AWS Amplify Docs: https://docs.amplify.aws/
- PostHog Docs: https://posthog.com/docs
- Firebase Auth: https://firebase.google.com/docs/auth
- Your Backend API: https://hkntj2murq.us-east-1.awsapprunner.com

---

*Last Updated: July 31, 2025*
*Status: Production Ready* 🚀