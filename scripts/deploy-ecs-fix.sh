#!/bin/bash
set -e

echo "🚀 Fixed ECS Deployment for AIGlossaryPro API"
echo "==========================================="

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

# Load environment variables from .env
if [ -f ".env" ]; then
    echo -e "${YELLOW}Loading configuration from .env...${NC}"
    set -a
    source .env
    set +a
else
    echo -e "${RED}ERROR: .env file not found${NC}"
    exit 1
fi

# Validate required environment variables
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "OPENAI_API_KEY")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}ERROR: $var is not set in .env${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required environment variables found${NC}"

# Step 1: Create new task definition with ALL environment variables
echo -e "\n${YELLOW}1️⃣ Creating new task definition with complete environment...${NC}"

cat > task-definition-fixed.json << EOF
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::927289246324:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::927289246324:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "aiglossarypro-api",
      "image": "${ECR_REPO}:fix-env",
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
        {"name": "LOG_LEVEL", "value": "${LOG_LEVEL:-info}"},
        {"name": "DATABASE_URL", "value": "${DATABASE_URL}"},
        {"name": "JWT_SECRET", "value": "${JWT_SECRET}"},
        {"name": "OPENAI_API_KEY", "value": "${OPENAI_API_KEY}"},
        {"name": "GROQ_API_KEY", "value": "${GROQ_API_KEY:-}"},
        {"name": "ANTHROPIC_API_KEY", "value": "${ANTHROPIC_API_KEY:-}"},
        {"name": "REDIS_URL", "value": "${REDIS_URL:-}"},
        {"name": "ADMIN_API_KEY", "value": "${ADMIN_API_KEY:-}"},
        {"name": "SIMPLE_AUTH", "value": "${SIMPLE_AUTH:-false}"},
        {"name": "SIMPLE_AUTH_ENABLED", "value": "${SIMPLE_AUTH_ENABLED:-false}"},
        {"name": "SIMPLE_AUTH_USERNAME", "value": "${SIMPLE_AUTH_USERNAME:-}"},
        {"name": "SIMPLE_AUTH_PASSWORD", "value": "${SIMPLE_AUTH_PASSWORD:-}"},
        {"name": "FIREBASE_PROJECT_ID", "value": "${FIREBASE_PROJECT_ID:-}"},
        {"name": "FIREBASE_CLIENT_EMAIL", "value": "${FIREBASE_CLIENT_EMAIL:-}"},
        {"name": "FIREBASE_PRIVATE_KEY_BASE64", "value": "${FIREBASE_PRIVATE_KEY_BASE64:-}"},
        {"name": "POSTHOG_API_KEY", "value": "${POSTHOG_API_KEY:-}"},
        {"name": "SESSION_SECRET", "value": "${SESSION_SECRET:-${JWT_SECRET}}"},
        {"name": "ALLOWED_ORIGINS", "value": "${ALLOWED_ORIGINS:-*}"},
        {"name": "MAX_FILE_SIZE", "value": "${MAX_FILE_SIZE:-10485760}"},
        {"name": "ENABLE_RATE_LIMITING", "value": "${ENABLE_RATE_LIMITING:-true}"},
        {"name": "RATE_LIMIT_WINDOW_MS", "value": "${RATE_LIMIT_WINDOW_MS:-900000}"},
        {"name": "RATE_LIMIT_MAX_REQUESTS", "value": "${RATE_LIMIT_MAX_REQUESTS:-100}"}
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

# Register task definition
NEW_TASK_DEF=$(aws ecs register-task-definition \
    --cli-input-json file://task-definition-fixed.json \
    --region $REGION \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo -e "${GREEN}✅ Task definition created: ${NEW_TASK_DEF##*/}${NC}"

# Step 2: Update service with new task definition
echo -e "\n${YELLOW}2️⃣ Updating ECS service...${NC}"

aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition "$NEW_TASK_DEF" \
    --desired-count 1 \
    --force-new-deployment \
    --region $REGION \
    --output json > /dev/null

echo -e "${GREEN}✅ Service update initiated${NC}"

# Step 3: Monitor deployment
echo -e "\n${YELLOW}3️⃣ Monitoring deployment...${NC}"

for i in {1..20}; do
    SERVICE_JSON=$(aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION \
        --output json)
    
    RUNNING_COUNT=$(echo "$SERVICE_JSON" | jq -r '.services[0].runningCount')
    DESIRED_COUNT=$(echo "$SERVICE_JSON" | jq -r '.services[0].desiredCount')
    PENDING_COUNT=$(echo "$SERVICE_JSON" | jq -r '.services[0].pendingCount')
    
    echo -e "  Attempt $i: Running=$RUNNING_COUNT, Desired=$DESIRED_COUNT, Pending=$PENDING_COUNT"
    
    # Get running task
    TASK_ARN=$(aws ecs list-tasks \
        --cluster $CLUSTER_NAME \
        --service-name $SERVICE_NAME \
        --desired-status RUNNING \
        --region $REGION \
        --query 'taskArns[0]' \
        --output text 2>/dev/null)
    
    if [ ! -z "$TASK_ARN" ] && [ "$TASK_ARN" != "None" ]; then
        TASK_STATUS=$(aws ecs describe-tasks \
            --cluster $CLUSTER_NAME \
            --tasks "$TASK_ARN" \
            --region $REGION \
            --query 'tasks[0].lastStatus' \
            --output text)
        
        echo "  Task status: $TASK_STATUS"
        
        if [ "$TASK_STATUS" = "RUNNING" ] && [ "$RUNNING_COUNT" = "$DESIRED_COUNT" ]; then
            echo -e "${GREEN}✅ Deployment successful!${NC}"
            
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
                
                if [ "$PUBLIC_IP" != "N/A" ]; then
                    echo -e "\n${GREEN}Service is running!${NC}"
                    echo "Public IP: $PUBLIC_IP"
                    echo ""
                    echo "Access URLs:"
                    echo "  API: http://$PUBLIC_IP:8080"
                    echo "  Health: http://$PUBLIC_IP:8080/health"
                    echo "  Docs: http://$PUBLIC_IP:8080/api-docs"
                    
                    # Test health endpoint
                    echo -e "\n${YELLOW}Testing health endpoint...${NC}"
                    sleep 10
                    if curl -f -s "http://$PUBLIC_IP:8080/health"; then
                        echo -e "\n${GREEN}✅ Health check passed!${NC}"
                    else
                        echo -e "\n${YELLOW}⚠️ Health check not responding yet${NC}"
                    fi
                fi
            fi
            break
        fi
    fi
    
    if [ $i -eq 20 ]; then
        echo -e "${YELLOW}⚠️ Deployment may still be in progress${NC}"
    fi
    
    sleep 15
done

# Clean up
rm -f task-definition-fixed.json

echo -e "\n${GREEN}Deployment complete!${NC}"
echo ""
echo "Monitor logs with:"
echo "  aws logs tail /ecs/aiglossarypro-api --follow"