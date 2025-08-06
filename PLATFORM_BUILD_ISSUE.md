# Critical Docker Platform Build Issue - Aug 5, 2025

## The Mistake
Built Docker image for ARM64 (Apple Silicon) instead of AMD64, causing ECS deployment failures with error:
```
CannotPullContainerError: pull image manifest has been retried 7 time(s): 
image Manifest does not contain descriptor matching platform 'linux/amd64'
```

## Root Cause
- Docker on Mac M1/M2 builds for ARM64 by default
- AWS ECS Fargate runs on AMD64 architecture
- Failed to specify `--platform linux/amd64` during initial build

## The Fix
Always build with explicit platform specification:
```bash
# WRONG - Builds for host architecture (ARM64 on Mac)
docker build -t myapp .

# CORRECT - Builds for AMD64 (required for ECS)
docker buildx build --platform linux/amd64 --load -t myapp .
```

## Complete Deployment Process

### 1. Build for AMD64
```bash
docker buildx build --platform linux/amd64 --load \
  -f apps/api/Dockerfile \
  -t aiglossarypro-api:amd64 .
```

### 2. Tag for ECR
```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
docker tag aiglossarypro-api:amd64 \
  927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:amd64-$TIMESTAMP
```

### 3. Push to ECR
```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 927289246324.dkr.ecr.us-east-1.amazonaws.com

docker push 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:amd64-$TIMESTAMP
```

### 4. Update Task Definition
```bash
# Get current task definition
aws ecs describe-task-definition --task-definition aiglossarypro-api \
  --region us-east-1 --query 'taskDefinition' > task-def.json

# Update image
sed -i '' 's|"image": ".*"|"image": "927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:amd64-'$TIMESTAMP'"|' task-def.json

# Register new revision
aws ecs register-task-definition --cli-input-json file://task-def.json --region us-east-1
```

### 5. Deploy
```bash
aws ecs update-service --cluster aiglossarypro \
  --service aiglossarypro-api-production \
  --task-definition aiglossarypro-api:NEW_REVISION \
  --force-new-deployment --region us-east-1
```

## Lessons Learned
1. **ALWAYS specify platform** when building for deployment
2. **Test locally with platform flag** to catch issues early
3. **Add to CI/CD scripts** to prevent future mistakes
4. **Document platform requirements** in README/deployment docs

## Time Wasted
- ~1 hour debugging why deployment failed
- Multiple failed ECS task starts
- Unnecessary Docker cache cleanup
- Rebuilding entire image from scratch

## Prevention
Add this to all deployment scripts:
```bash
# At the top of deployment scripts
if [[ $(uname -m) == "arm64" ]]; then
  echo "⚠️  Building for AMD64 platform (required for ECS)"
  DOCKER_PLATFORM="--platform linux/amd64"
fi
```

## Current Status
- ✅ AMD64 image built successfully
- ⏳ Ready to deploy to ECS
- 📝 Documentation updated to prevent future mistakes