# Creating a New AWS App Runner Service

Since the current service failed to create, here's how to create a new one with the correct configuration:

## Step 1: Delete Failed Service (Optional)

```bash
# Delete the failed service
aws apprunner delete-service \
  --service-arn "arn:aws:apprunner:us-east-1:927289246324:service/aiglossarypro-api-debug/bd3ad633f9044f16a151e1a0425a4176"
```

## Step 2: Create New Service via Console (Recommended)

1. **Go to AWS App Runner Console**
   - https://console.aws.amazon.com/apprunner

2. **Click "Create service"**

3. **Source Configuration**
   - Source: **GitHub**
   - Connection: Use existing or create new
   - Repository: `pranaysuyash/aiglossarypro`
   - Branch: `monorepo-migration`
   - Source directory: `/apps/api` ⚠️ **IMPORTANT**
   - Configuration file: `apprunner.yaml`

4. **Build Settings**
   - Use configuration file

5. **Service Settings**
   - Service name: `aiglossarypro-api`
   - CPU: 0.25 vCPU (minimum)
   - Memory: 0.5 GB (minimum)

6. **Environment Variables** (Add these)
   ```
   NODE_ENV=production
   PORT=8080
   DATABASE_URL=<your-database-url>
   JWT_SECRET=<generate-32-char-secret>
   SESSION_SECRET=<generate-32-char-secret>
   FIREBASE_PROJECT_ID=<your-firebase-project>
   FIREBASE_CLIENT_EMAIL=<your-firebase-email>
   FIREBASE_PRIVATE_KEY_BASE64=<base64-encoded-key>
   ```

7. **Auto-scaling**
   - Min: 1
   - Max: 10
   - Target CPU: 70%

8. **Health Check**
   - Path: `/health`
   - Interval: 10 seconds
   - Timeout: 5 seconds

## Step 3: Create Service via CLI (Alternative)

```bash
# First, create the configuration
cat > create-service.json << 'EOF'
{
  "ServiceName": "aiglossarypro-api",
  "SourceConfiguration": {
    "CodeRepository": {
      "RepositoryUrl": "https://github.com/pranaysuyash/aiglossarypro",
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "monorepo-migration"
      },
      "SourceDirectory": "/apps/api",
      "CodeConfiguration": {
        "ConfigurationSource": "REPOSITORY"
      }
    },
    "AutoDeploymentsEnabled": true
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB",
    "InstanceRoleArn": "arn:aws:iam::927289246324:role/AppRunnerECRAccessRole"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 3
  }
}
EOF

# Create the service
aws apprunner create-service --cli-input-json file://create-service.json
```

## Step 4: Fix Common Issues

### If build fails with "working directory not found"
The issue is likely the source directory. Make sure:
- Source directory is set to `/apps/api`
- The apprunner.yaml is in `/apps/api/apprunner.yaml`

### If build times out
This should not happen with esbuild, but if it does:
1. Check CloudWatch logs
2. Increase instance size temporarily
3. Verify esbuild is running (check build logs)

### If "module not found" errors
1. Ensure pnpm workspaces are installed
2. Check that workspace packages build first
3. Verify package.deploy.json is being used

## Step 5: Monitor Deployment

```bash
# Watch the deployment
./monitor-deployment.sh

# Or check manually
aws apprunner describe-service \
  --service-arn <new-service-arn> \
  --query "Service.Status"
```

## Step 6: Verify Deployment

Once status is "RUNNING":

```bash
# Get the service URL
SERVICE_URL=$(aws apprunner describe-service \
  --service-arn <new-service-arn> \
  --query "Service.ServiceUrl" \
  --output text)

# Test it
export APP_URL="https://$SERVICE_URL"
./quick-test.sh
```

## Important Configuration Details

### apprunner.yaml Location
Must be at: `/apps/api/apprunner.yaml`

### Build Process
1. Uses pnpm (installed in pre-build)
2. Switches to CommonJS via package.deploy.json
3. Builds with esbuild (fast!)
4. Output to dist/index.js

### Runtime
- Node.js 18
- Port 8080 (required)
- CommonJS modules

## If Still Failing

1. **Check AWS Console Logs**
   - Go to CloudWatch
   - Look for `/aws/apprunner/<service-name>/service`
   - Check build and application logs

2. **Simplify First**
   - Try without workspace packages
   - Use a simple health check only
   - Add complexity incrementally

3. **Contact AWS Support**
   - Provide service ARN
   - Include apprunner.yaml
   - Share error logs