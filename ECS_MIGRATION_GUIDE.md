# ECS Fargate Migration Guide for AIGlossaryPro

**Date**: August 1, 2025  
**Purpose**: Step-by-step guide to migrate from App Runner to ECS Fargate

---

## Quick Start Commands

```bash
# Step 1: Delete App Runner Service (after this guide is complete)
aws apprunner delete-service \
  --service-arn arn:aws:apprunner:us-east-1:927289246324:service/aiglossarypro-main-final-clean/4db2eecdc13d40bcab11faf26674f419 \
  --region us-east-1

# Step 2: Build and push Docker image
docker build -t aiglossarypro-api ./apps/api
aws ecr create-repository --repository-name aiglossarypro-api --region us-east-1
docker tag aiglossarypro-api:latest 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:latest
docker push 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:latest

# Step 3: Deploy frontend to S3
cd apps/web && npm run build
aws s3 mb s3://aiglossarypro-frontend
aws s3 sync dist/ s3://aiglossarypro-frontend --delete
```

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│   S3 Bucket     │
│  (CDN + HTTPS)  │     │   (Frontend)    │
└────────┬────────┘     └─────────────────┘
         │
         │ /api/*
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Load Balancer  │────▶│  ECS Fargate    │
│    (HTTPS)      │     │   (Backend)     │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   RDS/Neon DB   │
                        │  (PostgreSQL)   │
                        └─────────────────┘
```

---

## Step 1: Create Dockerfile

Create `apps/api/Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy workspace packages
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build workspace packages
RUN pnpm --filter @aiglossarypro/shared run build && \
    pnpm --filter @aiglossarypro/database run build && \
    pnpm --filter @aiglossarypro/auth run build && \
    pnpm --filter @aiglossarypro/config run build

# Build API
WORKDIR /app/apps/api
RUN NODE_ENV=production pnpm run build

# Production stage
FROM node:18-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy built application
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

WORKDIR /app/apps/api

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start command
CMD ["node", "dist/index.js"]
```

---

## Step 2: ECS Task Definition

Create `ecs-task-definition.json`:

```json
{
  "family": "aiglossarypro-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::927289246324:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::927289246324:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "8080"},
        {"name": "BASE_URL", "value": "https://aiglossarypro.com"},
        {"name": "EMAIL_ENABLED", "value": "true"},
        {"name": "SIMPLE_AUTH_ENABLED", "value": "true"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/database"},
        {"name": "SESSION_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/session"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/jwt"},
        {"name": "FIREBASE_PROJECT_ID", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/firebase:project_id"},
        {"name": "FIREBASE_CLIENT_EMAIL", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/firebase:client_email"},
        {"name": "FIREBASE_PRIVATE_KEY_BASE64", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/firebase:private_key"},
        {"name": "RESEND_API_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/resend"},
        {"name": "OPENAI_API_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/openai"},
        {"name": "GUMROAD_ACCESS_TOKEN", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/gumroad:access_token"},
        {"name": "GUMROAD_APPLICATION_ID", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/gumroad:app_id"},
        {"name": "GUMROAD_APPLICATION_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/gumroad:app_secret"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/aiglossarypro-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 30
      }
    }
  ]
}
```

---

## Step 3: Start/Stop Scripts

### start-backend.sh
```bash
#!/bin/bash
echo "🚀 Starting AIGlossaryPro Backend..."

# Update service to desired count 1
aws ecs update-service \
  --cluster aiglossarypro \
  --service aiglossarypro-api \
  --desired-count 1 \
  --region us-east-1

echo "✅ Backend starting... Check ECS console for status"
echo "📊 View logs: aws logs tail /ecs/aiglossarypro-api --follow"
```

### stop-backend.sh
```bash
#!/bin/bash
echo "🛑 Stopping AIGlossaryPro Backend..."

# Update service to desired count 0
aws ecs update-service \
  --cluster aiglossarypro \
  --service aiglossarypro-api \
  --desired-count 0 \
  --region us-east-1

echo "✅ Backend stopping... This saves ~$10-20/month"
```

---

## Step 4: Frontend Deployment Script

Create `deploy-frontend.sh`:

```bash
#!/bin/bash
echo "🚀 Deploying AIGlossaryPro Frontend..."

# Build frontend
cd apps/web
npm run build

# Upload to S3
aws s3 sync dist/ s3://aiglossarypro-frontend --delete

# Invalidate CloudFront cache (if exists)
DISTRIBUTION_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='aiglossarypro-frontend.s3.amazonaws.com'].Id" --output text)
if [ ! -z "$DISTRIBUTION_ID" ]; then
  aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
  echo "✅ CloudFront cache invalidated"
fi

echo "✅ Frontend deployed!"
```

---

## Step 5: Complete Setup Commands

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name aiglossarypro-api --region us-east-1

# 2. Build and push Docker image
cd /path/to/aiglossarypro
docker build -f apps/api/Dockerfile -t aiglossarypro-api .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 927289246324.dkr.ecr.us-east-1.amazonaws.com
docker tag aiglossarypro-api:latest 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:latest
docker push 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:latest

# 3. Create ECS cluster
aws ecs create-cluster --cluster-name aiglossarypro --region us-east-1

# 4. Create log group
aws logs create-log-group --log-group-name /ecs/aiglossarypro-api --region us-east-1

# 5. Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json --region us-east-1

# 6. Create ALB and target group (requires VPC and subnets)
# This is more complex - can provide detailed commands if needed

# 7. Create ECS service
aws ecs create-service \
  --cluster aiglossarypro \
  --service-name aiglossarypro-api \
  --task-definition aiglossarypro-api:1 \
  --desired-count 0 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region us-east-1
```

---

## Cost Optimization Tips

1. **Backend (ECS Fargate)**
   - Stop when not in use: `./stop-backend.sh`
   - Start when needed: `./start-backend.sh`
   - Cost when stopped: $0
   - Cost when running: ~$10-20/month

2. **Frontend (S3 + CloudFront)**
   - Always available (static files)
   - Cost: < $5/month for low traffic
   - No need to stop/start

3. **Database (Neon)**
   - Already serverless with auto-suspend
   - Cost: $0 when inactive

4. **Total Monthly Cost**
   - Development: ~$5 (frontend only)
   - Active testing: ~$25 (all services)
   - Production: ~$50-100 (based on traffic)

---

## Troubleshooting

### Container won't start
```bash
# Check logs
aws logs tail /ecs/aiglossarypro-api --follow

# Check task status
aws ecs describe-tasks --cluster aiglossarypro --tasks <task-arn>
```

### Environment variables not working
```bash
# Verify secrets exist
aws secretsmanager get-secret-value --secret-id aiglossarypro/database

# Check task definition
aws ecs describe-task-definition --task-definition aiglossarypro-api
```

### Can't access the API
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxx

# Check ALB health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:...
```

---

## Next Steps

1. **Immediate Actions**
   - [ ] Create Dockerfile
   - [ ] Set up ECR repository
   - [ ] Store secrets in AWS Secrets Manager
   - [ ] Create ECS cluster and service

2. **Testing**
   - [ ] Deploy and test API endpoints
   - [ ] Verify environment variables
   - [ ] Test start/stop scripts
   - [ ] Monitor costs

3. **Cleanup**
   - [ ] Delete all App Runner services
   - [ ] Remove App Runner specific configs
   - [ ] Update documentation

---

**Ready to proceed?** This setup gives you:
- ✅ Full control over deployment
- ✅ Easy start/stop for cost management
- ✅ Better debugging with CloudWatch logs
- ✅ Production-ready architecture
- ✅ No more App Runner mysteries!