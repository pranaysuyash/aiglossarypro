# AIGlossaryPro Deployment Guide

## Current Production Status ✅

- **Frontend**: https://d1m7nnfj3im4kp.cloudfront.net
- **API**: https://d1m7nnfj3im4kp.cloudfront.net/api/*
- **Direct API**: http://aiglossarypro-api-alb-1884179415.us-east-1.elb.amazonaws.com

## Architecture

```
CloudFront (d1m7nnfj3im4kp.cloudfront.net)
├── / → S3 Bucket (Frontend)
└── /api/* → ALB → ECS Fargate (TypeScript API)
```

## CRITICAL: What NOT to Do ❌

### 1. **NEVER Deploy the Simple API**
- The simple API (`simple-api.js`, `enhanced-api.js`) is a minimal fallback
- We want the FULL TypeScript API from `apps/api/`
- Task definitions 60, 62 use the simple API - AVOID THESE

### 2. **NEVER Change Dockerfile CMD Without Testing**
- The TypeScript build produces `dist/index.js`
- The simple API uses `dist/index-minimal.js`
- Mismatch causes: `Error: Cannot find module`

### 3. **NEVER Ignore TypeScript Errors**
- Even with `TS_NODE_TRANSPILE_ONLY=true`, type mismatches cause runtime crashes
- We fixed 127+ errors to get it working
- Remaining ~50 errors don't block deployment but should be fixed

### 4. **NEVER Delete Code to Fix TypeScript Errors**
- Use underscore prefix for unused variables: `_unusedVar`
- Code may be: fallbacks, future implementations, or documentation
- Always preserve code structure and intent

## What TO Do ✅

### 1. **Always Verify Docker Image Contents**
```bash
docker run --rm IMAGE_NAME ls -la dist/
```

### 2. **Always Test Locally First**
```bash
cd apps/api
pnpm build
pnpm start
```

### 3. **Always Use Correct Task Definition**
- Current working: `aiglossarypro-api:77` (full TypeScript API)
- Image: `927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:full-ts-api-working`

### 4. **Always Monitor Deployment**
```bash
# Check service status
aws ecs describe-services --cluster aiglossarypro --services aiglossarypro-api-production

# Check logs for errors
aws logs tail /ecs/aiglossarypro-api --since 5m

# Test health endpoint
curl http://aiglossarypro-api-alb-1884179415.us-east-1.elb.amazonaws.com/health
```

## API Endpoints

All API endpoints are prefixed with `/api`:

- `GET /health` - Health check (no prefix)
- `GET /api/terms` - List all terms
- `GET /api/search?q=QUERY` - Search terms
- `GET /api/terms/:id` - Get specific term
- `POST /api/terms` - Create term (auth required)
- `PUT /api/terms/:id` - Update term (auth required)
- `DELETE /api/terms/:id` - Delete term (auth required)

## TypeScript Fixes Applied

### 1. FeedbackStatistics Interface
```typescript
// ❌ WRONG
return { totalFeedback, pendingReview, reviewing, resolved, dismissed }

// ✅ CORRECT
return {
  total: totalFeedback,
  byStatus: { pending, reviewing, resolved, rejected },
  byType: {},
  averageResolutionTime: 0,
  recentTrends: []
}
```

### 2. SystemHealth Interface
```typescript
// ❌ WRONG
return { checks: {...} }

// ✅ CORRECT
return {
  status: 'healthy',
  services: {
    database: { status: 'healthy', details: 'Connected' },
    redis: { status: 'healthy', details: 'Not configured' }
  },
  lastChecked: new Date()
}
```

### 3. Type Casting for Mismatches
```typescript
// When interfaces don't match, cast carefully:
const searchMetrics = {
  searchCategories: categories.reduce((acc, cat) => {
    acc[cat.name] = cat.count;
    return acc;
  }, {} as Record<string, number>)
}
```

## Deployment Process

### 1. Build Docker Image
```bash
# From monorepo root
docker build -f apps/api/Dockerfile -t aiglossarypro-api:TAG --platform linux/amd64 .
```

### 2. Push to ECR
```bash
# Tag for ECR
docker tag aiglossarypro-api:TAG 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:TAG

# Push
docker push 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:TAG
```

### 3. Update Task Definition
```bash
# Update task definition JSON with new image
# Register new revision
aws ecs register-task-definition --cli-input-json file://new-task-def.json

# Deploy
aws ecs update-service --cluster aiglossarypro --service aiglossarypro-api-production --task-definition aiglossarypro-api:REVISION --force-new-deployment
```

## Troubleshooting

### Container Exits Immediately
- Check logs: `aws logs tail /ecs/aiglossarypro-api --since 5m`
- Usually: Wrong entrypoint in Dockerfile
- Fix: Ensure CMD matches built files

### TypeScript Errors During Build
- Run `pnpm build` locally to see all errors
- Fix interfaces to match implementations
- Don't delete code - use `_` prefix for unused vars

### API Returns 404
- Check if using `/api` prefix for routes
- Verify CloudFront is routing `/api/*` to ALB
- Ensure ECS task is healthy

### 503 Service Unavailable
- No healthy tasks running
- Check task definition and Docker image
- Monitor ECS events for deployment failures

## Environment Variables

Required in ECS task definition:
- `NODE_ENV=production`
- `PORT=8080`
- `DATABASE_URL` (from Secrets Manager)
- `JWT_SECRET` (from Secrets Manager)
- `FIREBASE_*` (Firebase auth config)

## CloudFront Configuration

Two distributions exist:
1. `d1m7nnfj3im4kp.cloudfront.net` ✅ - Has API routing
2. `d1bnbqox1m8zqp.cloudfront.net` ❌ - No API routing

Always use the first one for full functionality.

## Current Issues to Fix

1. ~50 remaining TypeScript errors (non-blocking)
2. Some enhanced storage methods return mock data
3. Frontend expects `api.aiglossarypro.com` (needs CNAME)
4. No automated deployment pipeline

## Success Metrics

- Health endpoint returns 200: ✅
- `/api/terms` returns data: ✅
- Frontend loads without errors: ✅
- API accessible through CloudFront: ✅