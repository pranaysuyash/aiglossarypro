# Critical Pre-Deployment Checklist - Aug 5, 2025

## 🎯 Mission Critical: Frontend-Backend Integration Must Work

This deployment MUST resolve all integration issues to enable market launch.

## ✅ Issues Fixed

### 1. Docker Workspace Resolution ✓
- Changed from `pnpm deploy` to full workspace approach
- All workspace packages (`@aiglossarypro/*`) now properly included
- Verified packages exist in Docker build logs

### 2. ES Module/CommonJS Compatibility ✓
- Removed `"type": "module"` from auth package
- Fixed TypeScript incremental build cache issues
- All packages now compile to CommonJS correctly
- Verified dist folders exist with proper exports

### 3. Platform Architecture ✓
- Built AMD64 image (not ARM64)
- Image ready: `aiglossarypro-api:amd64`
- Compatible with AWS ECS Fargate

### 4. API Routes Registration ✓
- Using deferred initialization in `index-minimal.ts`
- Routes register after server starts
- Database connection verified before route registration

## 🔍 Critical Integration Points to Verify

### 1. CORS Configuration
```javascript
// Current settings in production
ALLOWED_ORIGINS=*  // Should work with CloudFront
```

### 2. Authentication Flow
- Firebase auth enabled: `FIREBASE_AUTH_ENABLED=true`
- Firebase credentials properly configured
- JWT tokens handled correctly

### 3. API Endpoints
- `/api/health` - Health check (already working)
- `/api/glossary` - Main data endpoints
- `/api/support` - Support endpoints
- `/api/auth` - Authentication endpoints

### 4. Frontend URLs
- CloudFront: https://d1bnbqox1m8zqp.cloudfront.net
- API Gateway: https://api.aiglossarypro.com
- Must ensure proper routing between them

## 📋 Deployment Steps

### 1. Tag and Push Image
```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="amd64-$TIMESTAMP"

# Tag the image
docker tag aiglossarypro-api:amd64 \
  927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:$IMAGE_TAG

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 927289246324.dkr.ecr.us-east-1.amazonaws.com

# Push to ECR
docker push 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:$IMAGE_TAG
```

### 2. Update Task Definition
```bash
# Update the task-def.json with new image
sed -i '' "s|\"image\": \".*\"|\"image\": \"927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:$IMAGE_TAG\"|" new-task-def.json

# Register new task definition
aws ecs register-task-definition \
  --cli-input-json file://new-task-def.json \
  --region us-east-1
```

### 3. Deploy to ECS
```bash
# Force new deployment
aws ecs update-service \
  --cluster aiglossarypro \
  --service aiglossarypro-api-production \
  --task-definition aiglossarypro-api \
  --force-new-deployment \
  --region us-east-1
```

## 🔍 Post-Deployment Verification

### 1. Monitor Logs (CRITICAL)
```bash
# Watch logs in real-time
aws logs tail /ecs/aiglossarypro-api --follow --region us-east-1
```

### 2. Test API Endpoints
```bash
# Health check
curl https://api.aiglossarypro.com/health

# API health
curl https://api.aiglossarypro.com/api/health

# Glossary endpoint (main functionality)
curl https://api.aiglossarypro.com/api/glossary
```

### 3. Test Frontend Integration
1. Open https://d1bnbqox1m8zqp.cloudfront.net
2. Check browser console for errors
3. Verify API calls succeed
4. Test authentication flow
5. Test data loading

## ⚠️ Rollback Plan

If deployment fails:
```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster aiglossarypro \
  --service aiglossarypro-api-production \
  --task-definition aiglossarypro-api:43 \
  --force-new-deployment \
  --region us-east-1
```

## 🚨 What to Watch For

1. **"initDatabase is not a function"** - Would mean packages still not resolved
2. **"exports is not defined"** - Would mean ES module issues persist
3. **404 on API routes** - Would mean routes not registering
4. **CORS errors** - Would mean frontend can't talk to backend
5. **Auth failures** - Would mean Firebase config issues

## 🎯 Success Criteria

- [ ] All API endpoints return data (not 404)
- [ ] Frontend loads without console errors
- [ ] Authentication works end-to-end
- [ ] Data persists to database
- [ ] No "initDatabase is not a function" errors
- [ ] No ES module errors in logs
- [ ] CloudFront serves frontend correctly
- [ ] API Gateway routes to backend properly

## 💡 Why This Should Work

1. **Full workspace in Docker** = All packages available
2. **CommonJS compilation** = No ES module conflicts
3. **AMD64 platform** = ECS compatibility
4. **Deferred initialization** = Proper startup sequence
5. **All dist folders exist** = Packages built correctly

This deployment has all the fixes for the issues we've encountered. Time to execute.