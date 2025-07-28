# AWS App Runner ESM Deployment Report
Date: July 28, 2025

## Executive Summary
We attempted to deploy an ESM-converted Node.js backend to AWS App Runner but encountered persistent health check failures. The "simple" (non-ESM) version deployed successfully, while all ESM attempts failed.

## What Worked: Simple (Non-ESM) Build

### Successful Deployment Details
- **Service Name**: `aiglossarypro-simple-test`
- **Image Tag**: `simple-staging`
- **Port Configuration**: 3000
- **Module System**: CommonJS
- **Build Process**: Standard TypeScript compilation without bundling
- **Status**: Successfully deployed and running

### Key Characteristics of Working Build
1. **No ESM modules** - traditional CommonJS with `require()`
2. **Direct TypeScript compilation** - no bundling
3. **Node.js compatible** - standard Node.js runtime execution
4. **Port 3000** - App Runner was configured for this port

## What Failed: ESM Builds

### Attempted ESM Deployments
1. `aiglossarypro-esm-staging` - CREATE_FAILED
2. `aiglossarypro-esm-fixed` - CREATE_FAILED  
3. `aiglossarypro-esm-final` - CREATE_FAILED

### ESM Build Characteristics
1. **Module System**: ES Modules with `"type": "module"` in package.json
2. **Build Tool**: esbuild with bundling
3. **Build Command**: 
   ```bash
   esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --alias:@shared=./shared --minify=false
   ```
4. **Node Version**: Upgraded to Node 20 (from Node 18)
5. **Port Configuration**: 8080 (changed from 3000)

## Timeline of Issues and Fixes Attempted

### 1. Initial ESM Conversion
- Added `"type": "module"` to package.json
- Updated all imports to use `.js` extensions
- Converted build process to output ESM format

### 2. Docker Build Issues
- **Problem**: 15GB build context, builds timing out
- **Fix**: Updated .dockerignore to exclude large directories
- **Result**: Build time reduced, but deployment still failed

### 3. Missing Environment Variables
- **Problem**: Container exiting with no output
- **Fix**: Added all required environment variables from .env.production
- **Result**: Container started but Redis connection errors appeared

### 4. Redis Connection Errors
- **Problem**: Multiple services trying to connect to Redis on localhost
- **Fixes Applied**:
  - Deleted `optimizedQueries.ts` (unconditional Redis connection)
  - Fixed `redis.ts` to respect REDIS_ENABLED flag
  - Made JobQueueManager Redis connection lazy
- **Result**: Redis errors resolved but health check still failed

### 5. Port Configuration Issues
- **Problem**: App Runner expects port 8080 but app defaulted to 3001
- **Discovery**: ChatGPT revealed App Runner injects its own PORT env var
- **Fixes Applied**:
  - Changed default PORT from 3000/3001 to 8080
  - Updated Dockerfile EXPOSE to 8080
  - Added explicit PORT=8080 to App Runner environment variables
  - Fixed both `config` and `appConfig` objects to use 8080
- **Result**: Health check still failed despite correct port configuration

## Root Cause Analysis

### Why Simple Build Works
1. **CommonJS Compatibility**: App Runner's Node.js environment handles CommonJS modules without issues
2. **No Bundling**: Direct execution of TypeScript-compiled JavaScript files
3. **Standard Node.js**: Uses Node.js built-in module resolution

### Why ESM Build Fails
1. **ESM Compatibility**: App Runner may have issues with ES modules in production
2. **Bundled Output**: esbuild creates a single bundled file which may have compatibility issues
3. **Module Resolution**: ESM has different module resolution rules that may conflict with App Runner's environment
4. **No Application Logs**: Container fails to start properly, preventing any debugging output

## Technical Differences

### Simple Build Output
```
dist/
├── server/
│   ├── index.js
│   ├── config.js
│   ├── routes/
│   └── ... (individual compiled files)
```

### ESM Build Output
```
dist/
└── index.js  (single bundled file, 2.1MB)
```

## Recommendations

### Option 1: Use Simple (CommonJS) Build
- **Pros**: Known to work, minimal changes needed
- **Cons**: Not using modern ESM modules

### Option 2: Debug ESM Locally First
1. Test the Docker image locally with same environment
2. Add extensive logging to startup process
3. Create minimal ESM test case

### Option 3: Alternative Deployment Platforms
Consider platforms with better ESM support:
- Vercel
- Railway
- Render
- Google Cloud Run

### Option 4: Hybrid Approach
- Keep frontend as ESM
- Build backend as CommonJS for App Runner compatibility

## Conclusion
AWS App Runner appears to have compatibility issues with ESM modules and/or bundled Node.js applications. The platform works reliably with traditional CommonJS builds but fails to properly start ESM-based containers, providing no application logs for debugging.

The "simple" non-ESM approach remains the most reliable deployment method for App Runner at this time.