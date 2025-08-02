# Module Compatibility Fix Plan

## Problem Summary
The Docker container exits with code 1 because of ES module/CommonJS incompatibility:
- **Config package**: Uses `"type": "module"` (ES modules)
- **API package**: No module type specified (defaults to CommonJS)
- **Build output**: API is transpiled to CommonJS but tries to import ES modules

## Solution Strategy
Convert all packages to use CommonJS for consistent Node.js compatibility in production.

## Detailed Implementation Plan

### Phase 1: Remove ES Module Configuration
1. **Remove `"type": "module"` from config package**
   - File: `/packages/config/package.json`
   - Action: Remove the `"type": "module"` line
   - Impact: Package will default to CommonJS

### Phase 2: Update Build Configurations
1. **Update all package build scripts to ensure CommonJS output**
   - Files to check:
     - `/packages/shared/tsconfig.json`
     - `/packages/database/tsconfig.json`
     - `/packages/auth/tsconfig.json`
     - `/packages/config/tsconfig.json`
   - Add to compilerOptions:
     ```json
     "module": "commonjs",
     "target": "ES2022"
     ```

2. **Verify API build configuration**
   - File: `/apps/api/esbuild.simple.js`
   - Confirm: `format: 'cjs'` is already set

### Phase 3: Fix Import/Export Statements
1. **Check for any ES module syntax in source files**
   - Look for: `import.meta.url` usage
   - Replace with: CommonJS equivalents
   - Common replacements:
     ```javascript
     // ES Module
     import.meta.url
     
     // CommonJS
     __filename
     ```

2. **Ensure all exports use CommonJS syntax in built files**
   - The TypeScript compiler will handle this automatically

### Phase 4: Rebuild Everything
1. **Clean all dist directories**
   ```bash
   rm -rf packages/*/dist
   rm -rf apps/api/dist
   ```

2. **Rebuild packages in order**
   ```bash
   pnpm --filter @aiglossarypro/shared run build
   pnpm --filter @aiglossarypro/database run build
   pnpm --filter @aiglossarypro/auth run build
   pnpm --filter @aiglossarypro/config run build
   pnpm --filter @aiglossarypro/api run build
   ```

### Phase 5: Docker Build & Test
1. **Build new Docker image**
   ```bash
   docker build -f apps/api/Dockerfile \
     --platform linux/amd64 \
     -t 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:commonjs .
   ```

2. **Test locally**
   ```bash
   docker run --rm \
     -e NODE_ENV=production \
     -e PORT=8080 \
     -e DATABASE_URL="postgresql://test" \
     -e SESSION_SECRET="test" \
     -e JWT_SECRET="test" \
     -e SIMPLE_AUTH_ENABLED=true \
     927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:commonjs
   ```

### Phase 6: Deploy to ECS
1. **Push to ECR**
   ```bash
   docker push 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:commonjs
   ```

2. **Update task definition**
   - Change image to `:commonjs` tag
   - Register new task definition

3. **Update ECS service**
   - Use new task definition
   - Set desired count to 1

4. **Monitor deployment**
   - Check CloudWatch logs
   - Verify health checks pass
   - Test API endpoints

### Phase 7: Verification
1. **Check container health**
   - Verify no exit code 1
   - Confirm health checks passing
   - Check ALB target health

2. **Test API functionality**
   - Health endpoint: `http://ALB-URL/health`
   - API endpoints working
   - Database connections successful

## Rollback Plan
If issues persist:
1. Stop ECS service (desired count = 0)
2. Review CloudWatch logs for new errors
3. Fix identified issues
4. Repeat from Phase 4

## Success Criteria
- [ ] Container starts without exit code 1
- [ ] Health checks pass consistently
- [ ] API responds to requests
- [ ] No module compatibility errors in logs
- [ ] Service stays running for >5 minutes

## Estimated Time
- Phase 1-3: 5 minutes (file updates)
- Phase 4: 2 minutes (rebuild)
- Phase 5: 5 minutes (Docker build/test)
- Phase 6: 5 minutes (deploy)
- Phase 7: 3 minutes (verify)
- **Total: ~20 minutes**