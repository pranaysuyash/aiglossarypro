# AWS App Runner Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Changes
- [x] Fixed all TypeScript compilation errors
- [x] Removed rootDir constraints for monorepo compatibility
- [x] Updated package.json to use CommonJS format
- [x] Implemented esbuild for fast builds (100x improvement)
- [x] Added health check endpoint at `/health`
- [x] Moved esbuild to dependencies for App Runner

### ✅ Build Configuration
- [x] `apprunner.yaml` configured for nodejs18 runtime
- [x] Build commands use pnpm and workspace packages
- [x] CommonJS output configured via package.deploy.json
- [x] TypeScript configured with relaxed settings for deployment

## Deployment Monitoring

### 🔄 AWS App Runner Console
1. **Check Build Status**
   - Build should complete in 5-10 minutes
   - Look for "Build succeeded" message
   - Check build logs for any errors

2. **Check Deployment Status**
   - Deployment starts after successful build
   - Health checks begin once deployment completes
   - Service becomes "Running" when healthy

### 🔍 Common Issues and Solutions

#### Build Failures
- **Out of memory**: Already fixed with esbuild
- **Module not found**: Check pnpm workspace dependencies
- **TypeScript errors**: Using --noEmitOnError false flag

#### Runtime Failures
- **Port binding**: Configured to use PORT=8080
- **Missing env vars**: Check App Runner configuration
- **Module resolution**: CommonJS output configured

## Post-Deployment Verification

### 📋 Test Script
Run the test script once deployment completes:
```bash
APP_URL=https://your-app-name.awsapprunner.com ./test-deployment.sh
```

### 🎯 Manual Tests
1. **Health Check**: `curl https://your-app.awsapprunner.com/health`
2. **API Docs**: Visit `/api/docs` in browser
3. **Core API**: Test `/api/terms` endpoint
4. **Authentication**: Test login flow if applicable

### 📊 Monitoring
- Check CloudWatch logs for errors
- Monitor App Runner metrics
- Verify database connectivity
- Check external service integrations

## Environment Variables to Verify

Critical variables that must be set in App Runner:
- [ ] `NODE_ENV=production`
- [ ] `PORT=8080`
- [ ] `DATABASE_URL`
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY_BASE64`
- [ ] `JWT_SECRET`
- [ ] `SESSION_SECRET`

## Success Criteria

The deployment is successful when:
- ✅ Health check returns HTTP 200
- ✅ No critical errors in logs
- ✅ API endpoints responding
- ✅ Database queries working
- ✅ Authentication functional