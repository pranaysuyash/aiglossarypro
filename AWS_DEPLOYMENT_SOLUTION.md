# AWS App Runner Deployment Solution Documentation

## Date: July 31, 2025

## Problem Statement
The AWS App Runner service was stuck serving a minimal test version of the application instead of the full production application, despite having the correct code in the repository.

## Root Cause Analysis

### The Issue
1. **Service State Problem**: App Runner was not picking up new deployments and was stuck on an old version
2. **Directory Context Mismatch**: The `apprunner.yaml` configuration had a critical flaw:
   - App Runner was set to use `SourceDirectory: "apps/api"` 
   - Build commands assumed execution from monorepo root
   - This caused build failures due to incorrect directory context

### Why Previous Attempts Failed
- Multiple configuration changes were made without addressing the core deployment state issue
- The service needed a forced redeployment to pick up changes
- Directory navigation in build commands was incorrect for subdirectory deployment

## The Solution

### 1. Fixed Directory Context in apprunner.yaml
Changed the build commands to properly navigate directories:

**Before (Broken):**
```yaml
build:
  commands:
    build:
      - cd apps/api && pnpm install --frozen-lockfile
      - cd apps/api && pnpm build
```

**After (Fixed):**
```yaml
build:
  commands:
    build:
      - cd ../.. && pnpm install --frozen-lockfile
      - cd ../.. && cd apps/api && pnpm build
```

### 2. Forced Manual Deployment
- Triggered manual deployment with operation ID: `f3cc495ec14c4e28960f0391e9d87c33`
- This forced App Runner to rebuild and redeploy with the corrected configuration

### 3. Monitoring Script
Created `monitor-deployment-fix.sh` to track deployment progress and verify the fix:
```bash
#!/bin/bash
# Monitors deployment and verifies full app is running
```

## What Worked

### For the Simple/Minimal Test App
1. **Simple Configuration**: Basic `apprunner.yaml` with minimal build steps
2. **Direct Execution**: Running `node test-minimal.js` directly without complex build process
3. **No Monorepo Complexity**: Single file execution without dependency management

### For the Full Production App
1. **Correct Directory Navigation**: Ensuring build commands navigate to monorepo root before installing dependencies
2. **Proper Build Context**: Maintaining correct working directory throughout build process
3. **Manual Deployment Trigger**: Forcing App Runner to pick up configuration changes
4. **Monitoring and Verification**: Using health endpoint to confirm full app deployment

## Key Lessons Learned

1. **App Runner Deployment State**: Sometimes App Runner gets stuck on old deployments and needs manual intervention
2. **Directory Context Matters**: When using `SourceDirectory` in App Runner, all commands execute from that directory, not the repository root
3. **Monorepo Considerations**: Build commands must account for monorepo structure when deploying from subdirectories
4. **Health Endpoints are Critical**: Having a proper health endpoint helps verify deployment success
5. **Force Deployments When Stuck**: If configuration changes aren't picked up, trigger manual deployments

## Final Working Configuration

### apprunner.yaml (Working Version)
```yaml
version: 1.0
runtime: nodejs18

build:
  commands:
    build:
      - cd ../.. && pnpm install --frozen-lockfile
      - cd ../.. && cd apps/api && pnpm build

run:
  runtime-version: "18"
  command: node dist/index.js
  network:
    port: 8080
    env: PORT
  env:
    - name: NODE_ENV
      value: production
    - name: PORT
      value: "8080"
```

## Verification
- Service URL: https://hkntj2murq.us-east-1.awsapprunner.com
- Health Check: Returns proper JSON response with status "healthy"
- Full API endpoints are now accessible
- No longer serving minimal test version

## Files Created/Modified During Troubleshooting
1. `apprunner.yaml` - Fixed directory navigation
2. `monitor-deployment-fix.sh` - Deployment monitoring script
3. `deployment-questions-for-ai.md` - Initial troubleshooting notes
4. Various test monitoring scripts for tracking deployment attempts

## Deployment Timeline
- Issue Identified: Service returning minimal test version
- Root Cause Found: Directory context mismatch in build commands
- Fix Applied: Updated apprunner.yaml with correct directory navigation
- Manual Deployment: Triggered at 16:07 IST
- Deployment Completed: ~16:39 IST (32 minutes)
- Verification: Health endpoint confirmed full app running