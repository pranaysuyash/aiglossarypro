# ECS Deployment Resolution - Platform Mismatch Fix

**Date**: August 9, 2025  
**Status**: RESOLVED ✅

## Root Cause Identified

The ECS tasks were failing because Docker images were built for **ARM64** (Apple Silicon/M1) but ECS Fargate runs on **AMD64** (x86_64) architecture.

**Error**: `CannotPullContainerError: image Manifest does not contain descriptor matching platform 'linux/amd64'`

## Solutions Implemented

### 1. Platform-Specific Build
```bash
# OLD (builds for host architecture - ARM64 on M1)
docker build -f Dockerfile -t image-name .

# NEW (explicitly builds for AMD64)
docker buildx build --platform linux/amd64 --load -f Dockerfile -t image-name .
```

### 2. Memory Configuration Fix
```dockerfile
# Set Node.js memory to 75% of container memory
ENV NODE_OPTIONS="--enable-source-maps --max-old-space-size=1536"  # For 2GB container
```

### 3. Updated Deployment Script
Modified `deploy-full-api.sh` to use `docker buildx` with `--platform linux/amd64`

## Current Status

✅ **Minimal health server running** (Task definition 123)
- 256 CPU, 512 Memory
- Simple HTTP server responding to /health
- Confirms infrastructure and networking are correct

## Next Steps

1. **Complete full API build for AMD64**
   - Build is slow on Apple Silicon when cross-compiling
   - Consider using GitHub Actions or EC2 instance for faster AMD64 builds

2. **Switch Database Driver**
   - From: `@neondatabase/serverless` (WebSocket-based)
   - To: `pg` (standard PostgreSQL driver with TLS)
   - Reason: Better compatibility with ECS networking

3. **Deploy Full API**
   ```bash
   # Build on AMD64 machine or CI/CD
   docker buildx build --platform linux/amd64 --push \
     -f apps/api/Dockerfile.ecs \
     -t 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:full-amd64 .
   ```

## Lessons Learned

1. **Always specify target platform** when building for ECS from Apple Silicon
2. **Node.js memory** should be 50-75% of container memory, not 100%
3. **Test with minimal container first** to isolate infrastructure vs application issues
4. **Cross-platform builds are slow** - use native AMD64 builders when possible

## Quick Commands

### Build for ECS on M1/M2 Mac
```bash
docker buildx build --platform linux/amd64 --load -f Dockerfile -t image-name .
```

### Test locally with AMD64 image
```bash
docker run --platform linux/amd64 -p 8080:8080 image-name
```

### Check ECS task failure reason
```bash
aws ecs describe-tasks --cluster <cluster> --tasks <task-arn> \
  --query 'tasks[0].stoppedReason' --output text
```

---

**Important**: When deploying from Apple Silicon (M1/M2) to ECS, ALWAYS use `--platform linux/amd64` in your Docker build commands!