# AIGlossaryPro Deployment

## Quick Links

- **Production URL**: https://d1bnbqox1m8zqp.cloudfront.net/
- **API Health**: https://d1bnbqox1m8zqp.cloudfront.net/api/health
- **GitHub Actions**: [Production Workflow](https://github.com/pranaysuyash/aiglossarypro/actions/workflows/production.yml)

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Users     │────▶│  CloudFront  │────▶│     S3      │
└─────────────┘     │ Distribution │     │  Frontend   │
                    └──────┬───────┘     └─────────────┘
                           │
                           │ /api/*
                           ▼
                    ┌──────────────┐     ┌─────────────┐
                    │     ALB      │────▶│ ECS Fargate │
                    │Load Balancer │     │   Backend   │
                    └──────────────┘     └─────────────┘
```

## Deployment Status

- ✅ Backend API deployed to ECS Fargate
- ✅ Frontend deployed to S3
- ✅ CloudFront CDN configured
- ✅ API routing fixed (CloudFront → ALB → ECS)
- ✅ Health checks configured
- ✅ CI/CD pipeline via GitHub Actions
- ✅ **Vite TSX production build bug fixed**
- ✅ **Frontend loading successfully with proper JS files**
- ⏳ Custom domain setup pending
- ⏳ SSL certificate pending

## Key Components

### Backend
- **Platform**: AWS ECS Fargate
- **Container**: Node.js Express API
- **Database**: External (via DATABASE_URL)
- **Health Check**: `/health` and `/api/health`

### Frontend
- **Framework**: React + Vite
- **Hosting**: AWS S3
- **CDN**: AWS CloudFront
- **Build**: GitHub Actions

### CI/CD
- **Trigger**: Push to main branch
- **Backend**: Build → ECR → ECS
- **Frontend**: Build → S3 → CloudFront invalidation

## Common Commands

```bash
# Deploy (automatic on push)
git push origin main

# Check deployment status
gh run list --workflow=production.yml --limit=1

# Monitor logs
aws logs tail /ecs/aiglossarypro-api-production --follow

# Force CloudFront refresh
aws cloudfront create-invalidation --distribution-id E2U2I62CTZC9QK --paths "/*"
```

## Documentation

- [Deployment Summary](docs/DEPLOYMENT_SUMMARY.md) - Complete deployment overview
- [Deployment Steps](docs/DEPLOYMENT_STEPS.md) - Detailed step-by-step guide
- [TSX Build Fix](docs/TSX_BUILD_FIX.md) - Solution for Vite TSX production build bug
- [Vite Plugin Guide](docs/VITE_PLUGIN_GUIDE.md) - Custom plugin development guide
- [Troubleshooting](docs/DEPLOYMENT_STEPS.md#troubleshooting-guide) - Common issues and fixes

## Recent Updates

### 2025-08-04 (Latest)
- **🎉 CRITICAL FIX**: Resolved Vite TSX production build bug using custom Rollup plugin
- Created dual-hook solution (generateBundle + writeBundle) to rename .tsx → .js files
- Implemented production-specific Vite config with enhanced file handling
- Added CI/CD validation to prevent future .tsx file outputs
- **Result**: Frontend now loads successfully with proper JavaScript MIME types

### Earlier 2025-08-04
- Fixed Million.js production build issues by using minimal Vite config
- Added `/api/health` endpoint for CloudFront compatibility
- Updated frontend to use CloudFront URL for API calls
- Resolved all MIME type and module loading errors
- Backend and frontend fully deployed and operational

## Contact

For deployment issues, check the [troubleshooting guide](docs/DEPLOYMENT_STEPS.md#troubleshooting-guide) or contact the development team.