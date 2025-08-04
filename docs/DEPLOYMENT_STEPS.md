# AIGlossaryPro Deployment Steps

This document provides detailed step-by-step instructions for deploying AIGlossaryPro to AWS.

## Prerequisites

1. AWS Account with appropriate permissions
2. GitHub repository with secrets configured
3. AWS CLI installed and configured
4. GitHub CLI installed and authenticated

## Initial Setup

### 1. AWS Resources Setup

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name aiglossarypro --region us-east-1

# Create ECR repository
aws ecr create-repository --repository-name aiglossarypro-api --region us-east-1

# Create S3 bucket for frontend
aws s3api create-bucket --bucket aiglossarypro-frontend --region us-east-1
```

### 2. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DATABASE_URL`
- `FIREBASE_API_KEY`
- `FIREBASE_PRIVATE_KEY`
- `POSTHOG_API_KEY`
- `JWT_SECRET`
- `SESSION_SECRET`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `GUMROAD_ACCESS_TOKEN`
- `GUMROAD_SIGNING_KEY`

### 3. AWS Secrets Manager Setup

```bash
# Create secrets in AWS Secrets Manager
aws secretsmanager create-secret --name aiglossarypro/database --secret-string '{"url":"your-database-url"}'
aws secretsmanager create-secret --name aiglossarypro/jwt --secret-string '{"secret":"your-jwt-secret"}'
aws secretsmanager create-secret --name aiglossarypro/session --secret-string '{"secret":"your-session-secret"}'
# ... continue for all secrets
```

## Deployment Process

### Step 1: Prepare the Codebase

1. Ensure the minimal server configuration is in place:
   - File: `apps/api/src/index-minimal.ts`
   - Health endpoints: `/health` and `/api/health`

2. Configure the frontend build:
   - Use minimal Vite config to avoid Million.js issues
   - File: `apps/web/vite.config.minimal.ts`

### Step 2: Set Up GitHub Actions

1. Create the production workflow file:
   - Path: `.github/workflows/production.yml`
   - Includes both backend and frontend deployment jobs

2. Configure environment variables in the workflow:
   ```yaml
   env:
     VITE_API_BASE_URL: https://d1bnbqox1m8zqp.cloudfront.net/api
     # ... other variables
   ```

### Step 3: Deploy Backend to ECS

1. Push to main branch to trigger deployment:
   ```bash
   git push origin main
   ```

2. Monitor deployment:
   ```bash
   gh run watch
   ```

3. Verify ECS service:
   ```bash
   aws ecs describe-services \
     --cluster aiglossarypro \
     --services aiglossarypro-api-production \
     --region us-east-1
   ```

### Step 4: Configure CloudFront

1. Create CloudFront distribution with two origins:
   - S3 origin for frontend assets
   - ALB origin for API backend

2. Configure behaviors:
   - `/api/*` → API Backend origin
   - `/assets/*` → S3 origin
   - Default (*) → S3 origin

3. Set up Origin Access Control (OAC) for S3

### Step 5: Deploy Frontend

1. Frontend deployment happens automatically after backend
2. Verify S3 sync completed
3. CloudFront cache invalidation runs automatically

### Step 6: Verification

1. Check API health:
   ```bash
   curl https://d1bnbqox1m8zqp.cloudfront.net/api/health
   ```

2. Check frontend:
   ```bash
   curl https://d1bnbqox1m8zqp.cloudfront.net/
   ```

3. Verify in browser:
   - Open https://d1bnbqox1m8zqp.cloudfront.net/
   - Check browser console for errors
   - Test API connectivity

## Troubleshooting Guide

### Backend Issues

1. **Container won't start**
   - Check CloudWatch logs
   - Verify environment variables
   - Check Dockerfile CMD

2. **Health check failures**
   - Ensure `/health` endpoint responds
   - Check security group rules
   - Verify target group configuration

### Frontend Issues

1. **MIME type errors**
   - Check S3 content-type metadata
   - Verify CloudFront isn't caching errors
   - Ensure no .tsx files in production build

2. **API connection failures**
   - Verify VITE_API_BASE_URL is correct
   - Check CloudFront behaviors
   - Test API endpoint directly

### Common Fixes

1. **Force CloudFront cache clear**:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id E2U2I62CTZC9QK \
     --paths "/*"
   ```

2. **Restart ECS service**:
   ```bash
   aws ecs update-service \
     --cluster aiglossarypro \
     --service aiglossarypro-api-production \
     --force-new-deployment
   ```

3. **Check container logs**:
   ```bash
   aws logs tail /ecs/aiglossarypro-api-production --follow
   ```

## Rollback Procedures

1. **Backend rollback**:
   - Update task definition to previous version
   - Force new deployment

2. **Frontend rollback**:
   - Sync previous build from backup
   - Invalidate CloudFront cache

## Security Considerations

1. Never commit secrets to repository
2. Use IAM roles for service permissions
3. Enable S3 bucket versioning
4. Configure CloudFront security headers
5. Regularly rotate secrets

## Maintenance

1. **Regular tasks**:
   - Monitor CloudWatch logs
   - Check ECS service metrics
   - Review CloudFront analytics
   - Update dependencies

2. **Cost optimization**:
   - Use Fargate Spot for non-critical tasks
   - Configure CloudFront caching properly
   - Enable S3 lifecycle policies
   - Monitor data transfer costs

Last updated: 2025-08-04