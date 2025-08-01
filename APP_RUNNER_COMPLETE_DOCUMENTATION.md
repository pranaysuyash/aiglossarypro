# AWS App Runner - Complete Documentation & Post-Mortem

**Date**: August 1, 2025  
**Purpose**: Document all App Runner deployment attempts, configurations, and lessons learned before migrating to ECS Fargate

---

## Executive Summary

### Deployment Statistics
- **Total Deployment Attempts**: 17+
- **Time Invested**: ~48 hours over multiple days
- **Success Rate**: 0% (all deployments failed)
- **Root Causes Identified**: 12 distinct issues
- **Commits Made**: 15+ deployment-related fixes

### Key Failure Patterns
1. **Environment Variable Issues** (Attempts 1-3)
2. **Build Configuration Problems** (Attempts 4-6)
3. **Import Path Errors** (Attempts 7-9)
4. **Container Startup Failures** (Attempts 10-17)

---

## Working Services Documentation

### 1. Successfully Deployed Service (Reference)
**Service**: `aiglossary-production-exact`
- **Branch**: monorepo-migration
- **Source Directory**: apps/api
- **Status**: Was working before main branch issues
- **Key Success Factors**:
  - Used `corepack enable` for pnpm
  - Proper workspace package builds
  - No problematic startup code

### 2. Current Failed Service
**Service**: `aiglossarypro-main-final-clean`
- **URL**: https://zbkvwr8rss.us-east-1.awsapprunner.com
- **Status**: CREATE_FAILED / Operation in progress
- **ARN**: arn:aws:apprunner:us-east-1:927289246324:service/aiglossarypro-main-final-clean/4db2eecdc13d40bcab11faf26674f419

---

## Complete Failure Timeline

### Phase 1: Initial Setup Failures (Attempts 1-3)
**Issue**: Environment variables and GitHub secrets
- Hardcoded secrets triggered GitHub protection
- Environment variables not passed correctly
- Wrong deployment approach (Docker vs Repository)

### Phase 2: Build Configuration (Attempts 4-6)
**Issue**: pnpm not found
```bash
/bin/sh: line 1: pnpm: command not found
```
**Fix Applied**: Added `corepack enable`

### Phase 3: Import Path Errors (Attempts 7-9)
**Issue**: Relative imports failing
```
Could not resolve "../../../shared/types" from "src/interfaces/interfaces.ts"
```
**Fix Applied**: Replaced all relative imports with workspace aliases
- Fixed 9 files with incorrect imports
- Changed `../../../shared/types` to `@aiglossarypro/shared/types`

### Phase 4: Container Startup Failures (Attempts 10-17)
**Issue**: Container exit code 1
- Module path incorrect: `node dist/index.js` vs `node apps/api/dist/index.js`
- .env file loading in production causing crashes
- Static file serving throwing fatal errors
- Console.log statements causing container issues

---

## Configuration Files

### 1. apprunner.yaml (Root)
```yaml
version: 1.0
runtime: nodejs18

build:
  commands:
    pre-build:
      - npm install -g pnpm
      - corepack enable
    build:
      - pnpm install --frozen-lockfile
      - pnpm --filter @aiglossarypro/shared run build
      - pnpm --filter @aiglossarypro/database run build
      - pnpm --filter @aiglossarypro/auth run build
      - pnpm --filter @aiglossarypro/config run build
      - cd apps/api && SKIP_TYPE_CHECK=true NODE_ENV=production pnpm run build

run:
  command: node apps/api/dist/index.js
  network:
    port: 8080
    env: PORT
  env:
    - name: NODE_ENV
      value: production
    - name: PORT
      value: "8080"
    # ... (all other environment variables)
```

### 2. GitHub Connection
- **Working ARN**: `arn:aws:apprunner:us-east-1:927289246324:connection/github-aiglossarypro/09891cbae37b41b4b0c51a6539f41ab1`
- **Repository**: https://github.com/pranaysuyash/aiglossarypro
- **Auto-deployment**: Enabled on main branch

---

## Code Fixes Applied

### 1. Environment Variable Logging (Fixed)
```typescript
// Before: Logging sensitive data in production
log.info('FIREBASE_PROJECT_ID:', { value: process.env.FIREBASE_PROJECT_ID });

// After: Only log in development
if (process.env.NODE_ENV !== 'production') {
  log.info('🔍 Development - Firebase Environment Check:');
}
```

