# Docker Build Notes

## CRITICAL: Build Context and Directory

1. **ALWAYS build from the ROOT directory** (AIGlossaryPro/)
2. Use `docker build . -f apps/api/Dockerfile` NOT `cd apps/api && docker build`
3. The workspace needs the full monorepo structure
4. The Dockerfile expects to find pnpm-workspace.yaml, pnpm-lock.yaml in the build context

## Working Configuration

- **Entrypoint**: index-minimal.js (uses deferred initialization)
- **Platform**: linux/amd64 (not ARM64)
- **Redis import fix**: Use images with redis fix applied
- **Routes**: Registered via deferred initialization in index-minimal.js

## Build Command Template

```bash
TAG="working-$(date +%H%M%S)"
docker build --platform linux/amd64 -t 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:$TAG -f apps/api/Dockerfile .
docker push 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:$TAG
```

## Issues to Avoid
- Building from wrong directory
- Using ARM64 images on AMD64 infrastructure  
- Using index.js instead of index-minimal.js
- Missing redis import fixes