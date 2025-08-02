#!/bin/bash
set -e

echo "🚀 Final ECS Deployment for AIGlossaryPro"
echo "========================================"

# Configuration
REGION="${AWS_REGION:-us-east-1}"
CLUSTER_NAME="aiglossarypro"
SERVICE_NAME="aiglossarypro-api"
TASK_FAMILY="aiglossarypro-api"
ECR_REPO="927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api"
ACCOUNT_ID="927289246324"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}Using configuration:${NC}"
echo "  Account: $ACCOUNT_ID"
echo "  Region: $REGION"
echo "  Cluster: $CLUSTER_NAME"
echo "  Service: $SERVICE_NAME"
echo "  ECR: $ECR_REPO"

# Step 1: Check latest image
echo -e "\n${YELLOW}1️⃣ Checking latest ECR image...${NC}"
LATEST_IMAGE=$(aws ecr describe-images --repository-name aiglossarypro-api --region $REGION --query 'sort_by(imageDetails,& imagePushedAt)[-1].imageTags[0]' --output text 2>/dev/null || echo "latest")
echo -e "${GREEN}✅ Using image tag: $LATEST_IMAGE${NC}"

# Step 2: Create optimized task definition
echo -e "\n${YELLOW}2️⃣ Creating task definition...${NC}"

# Get secret ARNs with proper suffixes
get_secret_arn() {
    local secret_name=$1
    aws secretsmanager describe-secret --secret-id "$secret_name" --region $REGION --query 'ARN' --output text 2>/dev/null || echo ""
}

cat > task-definition-final.json << EOF
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "api",
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
        {"name": "ALLOWED_ORIGINS", "value": "*"},
        {"name": "MAX_FILE_SIZE", "value": "10485760"},
        {"name": "ENABLE_RATE_LIMITING", "value": "true"},
        {"name": "RATE_LIMIT_WINDOW_MS", "value": "900000"},
        {"name": "RATE_LIMIT_MAX_REQUESTS", "value": "100"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "$(get_secret_arn 'aiglossarypro/database-url')"},
        {"name": "JWT_SECRET", "valueFrom": "$(get_secret_arn 'aiglossarypro/jwt-secret')"},
        {"name": "OPENAI_API_KEY", "valueFrom": "$(get_secret_arn 'aiglossarypro/openai-api-key')"},
        {"name": "SESSION_SECRET", "valueFrom": "$(get_secret_arn 'aiglossarypro/session-secret')"}
EOF

# Add optional secrets if they exist
for secret in "groq-api-key" "anthropic-api-key" "redis-url" "admin-api-key" "firebase-project-id" "firebase-client-email" "firebase-private-key-base64" "posthog-api-key"; do
    SECRET_ARN=$(get_secret_arn "aiglossarypro/$secret")
    if [ ! -z "$SECRET_ARN" ]; then
        ENV_NAME=$(echo "$secret" | tr '[:lower:]-' '[:upper:]_')
        echo "        ,{\"name\": \"$ENV_NAME\", \"valueFrom\": \"$SECRET_ARN\"}" >> task-definition-final.json
    fi
done

cat >> task-definition-final.json << EOF
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
    --cli-input-json file://task-definition-final.json \
    --region $REGION \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo -e "${GREEN}✅ Task definition created: ${NEW_TASK_DEF##*/}${NC}"

# Step 3: Update service
echo -e "\n${YELLOW}3️⃣ Updating ECS service...${NC}"

aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition "$NEW_TASK_DEF" \
    --desired-count 1 \
    --force-new-deployment \
    --region $REGION \
    --output json > /dev/null

echo -e "${GREEN}✅ Service update initiated${NC}"

# Step 4: Monitor deployment
echo -e "\n${YELLOW}4️⃣ Monitoring deployment...${NC}"
echo "This may take 2-3 minutes..."

DEPLOYMENT_SUCCESS=false

for i in {1..30}; do
    # Get service status
    SERVICE_JSON=$(aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION \
        --output json)
    
    RUNNING_COUNT=$(echo "$SERVICE_JSON" | jq -r '.services[0].runningCount')
    DESIRED_COUNT=$(echo "$SERVICE_JSON" | jq -r '.services[0].desiredCount')
    
    echo -ne "\r  Progress: Running=$RUNNING_COUNT/$DESIRED_COUNT"
    
    # Check for running task
    TASK_ARN=$(aws ecs list-tasks \
        --cluster $CLUSTER_NAME \
        --service-name $SERVICE_NAME \
        --desired-status RUNNING \
        --region $REGION \
        --query 'taskArns[0]' \
        --output text 2>/dev/null)
    
    if [ ! -z "$TASK_ARN" ] && [ "$TASK_ARN" != "None" ] && [ "$RUNNING_COUNT" = "$DESIRED_COUNT" ]; then
        echo -e "\n${GREEN}✅ Task is running!${NC}"
        
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
                --output text 2>/dev/null || echo "")
            
            if [ ! -z "$PUBLIC_IP" ]; then
                DEPLOYMENT_SUCCESS=true
                break
            fi
        fi
    fi
    
    sleep 10
done

# Clean up
rm -f task-definition-final.json

if [ "$DEPLOYMENT_SUCCESS" = true ]; then
    echo -e "\n${GREEN}🎉 Deployment Successful!${NC}"
    echo "========================"
    echo -e "${BLUE}Public IP:${NC} $PUBLIC_IP"
    echo ""
    echo -e "${GREEN}Access URLs:${NC}"
    echo "  🌐 API: http://$PUBLIC_IP:8080"
    echo "  🏥 Health: http://$PUBLIC_IP:8080/health"
    echo "  📚 API Docs: http://$PUBLIC_IP:8080/api-docs"
    
    # Test health endpoint
    echo -e "\n${YELLOW}Testing health endpoint...${NC}"
    sleep 15
    if curl -f -s -o /dev/null --connect-timeout 5 "http://$PUBLIC_IP:8080/health"; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
        echo ""
        echo "Health response:"
        curl -s "http://$PUBLIC_IP:8080/health" | jq . || curl -s "http://$PUBLIC_IP:8080/health"
    else
        echo -e "${YELLOW}⚠️ Health endpoint not ready yet. Try again in a minute.${NC}"
    fi
    
    echo -e "\n${GREEN}Next Steps:${NC}"
    echo "1. Test your API endpoints"
    echo "2. Configure a load balancer for production use"
    echo "3. Set up a custom domain"
    echo "4. Enable auto-scaling"
else
    echo -e "\n${YELLOW}⚠️ Deployment is still in progress${NC}"
    echo "Check the status with:"
    echo "  aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME"
    echo ""
    echo "View logs with:"
    echo "  aws logs tail /ecs/aiglossarypro-api --follow"
fi

echo -e "\n${BLUE}Useful Commands:${NC}"
echo "📊 Monitor service: aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION"
echo "📝 View logs: aws logs tail /ecs/aiglossarypro-api --follow --region $REGION"
echo "🔄 Force new deployment: aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --force-new-deployment --region $REGION"
echo "⏸️  Stop service: aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --desired-count 0 --region $REGION"