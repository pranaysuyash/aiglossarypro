# ECS Deployment Troubleshooting Report
**Date**: August 7, 2025  
**Issue**: Backend containers exit immediately with code 1 and no CloudWatch logs

## Executive Summary
Following ChatGPT's troubleshooting guide, we've identified that backend containers on AWS Fargate are failing immediately with exit code 1 without producing any logs. This is characteristic of a binary-level failure before Node.js initialization.

## Current Findings

### 1. Container Exit Pattern
- **Exit Code**: 1 (consistent across all attempts)
- **Stopped Reason**: "Essential container in task exited"
- **CloudWatch Logs**: Empty (no output at all)
- **Task Definition**: aiglossarypro-api:115
- **Status**: 0 running tasks despite 1 desired

### 2. Image Architecture Analysis
- **Latest Image**: `api-fixed-20250807-205155`
- **Architecture**: amd64 (correct for Fargate)
- **Size**: 844MB
- **Media Type**: Single architecture manifest (not multi-arch)

### 3. Root Cause Analysis (Per ChatGPT)

#### Most Likely Causes:
1. **Alpine Linux Compatibility Issues**
   - Alpine uses musl libc instead of glibc
   - Can cause silent failures with native Node modules
   - ECS Exec debugging is harder on Alpine
   - DNS resolver issues possible

2. **Missing Dependencies or Configuration**
   - Container may be missing required files
   - Entry point might be misconfigured
   - Environment variables not properly set

3. **Early Crash Before Node.js Starts**
   - Binary incompatibility
   - Missing shared libraries
   - Exec format errors (though image is amd64)

## Solutions Implemented

### 1. Debug Wrapper Script (`debug-entrypoint.sh`)
- Adds extensive logging before Node.js starts
- Checks for Node.js availability
- Verifies file presence
- Logs environment variables
- Tests module loading

### 2. Node:20-slim Dockerfile (`Dockerfile.debug`)
- Switches from Alpine to Debian-based image
- More compatible with production workloads
- Better glibc support
- Includes curl for health checks
- Extended health check start period (120s)

### 3. Multi-Architecture Build Script (`deploy-multiarch.sh`)
- Ensures proper platform targeting
- Builds for both amd64 and arm64
- Uses Docker buildx for cross-platform builds
- Prevents architecture mismatch issues

### 4. Debug Deployment Script (`deploy-debug.sh`)
- Step-by-step deployment with logging
- Local container testing before push
- Enhanced CloudWatch log filtering
- Immediate log retrieval after deployment
- Comprehensive status checking

## Key Differences from Yesterday's Working Deployment

| Aspect | Yesterday (Working) | Today (Failing) |
|--------|-------------------|-----------------|
| Port | 3001 | Mixed (3001/8080) |
| Base Image | Unknown | node:20-alpine |
| Build Platform | Possibly CI/CD | Local Mac (ARM) |
| Task Memory | 512MB | 1024MB |
| Health Check | Basic | Various configs |

## Deployment Scripts Available

1. **`deploy-debug.sh`** - Debug deployment with node:20-slim and extensive logging
2. **`deploy-multiarch.sh`** - Multi-architecture build ensuring amd64 compatibility
3. **`deploy-ultimate.sh`** - Comprehensive deployment with background processing
4. **`deploy-now.sh`** - Quick deployment with pre-built dist

## Next Steps

### Immediate Actions:
1. **Run `./deploy-debug.sh`** to deploy with Debian-based image and debug logging
2. **Monitor CloudWatch logs** for [DEBUG] messages
3. **Check stopped task reasons** in ECS console

### If Debug Deployment Succeeds:
1. Confirms Alpine was the issue
2. Continue using node:20-slim for production
3. Update all Dockerfiles to use Debian base

### If Debug Deployment Fails:
1. Check debug output in CloudWatch
2. Test with sleep command to keep container alive
3. Use ECS Exec to debug interactively
4. Consider rebuilding from scratch

## ChatGPT's Key Recommendations

1. **Switch to node:20-slim** (Debian-based) for better compatibility
2. **Add pre-Node.js logging** to capture early failures
3. **Ensure --platform=linux/amd64** in all builds
4. **Check ECS stopped task reasons** for hidden clues
5. **Increase health check start period** to allow for slow starts
6. **Clear CloudFront cache** after deployments

## Monitoring Commands

```bash
# Check service status
aws ecs describe-services --cluster aiglossarypro --services aiglossarypro-api-production --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}'

# Get stopped task reasons
aws ecs list-tasks --cluster aiglossarypro --service-name aiglossarypro-api-production --desired-status STOPPED --max-results 5

# Watch CloudWatch logs
aws logs tail /ecs/aiglossarypro-api --follow --filter-pattern "[DEBUG]"

# Test API health
curl -s https://d1m7nnfj3im4kp.cloudfront.net/api/health
```

## Files Created for Troubleshooting

1. **`debug-entrypoint.sh`** - Wrapper script with extensive logging
2. **`Dockerfile.debug`** - Debian-based Docker configuration
3. **`deploy-debug.sh`** - Debug deployment script
4. **`deploy-multiarch.sh`** - Multi-architecture deployment
5. **`TROUBLESHOOTING-REPORT.md`** - This document

## Conclusion

The issue appears to be a container-level failure before Node.js initialization, likely due to Alpine Linux compatibility issues or missing dependencies. The debug deployment using node:20-slim should provide either a working solution or detailed error logs to identify the root cause.

**Ready to deploy with debug configuration when you're ready.**