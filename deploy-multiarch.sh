#!/bin/bash

# Multi-architecture deployment script for AWS ECS
# Builds for both amd64 and arm64 architectures

set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="multiarch-${TIMESTAMP}"
REPO_URI="927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api"

echo "🚀 Starting multi-architecture build and deployment"
echo "Tag: ${IMAGE_TAG}"

# Ensure buildx is available
echo "Setting up Docker buildx..."
docker buildx create --name multiarch-builder --use 2>/dev/null || docker buildx use multiarch-builder

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${REPO_URI}

# Build and push multi-arch image
echo "Building multi-architecture image (amd64 and arm64)..."
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ${REPO_URI}:${IMAGE_TAG} \
  -t ${REPO_URI}:latest \
  -f Dockerfile.simple \
  --push \
  .

echo "✅ Multi-arch image pushed successfully"
echo "Image: ${REPO_URI}:${IMAGE_TAG}"

# Update ECS task definition
echo "Updating ECS task definition..."
TASK_DEF_JSON=$(cat <<EOF
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
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        },
        {
          "name": "AWS_REGION",
          "value": "us-east-1"
        }
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
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/aiglossarypro-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF
)

# Register new task definition
echo "${TASK_DEF_JSON}" > /tmp/task-def-multiarch.json
TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json file:///tmp/task-def-multiarch.json --query 'taskDefinition.taskDefinitionArn' --output text)
echo "✅ Task definition registered: ${TASK_DEF_ARN}"

# Update ECS service
echo "Updating ECS service..."
aws ecs update-service \
  --cluster aiglossarypro \
  --service aiglossarypro-api-production \
  --task-definition ${TASK_DEF_ARN} \
  --force-new-deployment \
  --query 'service.{ServiceName:serviceName,Status:status}' \
  --output json

echo "✅ Service update initiated"

# Monitor deployment
echo "Monitoring deployment (will check every 30 seconds)..."
for i in {1..20}; do
  sleep 30
  STATUS=$(aws ecs describe-services \
    --cluster aiglossarypro \
    --services aiglossarypro-api-production \
    --query 'services[0].deployments[?status==`PRIMARY`].{RunningCount:runningCount,DesiredCount:desiredCount}' \
    --output json | jq -r '.[0] | "\(.RunningCount)/\(.DesiredCount)"')
  
  echo "Deployment status: ${STATUS}"
  
  if [[ "${STATUS}" == "1/1" ]]; then
    echo "✅ Deployment successful!"
    break
  fi
done

# Clear CloudFront cache
echo "Clearing CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id ESF8YR50LSGU8 \
  --paths "/api/*" \
  --query 'Invalidation.{Id:Id,Status:Status}' \
  --output json

echo "🎉 Deployment complete!"
echo "Test with: curl https://d1m7nnfj3im4kp.cloudfront.net/api/health"