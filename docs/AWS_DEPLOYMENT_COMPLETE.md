# AWS Deployment Documentation - AIGlossaryPro

## Table of Contents
1. [Deployment Overview](#deployment-overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Backend Deployment (ECS Fargate)](#backend-deployment-ecs-fargate)
5. [Frontend Deployment (S3/CloudFront)](#frontend-deployment-s3cloudfront)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Environment Variables & Secrets](#environment-variables--secrets)
8. [Key Files](#key-files)
9. [Deployment Process](#deployment-process)
10. [Troubleshooting](#troubleshooting)
11. [Development vs Production](#development-vs-production)
12. [Future Considerations](#future-considerations)

## Deployment Overview

AIGlossaryPro is deployed on AWS using:
- **Backend**: ECS Fargate (containerized Node.js API)
- **Frontend**: S3 + CloudFront (React SPA)
- **Database**: Neon PostgreSQL (external)
- **CI/CD**: GitHub Actions

### Current Status (as of August 4, 2025)
- ✅ Backend API running on ECS Fargate
- ✅ Frontend deployed to S3
- ✅ Automated CI/CD pipeline via GitHub Actions
- ⏳ CloudFront distribution (pending)
- ⏳ Custom domain & SSL (pending)
- ⏳ DNS configuration (pending)

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   GitHub Repo   │     │  GitHub Actions │
│  (main branch)  │────▶│  (CI/CD Pipeline)│
└─────────────────┘     └─────────────────┘
                               │
                               ├─── Backend ──▶ ECR ──▶ ECS Fargate
                               │                         │
                               └─── Frontend ─▶ S3       │
                                                │        │
┌─────────────────┐     ┌─────────────────┐    │        │
│   CloudFront    │◀────│       S3        │    │        │
│      (CDN)      │     │   (Frontend)    │    │        │
└─────────────────┘     └─────────────────┘    │        │
         │                                      │        │
         ▼                                      │        │
┌─────────────────┐                            │        │
│   Route 53      │                            │        │
│  (DNS - Future) │                            │        │
└─────────────────┘                            │        │
         │                                      │        │
         ▼                                      ▼        │
┌─────────────────┐     ┌─────────────────┐    │        │
│    Users        │────▶│  Load Balancer  │────┘        │
└─────────────────┘     └─────────────────┘             │
                                                         │
                        ┌─────────────────┐              │
                        │ Secrets Manager │◀─────────────┘
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │  Neon Database  │
                        │   (External)    │
                        └─────────────────┘
```

## Prerequisites

### AWS Resources Created
1. **ECS Cluster**: `aiglossarypro`
2. **ECR Repository**: `aiglossarypro-api`
3. **ECS Service**: `aiglossarypro-api-production`
4. **Task Definition**: `aiglossarypro-api`
5. **Target Group**: `aiglossarypro-api-tg`
6. **S3 Bucket**: `aiglossarypro-frontend`
7. **Secrets Manager**: Multiple secrets for environment variables

### GitHub Secrets Required
```bash
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
FIREBASE_API_KEY
POSTHOG_API_KEY
```

## Backend Deployment (ECS Fargate)

### Key Configuration
- **Container Port**: 8080
- **Health Check**: `/health` endpoint
- **Health Check Grace Period**: 300 seconds
- **Entry Point**: `dist/index-minimal.js` (NOT `dist/index.js`)

### Dockerfile (`apps/api/Dockerfile`)
```dockerfile
# Build stage
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
# ... build steps ...

# Production stage
FROM node:20-alpine
# ... setup ...

# Critical: Use index-minimal.js for production
CMD ["node", "dist/index-minimal.js"]
```

### Why index-minimal.js?
The minimal server (`index-minimal.js`) provides:
1. Deferred initialization to avoid startup crashes
2. Proper error handling for database connections
3. Health endpoint available immediately
4. Graceful initialization of services

## Frontend Deployment (S3/CloudFront)

### Build Configuration
- **Build Output**: `dist/public/` (at monorepo root)
- **S3 Bucket**: `aiglossarypro-frontend`
- **Region**: `us-east-1`

### Vite Configuration
```typescript
// apps/web/vite.config.ts
build: {
  outDir: path.resolve(__dirname, '../../dist/public'),
  emptyOutDir: true,
  target: 'esnext',
}
```

## CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/production.yml`)

#### Triggers
- Push to `main` branch
- Manual trigger via workflow_dispatch

#### Backend Job
1. Build Docker image on Ubuntu runner (x86_64)
2. Push to ECR with commit SHA tag
3. Update ECS task definition
4. Deploy to ECS service

#### Frontend Job
1. Install dependencies
2. Build shared package first
3. Build frontend with environment variables
4. Sync to S3 with cache headers
5. Invalidate CloudFront (if exists)

### Critical Environment Variables for Frontend Build
```yaml
VITE_API_BASE_URL: https://aiglossarypro.com/api
VITE_FIREBASE_PROJECT_ID: aiglossarypro
VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
VITE_FIREBASE_AUTH_DOMAIN: aiglossarypro.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET: aiglossarypro.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID: 449850174939
VITE_FIREBASE_APP_ID: 1:449850174939:web:08d7973752807207d24bfe
VITE_POSTHOG_KEY: ${{ secrets.POSTHOG_API_KEY }}
VITE_GA4_MEASUREMENT_ID: G-PGJ3NP5TR7
VITE_GA4_ENABLED: true
VITE_GUMROAD_PRODUCT_URL: https://pranaysuyash.gumroad.com/l/ggczfy
# ... and more
```

## Environment Variables & Secrets

### AWS Secrets Manager Structure
Individual secrets created:
- `aiglossarypro/database`
- `aiglossarypro/jwt`
- `aiglossarypro/openai`
- `aiglossarypro/session`
- `aiglossarypro/firebase-private-key`

### Scripts for Secret Management
```bash
# Create individual secrets
./scripts/setup-individual-secrets.sh

# Create GitHub secrets
./scripts/setup-github-secrets.sh
```

## Key Files

### 1. Backend Entry Points
- `apps/api/src/index.ts` - Full server (development)
- `apps/api/src/index-minimal.ts` - Minimal server (production)

### 2. Deployment Scripts
- `scripts/deploy-ecs-production.sh` - ECS deployment
- `scripts/setup-aws-secrets.sh` - AWS secrets setup
- `scripts/setup-individual-secrets.sh` - Individual secrets
- `scripts/setup-github-secrets.sh` - GitHub secrets

### 3. Configuration Files
- `.github/workflows/production.yml` - CI/CD pipeline
- `apps/api/Dockerfile` - Backend container
- `.env.production` - Production environment variables

### 4. Documentation
- `docs/AWS_DEPLOYMENT_COMPLETE.md` - This file
- `docs/ECS_DEPLOYMENT_GUIDE.md` - Initial ECS setup
- `docs/GITHUB_ACTIONS_SETUP.md` - CI/CD setup

## Deployment Process

### Automatic Deployment (Recommended)
1. Make changes in development
2. Commit and push to `main` branch
3. GitHub Actions automatically:
   - Builds backend Docker image
   - Deploys to ECS
   - Builds frontend
   - Deploys to S3
   - Invalidates CloudFront (if configured)

### Manual Deployment
```bash
# Backend only
./scripts/deploy-ecs-production.sh

# Frontend only (local build)
pnpm --filter @aiglossarypro/shared run build
pnpm --filter @aiglossarypro/web run build
aws s3 sync dist/public/ s3://aiglossarypro-frontend/ --delete
```

## Troubleshooting

### Common Issues & Solutions

#### 1. ECS Tasks Keep Restarting
**Symptom**: Tasks register/deregister in a loop
**Cause**: Health check failures
**Solution**: 
- Check ALB target group health check settings
- Ensure health check grace period is sufficient (300s)
- Verify `/health` endpoint returns 200 immediately

#### 2. Container Exits with "initDatabase is not a function"
**Cause**: Using wrong entry point
**Solution**: Ensure Dockerfile uses `CMD ["node", "dist/index-minimal.js"]`

#### 3. Frontend Build Fails in GitHub Actions
**Cause**: Missing environment variables
**Solution**: Check all VITE_ variables in workflow match .env.production

#### 4. S3 Deployment Fails
**Cause**: Wrong build output path
**Solution**: Use `dist/public/` not `apps/web/dist/public/`

### Debug Commands
```bash
# Check ECS service status
aws ecs describe-services --cluster aiglossarypro --services aiglossarypro-api-production

# Check task logs
aws logs tail /ecs/aiglossarypro-api --since 5m

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <arn>

# Check S3 bucket contents
aws s3 ls s3://aiglossarypro-frontend/
```

## Development vs Production

### Current Development Impact
Since development is ongoing, each deployment will:
1. Deploy the latest code from `main` branch
2. Include any work-in-progress features
3. Use production database and services

### Recommendations for Active Development
1. **Feature Branches**: Use feature branches for incomplete work
2. **Environment Variables**: Keep development and production separate
3. **Database Migrations**: Test thoroughly before deploying
4. **Rollback Plan**: Tag releases for easy rollback

### Environment-Specific Settings
```javascript
// Backend
NODE_ENV=production
PORT=8080 (ECS) vs 3001 (local)

// Frontend
VITE_API_BASE_URL=https://aiglossarypro.com/api (prod)
VITE_API_BASE_URL=http://localhost:3001/api (dev)
```

## Future Considerations

### 1. CloudFront Setup
```bash
# Create distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json

# Update S3 bucket policy for CloudFront OAI
# Add CloudFront origin access identity
```

### 2. Custom Domain & SSL
- Request ACM certificate for aiglossarypro.com
- Add to CloudFront distribution
- Update Route 53 records

### 3. Monitoring & Alerts
- CloudWatch alarms for ECS tasks
- S3 access logs
- CloudFront access logs
- Application performance monitoring

### 4. Cost Optimization
- ECS Fargate Spot for non-critical workloads
- S3 lifecycle policies
- CloudFront caching optimization
- Reserved capacity for predictable workloads

### 5. Security Enhancements
- WAF rules on CloudFront
- VPC endpoints for S3 access
- Network isolation for ECS tasks
- Regular security audits

### 6. Development Workflow Improvements
- Staging environment
- Blue/green deployments
- Automated testing in CI/CD
- Database migration automation

## Access URLs

### Current Endpoints
- **S3 Website**: http://aiglossarypro-frontend.s3-website-us-east-1.amazonaws.com
- **Backend Health Check**: (via ALB - URL depends on ALB DNS)

### Future Endpoints (after CloudFront & DNS)
- **Production**: https://aiglossarypro.com
- **API**: https://aiglossarypro.com/api

## Maintenance Tasks

### Regular Tasks
1. **Monitor ECS tasks**: Check for restarts or errors
2. **Review CloudWatch logs**: Look for application errors
3. **Update dependencies**: Keep packages secure
4. **Backup considerations**: Database backups (Neon handles this)

### Update Procedures
1. **Backend updates**: Push to main → Auto-deploy
2. **Frontend updates**: Push to main → Auto-deploy
3. **Infrastructure updates**: Update Terraform/CloudFormation
4. **Secret rotation**: Update in Secrets Manager & GitHub

---

## Quick Reference

### Deploy Status Check
```bash
# Check latest deployment
gh run list --workflow=production.yml --limit=1

# Check ECS service
aws ecs describe-services --cluster aiglossarypro --services aiglossarypro-api-production --query 'services[0].{status: status, running: runningCount}'

# Check S3 deployment
aws s3 ls s3://aiglossarypro-frontend/ --region us-east-1 | head -5
```

### Emergency Rollback
```bash
# Rollback ECS to previous task definition
aws ecs update-service --cluster aiglossarypro --service aiglossarypro-api-production --task-definition aiglossarypro-api:PREVIOUS_REVISION

# Rollback frontend (requires previous build artifacts)
# Consider implementing versioned S3 buckets for easier rollback
```

---

*Last Updated: August 4, 2025*
*Document Version: 1.0*