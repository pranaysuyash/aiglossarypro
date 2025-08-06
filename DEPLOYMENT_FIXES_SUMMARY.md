# Deployment Fixes Summary - Aug 4, 2025

## Problem Overview
The AIGlossaryPro application was deployed but had critical API issues where only `/health` endpoints worked, while all other routes returned 404 errors. The root cause was "initDatabase is not a function" error preventing proper API initialization.

## Root Cause Analysis
1. **Docker Workspace Issue**: The production Docker build wasn't properly including pnpm workspace packages
2. **Package Resolution**: `@aiglossarypro/database` package couldn't be found in the container
3. **ES Module Compatibility**: CommonJS exports in ES module scope causing runtime errors

## Fixes Implemented

### 1. Docker Workspace Configuration
**File**: `apps/api/Dockerfile`
- **Previous**: Used `pnpm deploy` approach (didn't work)
- **Current**: Full workspace approach with complete dependency resolution

```dockerfile
# Switch from pnpm deploy to full workspace
WORKDIR /repo
COPY --from=builder /repo/pnpm-workspace.yaml .
COPY --from=builder /repo/pnpm-lock.yaml .
COPY --from=builder /repo/package.json .
COPY --from=builder /repo/.npmrc .
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/api ./apps/api
RUN pnpm install --prod --frozen-lockfile
```

### 2. Lockfile Configuration
**File**: `.npmrc`
- Added `inject-workspace-packages=true` for proper workspace handling
- Required lockfile regeneration to fix `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`

### 3. ES Module Import Fixes
**File**: `apps/api/src/index-minimal.ts`
- Added `.js` extensions to ES module imports for proper resolution

```typescript
const { log } = await import('./utils/logger.js');
const { registerRoutes } = await import('./routes/index.js');
```

### 4. GitHub Actions Optimization
**Files**: `.github/workflows/*.yml`
- Disabled all workflows except `deploy-production` to save costs
- Changed triggers from `push/PR` to `workflow_dispatch` (manual only)

### 5. Frontend Build Configuration
**File**: `apps/web/package.json`
- Changed default build to use production config without PWA
- Fixed Workbox file size limit issues (vendor chunk > 2MB)

```json
"build": "vite build --config vite.config.prod.ts"
```

**File**: `apps/web/vite.config.ts`
- Increased Workbox maximum file size to 4MB

## Current Status

### ✅ Working Locally
- API starts successfully on port 3001
- Database connections established
- Frontend loads on port 5173
- Basic functionality working (but with ES module warnings)

### ❌ Production Issues Remaining
- **API Routes Return 404**: All routes except `/health` return frontend HTML
- **ES Module Error**: "exports is not defined in ES module scope" 
- API container runs but routes are not registered properly
- Same error pattern as seen in local esbuild warnings

### 🚀 Deployment in Progress
- Local Docker build initiated at 16:02 (running in background)
- Building fresh with no cache to ensure all fixes are applied
- CloudFront URL: https://d1bnbqox1m8zqp.cloudfront.net

### Warning Signs in Local Build
```
▲ [WARNING] The CommonJS "exports" variable is treated as a global variable in an ECMAScript module
▲ [WARNING] Import "verifyToken" will always be undefined because the file has no exports
```

## Files Modified During Fixes
1. `apps/api/Dockerfile` - Complete Docker workspace rewrite
2. `apps/api/src/index-minimal.ts` - ES module import fixes
3. `apps/api/esbuild.simple.js` - ES module build configuration
4. `.npmrc` - Workspace package injection
5. `apps/web/package.json` - Production build config
6. `apps/web/vite.config.ts` - Workbox file size limits
7. `.github/workflows/*.yml` - Cost-saving workflow disabling

## Next Steps Required
1. **Fix ES Module Compatibility**: Resolve CommonJS/ES module conflicts in auth package
2. **Package Exports**: Ensure all workspace packages properly export their functions
3. **Production Testing**: Deploy and verify all API routes work correctly
4. **Cost Management**: Keep non-essential GitHub Actions disabled

## Lessons Learned
1. pnpm workspace Docker builds require full workspace approach, not `pnpm deploy`
2. ES module imports need explicit `.js` extensions
3. PWA builds can exceed file size limits with large vendor bundles
4. GitHub Actions costs can add up quickly with frequent deployments
5. **TypeScript Incremental Builds Can Fail Silently**: If a package isn't creating output despite successful builds, use `tsc --build --force` to bypass incremental compilation cache

## Commands for Testing
```bash
# Local development
npm run dev:smart

# Production build test
pnpm --filter api build
pnpm --filter web build

# Visual audit
npm run audit:visual:comprehensive
```

## Local Deployment (Cost-Saving Alternative)
To avoid GitHub Actions costs while testing fixes:

```bash
# Deploy API only (recommended for testing fixes)
./scripts/local-deploy.sh

# Deploy frontend (if needed)
./scripts/local-deploy-frontend.sh

# Check API logs after deployment
aws logs tail /ecs/aiglossarypro-api --follow
```

**Benefits:**
- No GitHub Actions costs during testing
- Faster iteration cycle
- Same exact deployment process as CI/CD
- Can test multiple builds quickly

## Important Discovery: Auth Package Build Issue

### Problem
- Removed `"type": "module"` from `packages/auth/package.json` to fix ES module errors
- Running `pnpm --filter auth build` appeared successful but created no dist folder
- No error messages, just silent failure

### Root Cause
TypeScript's incremental compilation was using cached build state from `.tsbuildinfo` file

### Solution
```bash
# Force rebuild bypassing incremental cache
npx tsc --build tsconfig.json --force
```

This successfully created the dist folder with all compiled files.

### Key Takeaway
Always verify that build outputs actually exist after running build commands. If missing despite "successful" builds, force a clean rebuild.

## Background Docker Builds

### Problem
Docker builds with `--no-cache` can timeout in CLI (default 2 minute timeout) when downloading many packages

### Solution
Run Docker builds in background to avoid timeout issues:
```bash
# Run build in background with output to log file
docker build --no-cache --progress=plain -f apps/api/Dockerfile -t aiglossarypro-api:no-cache . > docker-build.log 2>&1 &

# Check build progress
tail -f docker-build.log

# Check if build is still running
ps aux | grep "docker build" | grep -v grep
```

This approach ensures builds complete successfully without CLI timeout interruptions.

## Critical Platform Build Issue - Aug 5, 2025

### The Problem
After fixing all code issues, deployment still failed with:
```
CannotPullContainerError: pull image manifest has been retried 7 time(s): 
image Manifest does not contain descriptor matching platform 'linux/amd64'
```

### Root Cause
- Built Docker image for ARM64 (Apple Silicon default) instead of AMD64
- AWS ECS Fargate requires AMD64 architecture
- Forgot to specify `--platform linux/amd64` during build

### The Fix
Always specify platform when building for deployment:
```bash
# CORRECT - Build for AMD64 (ECS requirement)
docker buildx build --platform linux/amd64 --load \
  -f apps/api/Dockerfile \
  -t aiglossarypro-api:amd64 .
```

### Prevention
Add platform checks to all deployment scripts:
```bash
if [[ $(uname -m) == "arm64" ]]; then
  echo "⚠️  Building for AMD64 platform (required for ECS)"
  DOCKER_PLATFORM="--platform linux/amd64"
fi
```

### Time Wasted
- ~1 hour debugging deployment failures
- Multiple failed ECS task starts
- Unnecessary Docker cache cleanup
- Complete rebuild from scratch

### Current Status
- ✅ AMD64 image built successfully
- ✅ Ready for deployment to ECS