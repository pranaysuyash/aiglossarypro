# API Initialization Fix Documentation

## Issue Summary
The API was failing to start properly in production, with only the `/health` and `/api/health` endpoints working. All other routes returned 404 errors.

## Root Cause Analysis

### 1. Module Format Mismatch
- **Issue**: The `index-minimal.js` file was using ES module syntax (`await import()`) for dynamic imports
- **Problem**: The build process was converting it to CommonJS format, causing module loading failures
- **Error**: `Cannot find package '/app/apps/api/node_modules/@aiglossarypro/database/dist/index.js'`

### 2. No initDatabase Function
- **Finding**: The error "initDatabase is not a function" was misleading
- **Reality**: There is no `initDatabase` function anywhere in the codebase
- **Source**: The error was coming from the module import failure, not from actual function calls

## Solution Implemented

### 1. Fixed esbuild Configuration
Modified `apps/api/esbuild.simple.js` to:
- Separate `index-minimal.ts` from other build files
- Build `index-minimal.ts` with ES module format
- Keep other files as CommonJS for compatibility

```javascript
// ES module build options for index-minimal.ts
const esmBuildOptions = {
  ...buildOptions,
  format: 'esm',
  banner: {
    js: '// ES Module build for dynamic imports\\n',
  },
};
```

### 2. Build Process Changes
- The build now correctly identifies `index-minimal.ts`
- Builds it separately with ES module format
- Allows dynamic imports to work properly in production

## How index-minimal.js Works

1. **Immediate Startup**: Starts a basic Express server without any imports that could crash
2. **Health Endpoints**: Registers only `/health` and `/api/health` immediately
3. **Deferred Initialization**: After 1 second, attempts to:
   - Import database package
   - Validate environment
   - Connect to database
   - Register all other routes
4. **Graceful Degradation**: If imports fail, server stays running with health endpoints only

## Environment Variables Confirmed
All required environment variables are properly configured in the ECS task definition:
- `FIREBASE_AUTH_ENABLED=true`
- `JWT_SECRET` (from AWS Secrets Manager)
- `DATABASE_URL` (from AWS Secrets Manager)
- All Firebase configuration variables

## Files Modified
1. `/apps/api/esbuild.simple.js` - Added ES module build support
2. `/apps/api/dist/index-minimal.js` - Now properly built as ES module

## Testing Steps
1. Build API: `cd apps/api && pnpm run build`
2. Check output format: Verify `dist/index-minimal.js` uses ES module syntax
3. Build Docker image: `docker build --platform linux/amd64 -f apps/api/Dockerfile -t aiglossarypro-api .`
4. Deploy to ECS
5. Verify all API endpoints work

## Current Status
- Build process fixed ✅
- ES module format working ✅
- Docker image building in progress...
- Deployment pending