# 🚀 AIGlossaryPro Deployment & Testing Guide

## **Current Status**

✅ **Phase 1 Complete**: Launch Strategy Integration
- Dynamic pricing system with staggered discounts
- Enhanced exit-intent popup with phase-aware pricing  
- A/B testing experiments activated

⚠️ **Build Issues**: Monorepo import path resolution needs fixing

## **🛠️ Immediate Fixes Required**

### 1. Fix TypeScript Path Mappings

The monorepo is having issues with package imports. Update `tsconfig.json` files:

```json
// apps/api/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@aiglossarypro/shared/*": ["../../packages/shared/src/*"],
      "@aiglossarypro/shared": ["../../packages/shared/src/index.ts"]
    }
  }
}
```

### 2. Update Import Statements

Change imports from:
```ts
import { terms } from '@aiglossarypro/shared/schema';
```

To:
```ts
import { terms } from '@aiglossarypro/shared';
```

## **📋 Pre-Deployment Checklist**

### **Environment Variables**

```env
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Pricing Phase Management
NEXT_PUBLIC_PRICING_PHASE=early  # beta | early | launch | regular

# Analytics & Monitoring
SENTRY_DSN=https://...
POSTHOG_API_KEY=ph_...
NEXT_PUBLIC_POSTHOG_KEY=ph_...

# Payment Integration
GUMROAD_ACCESS_TOKEN=...
GUMROAD_PRODUCT_ID=ggczfy
GUMROAD_WEBHOOK_SECRET=...

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### **Database Migrations**

```bash
# Run migrations
pnpm db:migrate

# Verify schema
pnpm db:check

# Seed initial data if needed
pnpm db:seed
```

## **🧪 Testing Strategy**

### **1. Unit Tests**

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode during development
pnpm test:watch
```

### **2. Integration Tests**

```bash
# Test API endpoints
pnpm test:api

# Test payment webhooks
pnpm test:webhooks

# Test pricing phase transitions
pnpm test:pricing
```

### **3. E2E Tests**

```bash
# Install Playwright
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# Run in headed mode for debugging
pnpm test:e2e:headed
```

### **4. Manual Testing Checklist**

#### **Pricing System**
- [ ] Verify current phase displays correctly
- [ ] Test phase transition (admin panel)
- [ ] Confirm discount codes work on Gumroad
- [ ] Check PPP pricing for different countries
- [ ] Validate exit-intent popup pricing

#### **A/B Testing**
- [ ] Verify PostHog events firing
- [ ] Check variant distribution
- [ ] Test conversion tracking
- [ ] Monitor experiment metrics

#### **User Flows**
- [ ] Guest preview (50 terms/day)
- [ ] Sign up process
- [ ] Purchase flow via Gumroad
- [ ] Webhook processing
- [ ] Account upgrade

#### **Mobile Testing**
- [ ] Touch targets ≥44x44px
- [ ] Exit-intent on scroll velocity
- [ ] Responsive pricing display
- [ ] iOS safe areas
- [ ] Android compatibility

## **🚀 Deployment Process**

### **Option 1: AWS App Runner (Current)**

```bash
# Build and push Docker image
docker build -t aiglossarypro .
docker tag aiglossarypro:latest $AWS_ECR_URI:latest
docker push $AWS_ECR_URI:latest

# Update App Runner service
aws apprunner update-service \
  --service-arn $SERVICE_ARN \
  --source-configuration '{"ImageRepository":{"ImageIdentifier":"'$AWS_ECR_URI':latest"}}'
```

### **Option 2: Vercel (Recommended for Next.js)**

```bash
# Install Vercel CLI
pnpm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### **Option 3: Railway**

```bash
# Install Railway CLI
brew install railway

# Deploy
railway up
```

## **📊 Post-Deployment Monitoring**

### **1. Health Checks**

```bash
# API health
curl https://api.aiglossarypro.com/api/health

# Comprehensive health check
curl https://api.aiglossarypro.com/api/health/check
```

### **2. Performance Monitoring**

- **Core Web Vitals**: Monitor via Sentry
- **API Response Times**: Track p50, p90, p99
- **Database Query Performance**: Monitor slow queries
- **Cache Hit Rates**: Redis performance

### **3. Error Tracking**

```javascript
// Sentry dashboard checks
- Error rate < 1%
- No critical errors
- Performance budgets met
- User feedback positive
```

### **4. Business Metrics**

Monitor in PostHog:
- Conversion rates by phase
- A/B test performance
- Exit-intent recovery rate
- Revenue per visitor
- Phase transition timing

## **🔥 Rollback Plan**

If issues arise:

```bash
# Quick rollback on AWS
aws apprunner update-service \
  --service-arn $SERVICE_ARN \
  --source-configuration '{"ImageRepository":{"ImageIdentifier":"'$AWS_ECR_URI':previous"}}'

# Database rollback
pnpm db:migrate:rollback

# Feature flag disable
curl -X POST https://api.aiglossarypro.com/api/feature-flags/disable \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "new_pricing_system"}'
```

## **🎯 Launch Day Checklist**

### **Pre-Launch (T-24 hours)**
- [ ] Final code review
- [ ] Security scan (npm audit)
- [ ] Load testing complete
- [ ] Backup systems verified
- [ ] Team briefed on procedures

### **Launch (T-0)**
- [ ] Deploy to production
- [ ] Verify all health checks
- [ ] Monitor error rates
- [ ] Check payment processing
- [ ] Announce on social media

### **Post-Launch (T+24 hours)**
- [ ] Review analytics data
- [ ] Address any issues
- [ ] Optimize based on metrics
- [ ] Plan next phase transitions
- [ ] Celebrate success! 🎉

## **📞 Emergency Contacts**

- **On-Call Engineer**: [Phone/Slack]
- **Database Admin**: [Contact]
- **Payment Support**: Gumroad Support
- **AWS Support**: [Case URL]

## **🔗 Quick Links**

- **Production URL**: https://aiglossarypro.com
- **API Docs**: https://api.aiglossarypro.com/api/docs
- **Admin Panel**: https://aiglossarypro.com/admin
- **Monitoring**: [Sentry Dashboard]
- **Analytics**: [PostHog Dashboard]

---

**Remember**: Always test in staging before production deployment!