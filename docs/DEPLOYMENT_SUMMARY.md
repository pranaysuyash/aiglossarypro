# AIGlossaryPro AWS Deployment Summary

## Overview
This document summarizes the complete deployment process of AIGlossaryPro to AWS using ECS Fargate for the backend and S3/CloudFront for the frontend.

## Deployment Architecture

### Backend (API)
- **Service**: AWS ECS Fargate
- **Cluster**: `aiglossarypro`
- **Service Name**: `aiglossarypro-api-production`
- **Load Balancer**: `aiglossarypro-api-alb-1884179415.us-east-1.elb.amazonaws.com`
- **Container Registry**: AWS ECR
- **Health Check**: `/health` and `/api/health`

### Frontend (Web)
- **Storage**: AWS S3 bucket `aiglossarypro-frontend`
- **CDN**: AWS CloudFront
- **Distribution ID**: `E2U2I62CTZC9QK`
- **URL**: https://d1bnbqox1m8zqp.cloudfront.net/

## Key Issues Resolved

### 1. Multi-Architecture Docker Build Issues
- **Problem**: Local Mac M1 (arm64) builds timing out when deployed to AWS (amd64)
- **Solution**: Moved Docker builds to GitHub Actions on x86_64 runners
- **Implementation**: All builds now happen in CI/CD pipeline

### 2. Database Initialization Error
- **Problem**: `initDatabase is not a function` causing container crashes
- **Solution**: Updated `index-minimal.ts` to use `pool.query` directly
- **File**: `apps/api/src/index-minimal.ts`

### 3. Million.js Production Build Issues
- **Problem**: Million.js v3.1.11 generating raw `.tsx` files in production causing MIME type errors
- **Solution**: Created minimal Vite config without Million.js
- **File**: `apps/web/vite.config.minimal.ts`
- **Note**: Million.js has a known bug with no fix until v3.5.2 (doesn't exist yet)

### 4. CloudFront API Routing
- **Problem**: CloudFront expected `/api/*` paths but backend served routes without `/api` prefix
- **Solution**: Added `/api/health` endpoint to backend for compatibility
- **Updated**: Frontend now uses CloudFront URL for all API calls

## Environment Configuration

### Backend Environment Variables (Stored in AWS Secrets Manager)
- Database credentials: `aiglossarypro/database`
- JWT secrets: `aiglossarypro/jwt`
- Firebase credentials: `aiglossarypro/firebase`
- Session secrets: `aiglossarypro/session`
- External API keys: OpenAI, Resend, Gumroad, etc.

### Frontend Build Variables (Set in GitHub Actions)
- `VITE_API_BASE_URL`: https://d1bnbqox1m8zqp.cloudfront.net/api
- Firebase configuration
- Analytics IDs
- Gumroad URLs and pricing

## CI/CD Pipeline

### GitHub Actions Workflow: `.github/workflows/production.yml`

1. **Backend Deployment**:
   - Builds Docker image on GitHub runners (x86_64)
   - Pushes to AWS ECR
   - Updates ECS task definition
   - Deploys to ECS Fargate

2. **Frontend Deployment**:
   - Builds with production environment variables
   - Syncs to S3 with proper cache headers
   - Invalidates CloudFront cache

## Security Configuration

### S3 Bucket
- Bucket policy restricts access to CloudFront OAC only
- No public access allowed
- CloudFront Origin Access Control (OAC) configured

### CloudFront
- HTTPS only (redirect HTTP to HTTPS)
- Origin Access Control for S3
- Custom cache behaviors for API routing

## Monitoring and Health Checks

### API Health Endpoints
- `/health` - Direct health check
- `/api/health` - CloudFront-compatible health check

### ECS Health Checks
- HTTP checks on port 8080
- Path: `/health`
- Interval: 30 seconds
- Timeout: 5 seconds

## Deployment Commands

### Manual Deployment Trigger
```bash
git push origin main
```

### Check Deployment Status
```bash
# GitHub Actions status
gh run list --workflow=production.yml --limit=1

# ECS service status
aws ecs describe-services --cluster aiglossarypro --services aiglossarypro-api-production --region us-east-1

# CloudFront invalidation
aws cloudfront create-invalidation --distribution-id E2U2I62CTZC9QK --paths "/*"
```

### Verify Deployment
```bash
# Check API health
curl https://d1bnbqox1m8zqp.cloudfront.net/api/health

# Check frontend
curl https://d1bnbqox1m8zqp.cloudfront.net/
```

## Troubleshooting

### Common Issues

1. **ECS Task Failures**
   - Check CloudWatch logs: `/ecs/aiglossarypro-api-production`
   - Verify environment variables in Secrets Manager
   - Check task definition for correct image and port mappings

2. **Frontend Loading Issues**
   - Check browser console for JavaScript errors
   - Verify CloudFront behaviors are correctly configured
   - Ensure S3 bucket policy allows CloudFront access

3. **API Connection Issues**
   - Verify security groups allow traffic
   - Check ALB target group health
   - Confirm CloudFront origins are correct

## Next Steps

1. Enable S3 access logging for security monitoring
2. Set up custom domain with SSL certificate
3. Update DNS records to point to CloudFront
4. Configure CloudFront custom error pages
5. Set up CloudWatch alarms for monitoring

## Important Notes

- All deployments are triggered automatically on push to main branch
- Backend uses a minimal server configuration for faster startup
- Frontend build excludes problematic dependencies (Million.js)
- CloudFront serves both frontend assets and proxies API requests
- ECS tasks run on Fargate with 0.5 vCPU and 1GB memory

Last updated: 2025-08-04