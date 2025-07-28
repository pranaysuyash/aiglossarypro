# AWS App Runner Deployment Troubleshooting

## What We've Done ✅

1. **Fixed all module format issues**:
   - Converted to CommonJS format
   - Fixed tailwind.config.ts and postcss.config.js
   - Added NODE_ENV and PORT to Dockerfile

2. **Made server configuration production-friendly**:
   - Server now only requires DATABASE_URL and SESSION_SECRET
   - Other services show warnings instead of crashing

3. **Set all environment variables from .env.production**:
   - All 40+ environment variables configured via CLI
   - Including database, auth, email, and API keys

4. **Multiple deployment attempts**:
   - Image successfully pushed to ECR
   - App Runner service configured with environment variables

## Current Issue 🔴

The deployment keeps failing with CREATE_FAILED status. Possible reasons:

### 1. Port Mismatch
- Dockerfile sets PORT=3001
- .env.production has PORT=3000
- App Runner configuration needs consistency

### 2. Container Startup Issues
- Even with environment variables set, the container might not be starting
- Health checks might be failing

### 3. Resource Limits
- Default App Runner instance (0.5 vCPU, 1GB RAM) might be insufficient
- The application might need more resources

## Debugging Steps

1. **Check CloudWatch Logs**:
```bash
aws logs tail /aws/apprunner/aiglossarypro-app/af99858c5f9d4f0fbe64280b00eed8c4/application
aws logs tail /aws/apprunner/aiglossarypro-app/af99858c5f9d4f0fbe64280b00eed8c4/service
```

2. **Test Container Locally**:
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DATABASE_URL="<your-db-url>" \
  -e SESSION_SECRET="<your-secret>" \
  927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-app:latest
```

3. **Check App Runner Console**:
- Go to AWS Console → App Runner
- Check the deployment logs
- Look for specific error messages

## Potential Fixes

### Option 1: Increase Resources
```bash
aws apprunner update-service \
  --service-arn <your-arn> \
  --instance-configuration '{
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  }'
```

### Option 2: Simplify Health Check
Update health check to a simpler endpoint or increase timeout/interval.

### Option 3: Create New Service
Sometimes it's easier to create a fresh App Runner service:
```bash
aws apprunner create-service \
  --service-name "aiglossarypro-app-v2" \
  --source-configuration <your-config>
```

## Next Steps

1. Check the actual error in CloudWatch logs
2. Verify the container runs locally with production settings
3. Consider increasing resources or adjusting health check configuration
4. If all else fails, create a new App Runner service with the correct configuration from the start