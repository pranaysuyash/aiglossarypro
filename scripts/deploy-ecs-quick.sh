#!/bin/bash
set -e

echo "🚀 Quick ECS Deployment for AIGlossaryPro API"
echo "============================================"

# Configuration
REGION="${AWS_REGION:-us-east-1}"
CLUSTER_NAME="aiglossarypro"
SERVICE_NAME="aiglossarypro-api"
TASK_FAMILY="aiglossarypro-api"
ECR_REPO="927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Using existing infrastructure:${NC}"
echo "  Cluster: $CLUSTER_NAME"
echo "  Service: $SERVICE_NAME"
echo "  ECR Repo: $ECR_REPO"

# Step 1: Check if multi-arch build completed
echo -e "\n${YELLOW}1️⃣ Checking if image exists in ECR...${NC}"
LATEST_IMAGE=$(aws ecr describe-images --repository-name aiglossarypro-api --region $REGION --query 'sort_by(imageDetails,& imagePushedAt)[-1].imageTags[0]' --output text 2>/dev/null || echo "none")

if [ "$LATEST_IMAGE" = "none" ]; then
    echo -e "${RED}No images found in ECR. Please run the full deploy script first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found image: $LATEST_IMAGE${NC}"

# Step 2: Update task definition with proper environment variables
echo -e "\n${YELLOW}2️⃣ Updating task definition...${NC}"

# Load environment variables from .env if exists
if [ -f ".env" ]; then
    echo "Loading configuration from .env..."
    set -a
    source .env
    set +a
fi

# Create updated task definition
cat > task-def-update.json << EOF
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::927289246324:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "aiglossarypro-api",
      "image": "${ECR_REPO}:${LATEST_IMAGE}",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "8080"},
        {"name": "LOG_LEVEL", "value": "info"},
        {"name": "DATABASE_URL", "value": "${DATABASE_URL}"},
        {"name": "JWT_SECRET", "value": "${JWT_SECRET}"},
        {"name": "OPENAI_API_KEY", "value": "${OPENAI_API_KEY}"},
        {"name": "GROQ_API_KEY", "value": "${GROQ_API_KEY:-}"},
        {"name": "ANTHROPIC_API_KEY", "value": "${ANTHROPIC_API_KEY:-}"},
        {"name": "REDIS_URL", "value": "${REDIS_URL:-}"},
        {"name": "ADMIN_API_KEY", "value": "${ADMIN_API_KEY:-}"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/aiglossarypro-api",
          "awslogs-region": "$REGION",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 10,
        "retries": 5,
        "startPeriod": 60
      }
    }
  ]
}
EOF

# Register new task definition
NEW_TASK_DEF=$(aws ecs register-task-definition \
    --cli-input-json file://task-def-update.json \
    --region $REGION \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo -e "${GREEN}✅ Task definition updated: ${NEW_TASK_DEF##*/}${NC}"

# Step 3: Update service
echo -e "\n${YELLOW}3️⃣ Updating ECS service...${NC}"

# First, ensure the service has desired count of 1
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --desired-count 1 \
    --task-definition "$NEW_TASK_DEF" \
    --force-new-deployment \
    --region $REGION \
    --output json > /dev/null

echo -e "${GREEN}✅ Service update initiated${NC}"

# Step 4: Monitor deployment
echo -e "\n${YELLOW}4️⃣ Monitoring deployment progress...${NC}"
echo "This usually takes 2-3 minutes..."

for i in {1..20}; do
    # Get service details
    SERVICE_JSON=$(aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION \
        --output json)
    
    RUNNING_COUNT=$(echo "$SERVICE_JSON" | jq -r '.services[0].runningCount')
    DESIRED_COUNT=$(echo "$SERVICE_JSON" | jq -r '.services[0].desiredCount')
    PENDING_COUNT=$(echo "$SERVICE_JSON" | jq -r '.services[0].pendingCount')
    
    echo -e "  Status: Running=$RUNNING_COUNT, Desired=$DESIRED_COUNT, Pending=$PENDING_COUNT"
    
    # Check deployments
    DEPLOYMENTS=$(echo "$SERVICE_JSON" | jq -r '.services[0].deployments | length')
    if [ "$DEPLOYMENTS" -gt 1 ]; then
        echo "  Multiple deployments in progress..."
    fi
    
    if [ "$RUNNING_COUNT" = "$DESIRED_COUNT" ] && [ "$RUNNING_COUNT" -gt 0 ] && [ "$DEPLOYMENTS" = "1" ]; then
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        break
    fi
    
    if [ $i -eq 20 ]; then
        echo -e "${YELLOW}⚠️ Deployment may still be in progress. Check ECS console.${NC}"
    fi
    
    sleep 15
done

# Step 5: Get task details
echo -e "\n${YELLOW}5️⃣ Getting service details...${NC}"

# Get running task
TASK_ARN=$(aws ecs list-tasks \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_NAME \
    --desired-status RUNNING \
    --region $REGION \
    --query 'taskArns[0]' \
    --output text)

if [ ! -z "$TASK_ARN" ] && [ "$TASK_ARN" != "None" ]; then
    # Get task details
    TASK_DETAILS=$(aws ecs describe-tasks \
        --cluster $CLUSTER_NAME \
        --tasks "$TASK_ARN" \
        --region $REGION)
    
    # Get public IP
    ENI_ID=$(echo "$TASK_DETAILS" | jq -r '.tasks[0].attachments[0].details[] | select(.name=="networkInterfaceId").value')
    
    if [ ! -z "$ENI_ID" ] && [ "$ENI_ID" != "null" ]; then
        PUBLIC_IP=$(aws ec2 describe-network-interfaces \
            --network-interface-ids "$ENI_ID" \
            --region $REGION \
            --query 'NetworkInterfaces[0].Association.PublicIp' \
            --output text 2>/dev/null || echo "N/A")
    else
        PUBLIC_IP="N/A"
    fi
else
    PUBLIC_IP="N/A"
fi

# Clean up
rm -f task-def-update.json

# Summary
echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo "========================"
echo -e "Cluster: ${BLUE}$CLUSTER_NAME${NC}"
echo -e "Service: ${BLUE}$SERVICE_NAME${NC}"
echo -e "Task Definition: ${BLUE}${NEW_TASK_DEF##*/}${NC}"

if [ "$PUBLIC_IP" != "N/A" ] && [ ! -z "$PUBLIC_IP" ]; then
    echo -e "\n${GREEN}Access URLs:${NC}"
    echo "  API: http://$PUBLIC_IP:8080"
    echo "  Health: http://$PUBLIC_IP:8080/health"
    echo "  Docs: http://$PUBLIC_IP:8080/api-docs"
fi

echo -e "\n${YELLOW}Useful commands:${NC}"
echo "  View logs: aws logs tail /ecs/aiglossarypro-api --follow"
echo "  Check service: aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME"
echo "  Stop service: aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --desired-count 0"

echo -e "\n${BLUE}Monitor in console:${NC}"
echo "  https://console.aws.amazon.com/ecs/home?region=$REGION#/clusters/$CLUSTER_NAME/services/$SERVICE_NAME/tasks"