### 2. Static File Serving (Fixed)
```typescript
// Before: Fatal error if frontend build missing
if (!fs.existsSync(distPath)) {
  throw new Error(`Could not find the build directory: ${distPath}`);
}

// After: Graceful fallback
if (!distPath) {
  logger.warn('⚠️ No frontend build found, serving API only');
  return; // Don't throw error, just serve API only
}
```

### 3. Process Exit Removal (Fixed)
```typescript
// Before: Crashing container
} catch (error) {
  log.error('❌ Error setting up static file serving');
  process.exit(1);
}

// After: Continue with API only
} catch (error) {
  log.warn('⚠️ Static file serving setup failed, continuing with API only');
}
```

---

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://neondb_owner:npg_9dlJKInqoT1w@ep-wandering-morning-a5u0szvw.us-east-2.aws.neon.tech/neondb?sslmode=require

# Authentication
SESSION_SECRET=<secret>
JWT_SECRET=<secret>

# Firebase
FIREBASE_PROJECT_ID=aiglossarypro
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@aiglossarypro.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_BASE64=<base64-encoded-key>

# Email
EMAIL_ENABLED=true
RESEND_API_KEY=<key>

# Payment
GUMROAD_ACCESS_TOKEN=<token>
GUMROAD_APPLICATION_ID=<id>
GUMROAD_APPLICATION_SECRET=<secret>

# API Keys
OPENAI_API_KEY=<key>

# URLs
BASE_URL=https://aiglossarypro.com

# Features
SIMPLE_AUTH_ENABLED=true
```

---

## Why App Runner Failed for This Project

### 1. **Monorepo Complexity**
- App Runner expects simple Node.js apps
- Our monorepo with workspaces requires complex build steps
- Path resolution issues between development and production

### 2. **Limited Debugging**
- No SSH access to containers
- Limited log visibility
- Can't inspect file system or running processes

### 3. **Configuration Inflexibility**
- Can't customize container runtime
- Limited control over build environment
- No ability to install system dependencies

### 4. **Cost During Development**
- Always running (can't stop to save costs)
- Minimum charges even when not in use
- Multiple failed deployments cost money

---

## Migration Checklist to ECS

### Pre-Migration Tasks
- [x] Document all App Runner configurations
- [x] Save all environment variables
- [x] Document working service configurations
- [ ] Export App Runner logs if needed
- [ ] Take screenshots of App Runner console

### Migration Tasks
- [ ] Create Dockerfile for API service
- [ ] Set up ECR repository
- [ ] Create ECS cluster
- [ ] Configure task definitions
- [ ] Set up ALB for HTTPS
- [ ] Configure auto-scaling (optional)
- [ ] Set up CloudWatch logs

### Post-Migration
- [ ] Test all endpoints
- [ ] Verify environment variables
- [ ] Set up monitoring
- [ ] Document start/stop procedures
- [ ] Delete App Runner services

---

## Lessons Learned

### 1. **Start with the Right Tool**
- App Runner is great for simple apps
- Complex monorepos need more flexible solutions
- ECS Fargate offers better control and debugging

### 2. **Fail Fast Philosophy**
- Should have abandoned App Runner after attempt 5-6
- Sunk cost fallacy led to 17+ attempts
- Better to switch tools than force a square peg

### 3. **Production vs Development Code**
- Development conveniences (.env loading) broke production
- Always test production builds locally first
- Keep production code minimal and robust

### 4. **Debugging is Critical**
- Need access to container logs and file system
- Ability to SSH into containers saves hours
- Better error messages prevent guessing games

---

## App Runner Services to Delete

1. `aiglossarypro-main-final-clean` (current)
2. Any other test services in CREATE_FAILED state
3. Associated service-linked roles

---

## Final Recommendation

**Move to ECS Fargate immediately because:**
1. Better debugging capabilities
2. Full control over container configuration
3. Ability to start/stop to save costs
4. More suitable for complex applications
5. Industry-standard solution for production workloads

**Estimated migration time**: 4-6 hours (vs another 17+ App Runner attempts)

---

**Document Created**: August 1, 2025  
**Author**: Development Team + Claude  
**Status**: Ready for ECS migration