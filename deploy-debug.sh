#!/bin/bash

# Debug deployment script using node:20-slim and extensive logging
# This follows ChatGPT's recommendations for troubleshooting

set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="debug-slim-${TIMESTAMP}"
REPO_URI="927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api"

echo "🔍 DEBUG DEPLOYMENT - Using node:20-slim with debug wrapper"
echo "Tag: ${IMAGE_TAG}"
echo "Time: ${TIMESTAMP}"

# Step 1: Build debug image with node:20-slim
echo ""
echo "1️⃣ Building debug Docker image with node:20-slim..."
docker build \
  --platform linux/amd64 \
  -f Dockerfile.debug \
  -t ${IMAGE_TAG} \
  --no-cache \
  .

echo "✅ Image built successfully"

# Step 2: Test locally first
echo ""
echo "2️⃣ Testing container locally..."
docker run --rm \
  -e NODE_ENV=production \
  -e PORT=3001 \
  ${IMAGE_TAG} \
  node -e "console.log('Container can execute Node.js'); process.exit(0)"

echo "✅ Local test passed"

# Step 3: Login to ECR
echo ""
echo "3️⃣ Logging in to ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${REPO_URI}

# Step 4: Tag and push
echo ""
echo "4️⃣ Pushing to ECR..."
docker tag ${IMAGE_TAG} ${REPO_URI}:${IMAGE_TAG}
docker push ${REPO_URI}:${IMAGE_TAG}
echo "✅ Image pushed: ${REPO_URI}:${IMAGE_TAG}"

# Step 5: Create task definition with enhanced logging
echo ""
echo "5️⃣ Creating task definition with debug configuration..."
cat > task-def-debug.json << EOF
{
  "family": "aiglossarypro-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::927289246324:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::927289246324:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "${REPO_URI}:${IMAGE_TAG}",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3001"},
        {"name": "AWS_REGION", "value": "us-east-1"},
        {"name": "DEBUG", "value": "*"},
        {"name": "LOG_LEVEL", "value": "debug"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/db-connection-gwHIjI:DATABASE_URL::"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/api/health || exit 1"],
        "interval": 30,
        "timeout": 10,
        "retries": 5,
        "startPeriod": 120
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/aiglossarypro-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "debug"
        }
      }
    }
  ]
}
EOF

# Step 6: Register task definition
echo ""
echo "6️⃣ Registering task definition..."
TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json file://task-def-debug.json --query 'taskDefinition.taskDefinitionArn' --output text)
echo "✅ Task definition: ${TASK_DEF_ARN}"

# Step 7: Update service
echo ""
echo "7️⃣ Updating ECS service..."
aws ecs update-service \
  --cluster aiglossarypro \
  --service aiglossarypro-api-production \
  --task-definition ${TASK_DEF_ARN} \
  --force-new-deployment \
  --query 'service.{ServiceName:serviceName,Status:status}' \
  --output json

echo "✅ Service update initiated"

# Step 8: Monitor deployment
echo ""
echo "8️⃣ Monitoring deployment and logs..."
echo "Waiting 30 seconds for task to start..."
sleep 30

# Check task status
echo ""
echo "Task Status:"
aws ecs describe-services \
  --cluster aiglossarypro \
  --services aiglossarypro-api-production \
  --query 'services[0].{DesiredCount:desiredCount,RunningCount:runningCount,PendingCount:pendingCount}' \
  --output table

# Get latest stopped task if any
echo ""
echo "Checking for stopped tasks..."
STOPPED_TASK=$(aws ecs list-tasks --cluster aiglossarypro --service-name aiglossarypro-api-production --desired-status STOPPED --max-results 1 --query 'taskArns[0]' --output text)

if [ "$STOPPED_TASK" != "None" ] && [ -n "$STOPPED_TASK" ]; then
    echo "Found stopped task: ${STOPPED_TASK}"
    aws ecs describe-tasks --cluster aiglossarypro --tasks ${STOPPED_TASK} --query 'tasks[0].{StoppedReason:stoppedReason,ExitCode:containers[0].exitCode}' --output json
fi

# Step 9: Get CloudWatch logs
echo ""
echo "9️⃣ Fetching CloudWatch logs (last 2 minutes)..."
aws logs tail /ecs/aiglossarypro-api --since 2m --filter-pattern "[DEBUG]" | head -50 || echo "No debug logs found yet"

# Step 10: Wait and check again
echo ""
echo "🔟 Waiting 60 seconds for full deployment..."
sleep 60

# Final status check
echo ""
echo "Final Deployment Status:"
STATUS=$(aws ecs describe-services \
  --cluster aiglossarypro \
  --services aiglossarypro-api-production \
  --query 'services[0].deployments[?status==`PRIMARY`].{RunningCount:runningCount,DesiredCount:desiredCount}' \
  --output json | jq -r '.[0] | "\(.RunningCount)/\(.DesiredCount)"')

echo "Status: ${STATUS}"

if [[ "${STATUS}" == "1/1" ]]; then
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    
    # Clear CloudFront cache
    echo "Clearing CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id ESF8YR50LSGU8 --paths "/api/*" --query 'Invalidation.Id' --output text
    
    # Test the API
    echo ""
    echo "Testing API endpoint:"
    curl -s https://d1m7nnfj3im4kp.cloudfront.net/api/health | jq '.' || echo "API test failed"
else
    echo "⚠️ Deployment may have issues - checking logs again..."
    aws logs tail /ecs/aiglossarypro-api --since 5m | head -100
fi

echo ""
echo "📝 Debug deployment complete. Check CloudWatch logs for [DEBUG] messages."
echo "Log group: /ecs/aiglossarypro-api"
echo "Stream prefix: debug"