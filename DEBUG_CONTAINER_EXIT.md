# Container Exit Code 1 - Debugging Guide

**Issue**: Container exits immediately with code 1  
**Task ARN**: `9ae6041574524dc6a7ccdf3f037fb93b`  
**Status**: Essential container in task exited

---

## 🔍 Quick Debug Steps

### 1. Check Container Logs in CloudWatch
```bash
# View logs for the failed task
aws logs get-log-events \
  --log-group-name /ecs/aiglossarypro-api \
  --log-stream-name ecs/api/9ae6041574524dc6a7ccdf3f037fb93b \
  --region us-east-1
```

### 2. Run Container Locally
```bash
# Pull the image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 927289246324.dkr.ecr.us-east-1.amazonaws.com
docker pull 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:latest

# Run with minimal environment
docker run -it --rm \
  -e NODE_ENV=production \
  -e PORT=8080 \
  927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:latest

# If it crashes, run with shell to debug
docker run -it --rm \
  --entrypoint sh \
  927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:latest
```

### 3. Common Exit Code 1 Causes

1. **Missing Environment Variables**
   - Check if app expects DATABASE_URL at startup
   - Firebase credentials might be required

2. **Node.js Errors**
   - TypeScript compilation bypassed but runtime errors exist
   - Module not found errors
   - Syntax errors in JavaScript

3. **File/Directory Issues**
   - Missing dist directory
   - Wrong working directory
   - Permission issues (running as nodejs user)

---

## 🛠️ Fixes to Try

### Fix 1: Add Debug Logging
Update Dockerfile CMD:
```dockerfile
CMD ["sh", "-c", "echo 'Starting application...' && node dist/index.js"]
```

### Fix 2: Check File Structure
```dockerfile
# Add before CMD
RUN ls -la /app/apps/api/dist/
```

### Fix 3: Test Locally with Secrets
```bash
# Create .env.test with minimal vars
cat > .env.test << EOF
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://test
SESSION_SECRET=test
JWT_SECRET=test
EOF

# Run with env file
docker run -it --rm \
  --env-file .env.test \
  -p 8080:8080 \
  927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:latest
```

---

## 📝 Next Steps

1. **View CloudWatch Logs** - Most important! Will show exact error
2. **Fix TypeScript Errors** - Remove SKIP_TYPE_CHECK
3. **Add Better Error Handling** - Catch and log startup errors
4. **Increase Memory** - Current 512MB might be too low

---

## 🎯 Quick Command Reference

```bash
# View logs
aws logs tail /ecs/aiglossarypro-api --follow --region us-east-1

# Update task definition (increase memory)
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Start service again
./scripts/start-backend.sh

# Stop service (save costs)
./scripts/stop-backend.sh
```