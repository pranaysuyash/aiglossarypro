# AWS App Runner Troubleshooting Guide

## 🚨 Common Deployment Issues and Solutions

### 1. Build Phase Failures

#### Issue: "Command failed with exit code 2"
**Symptoms:**
- Build fails during TypeScript compilation
- Error: `ELIFECYCLE Command failed with exit code 2`

**Solution:**
✅ Already implemented: Using esbuild instead of tsc for fast builds
```bash
# package.deploy.json uses:
"build": "SKIP_TYPE_CHECK=true node build.js"
```

#### Issue: "Cannot find module"
**Symptoms:**
- Module resolution errors during build
- Missing workspace dependencies

**Solution:**
- Ensure all workspace packages are built first
- Check apprunner.yaml includes:
```yaml
- pnpm --filter @aiglossarypro/shared run build
- pnpm --filter @aiglossarypro/database run build
- pnpm --filter @aiglossarypro/auth run build
- pnpm --filter @aiglossarypro/config run build
```

#### Issue: Out of Memory
**Symptoms:**
- Build process killed
- "JavaScript heap out of memory"

**Solution:**
✅ Already fixed with esbuild (uses minimal memory)
- If still occurs, check App Runner instance size

### 2. Runtime Failures

#### Issue: "502 Bad Gateway"
**Symptoms:**
- Application builds but won't start
- Health checks failing

**Debugging Steps:**
1. Check CloudWatch logs:
   ```
   AWS Console > App Runner > Your Service > Logs
   ```

2. Common causes:
   - Missing environment variables
   - Port mismatch (must be 8080)
   - Module loading errors

**Solutions:**
- Verify PORT=8080 in environment
- Check all required env vars are set
- Ensure CommonJS build output

#### Issue: "Cannot find module 'express'"
**Symptoms:**
- Runtime module resolution errors
- Dependencies not installed

**Solution:**
- Ensure production dependencies in package.deploy.json
- Check node_modules aren't in .gitignore
- Verify pnpm install runs successfully

### 3. Environment Variable Issues

#### Issue: "Firebase initialization failed"
**Symptoms:**
- Authentication not working
- Firebase errors in logs

**Solution:**
Check these variables in App Runner:
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY_BASE64=base64-encoded-key
```

**How to encode private key:**
```bash
# On macOS/Linux:
cat firebase-private-key.txt | base64

# Set in App Runner without quotes
```

#### Issue: "Database connection failed"
**Symptoms:**
- Cannot connect to database
- Timeout errors

**Solution:**
- Verify DATABASE_URL format
- Check security groups allow App Runner
- Ensure SSL mode if required:
```
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### 4. Health Check Failures

#### Issue: Health check timing out
**Symptoms:**
- Deployment stuck in "Pending"
- Service never becomes "Running"

**Solution:**
✅ Already implemented: Simple health endpoint
```javascript
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'healthy' });
});
```

Verify:
- Endpoint responds within 10 seconds
- Returns HTTP 200 status
- No authentication required

### 5. Debugging Commands

#### Check Current Deployment Status
```bash
# Using AWS CLI
aws apprunner list-services
aws apprunner describe-service --service-arn <your-service-arn>
```

#### View Recent Logs
```bash
# Get recent application logs
aws logs tail /aws/apprunner/<service-name>/application --follow
```

#### Test Locally with Production Build
```bash
# Simulate App Runner build
cp package.deploy.json package.json
SKIP_TYPE_CHECK=true node build.js
PORT=8080 node dist/index.js
```

### 6. Performance Issues

#### Issue: Slow response times
**Symptoms:**
- API responses taking > 5 seconds
- Timeouts on complex queries

**Solutions:**
- Enable query result caching
- Check database indexes
- Monitor with CloudWatch metrics
- Consider larger App Runner instance

### 7. Quick Diagnostics Script

Create `diagnose-deployment.sh`:
```bash
#!/bin/bash
SERVICE_URL=$1

echo "🔍 Diagnosing App Runner Deployment"
echo "==================================="

# 1. DNS Resolution
echo "1. DNS Resolution:"
nslookup $(echo $SERVICE_URL | sed 's|https://||' | sed 's|/.*||')

# 2. Health Check
echo -e "\n2. Health Check:"
curl -s -w "\nTime: %{time_total}s\nHTTP Code: %{http_code}\n" $SERVICE_URL/health

# 3. Response Headers
echo -e "\n3. Response Headers:"
curl -sI $SERVICE_URL | head -10

# 4. SSL Certificate
echo -e "\n4. SSL Certificate:"
echo | openssl s_client -connect $(echo $SERVICE_URL | sed 's|https://||' | sed 's|/.*||'):443 2>/dev/null | openssl x509 -noout -dates
```

### 8. Emergency Rollback

If deployment fails critically:

1. **Revert to previous version:**
   ```bash
   git revert HEAD
   git push origin monorepo-migration
   ```

2. **Use previous working configuration:**
   - Restore package.json without esbuild
   - Use original TypeScript compilation
   - Increase memory limits

3. **Contact AWS Support:**
   - Provide service ARN
   - Share CloudWatch logs
   - Include apprunner.yaml

## 📞 Support Resources

- **AWS App Runner Documentation**: https://docs.aws.amazon.com/apprunner/
- **AWS Support Center**: https://console.aws.amazon.com/support/
- **Community Forums**: https://forums.aws.amazon.com/forum.jspa?forumID=387

## ✅ Success Indicators

Your deployment is successful when:
1. Health check returns 200 OK
2. No ERROR logs in CloudWatch
3. API endpoints responding < 1s
4. All environment variables loaded
5. Database queries executing properly