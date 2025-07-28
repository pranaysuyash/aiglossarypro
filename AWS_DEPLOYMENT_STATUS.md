# AWS App Runner Deployment Issues - Status Report

## Current Situation
We're trying to deploy a Node.js/Express + React application to AWS App Runner, but the deployment keeps failing with container exit code 1.

## Application Stack
- **Backend**: Node.js 18, Express, TypeScript
- **Frontend**: React, Vite
- **Database**: Neon PostgreSQL (external)
- **Build System**: ESBuild for backend (CJS format), Vite for frontend
- **Container**: Docker (node:18-alpine)

## Issues Encountered

### 1. Module Format Conflicts
- **Problem**: Mixed ESM/CJS modules causing "Cannot use import statement outside a module" errors
- **What we tried**:
  - Removed `"type": "module"` from package.json
  - Converted all configs to CommonJS (tailwind.config.ts, postcss.config.js)
  - Built backend with `--format=cjs` flag in esbuild
  - Added problematic packages to externals list

### 2. Port Configuration Mismatch
- **Problem**: App Runner health checks failing on wrong port
- **Details**: 
  - Development uses PORT=3001
  - Production .env has PORT=3000
  - Dockerfile was using PORT=3001
  - App Runner was checking port 3000
- **Status**: Fixed by standardizing on PORT=3001

### 3. Platform Architecture Issue
- **Problem**: Docker image built for wrong architecture
- **Solution**: Added `--platform linux/amd64` to docker build command
- **Status**: Fixed

### 4. Database Connection Hanging
- **Problem**: Container exits with code 1, no application logs
- **Suspected cause**: Database pool initialization at module level in `server/db.ts`:
```typescript
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```
- **What we tried**:
  - Created timeout wrapper script
  - Added startup logging
  - Still fails before any application logs

### 5. Current Blocker - import.meta.url Error
```
TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string or an instance of URL. Received undefined
    at fileURLToPath (node:internal/url:1508:11)
```
- **Cause**: `server/vite.ts` uses `import.meta.url` which is undefined in CJS
- **Attempted fixes**:
  - Added vite to externals
  - Used esbuild define to replace import.meta.url
  - Created production stub

## Current Build Configuration

### package.json build script:
```json
"build": "vite build && esbuild server/index.ts --platform=node --bundle --format=cjs --outdir=dist --external:pg --external:redis --external:ioredis --external:bullmq --external:firebase-admin --external:@google-cloud/storage --external:sharp --external:bcrypt --external:argon2 --external:swagger-ui-express --external:swagger-jsdoc --external:dotenv --external:jsdom --external:canvas --external:isomorphic-dompurify --alias:@shared=./shared --define:import.meta.url='\"\"' --minify=false"
```

### Dockerfile:
```dockerfile
FROM node:18-alpine AS base
# ... build stages ...
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node", "start-production.js"]
```

## Questions for ChatGPT:

1. **Module Format**: Should we stick with CJS for production or try to make everything ESM? The hybrid approach is causing issues.

2. **Database Initialization**: The Neon PostgreSQL connection seems to hang when initialized at module level. Should we:
   - Move pool creation to a lazy initialization function?
   - Use a connection factory pattern?
   - Add connection timeout settings?

3. **import.meta.url in Dependencies**: When building with esbuild in CJS format, how should we handle dependencies that use `import.meta.url`? Current approaches aren't working.

4. **App Runner Specifics**: Are there known issues with App Runner and:
   - Database connections during health checks?
   - Long startup times?
   - Module resolution in bundled Node.js apps?

5. **Alternative Approach**: Should we:
   - Use a different bundler (webpack, rollup)?
   - Skip bundling and use node_modules in Docker?
   - Use AWS Lambda or ECS instead of App Runner?

## What's Working
- Docker builds successfully locally
- Frontend builds and serves correctly
- All environment variables are set in App Runner
- ECR push works fine

## Logs
- App Runner shows: "Container exit code: 1"
- No application logs reach CloudWatch
- Local testing shows import.meta.url error immediately

Would you recommend a different deployment strategy or see an obvious issue we're missing?