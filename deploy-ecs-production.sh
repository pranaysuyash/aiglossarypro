#!/bin/bash
set -e

echo "🚀 Production ECS Deployment for AIGlossaryPro"
echo "==========================================="

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

echo -e "${BLUE}Configuration:${NC}"
echo "  Account: $ACCOUNT_ID"
echo "  Region: $REGION"
echo "  Cluster: $CLUSTER_NAME"
echo "  Service: $SERVICE_NAME"

# Step 1: Use the latest working image
echo -e "\n${YELLOW}1️⃣ Using ECR image...${NC}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
echo -e "${GREEN}✅ Using image: ${ECR_REPO}:${IMAGE_TAG}${NC}"

# Step 2: Create task definition with existing secrets
echo -e "\n${YELLOW}2️⃣ Creating task definition...${NC}"

cat > task-definition-prod.json << EOF
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
      "image": "${ECR_REPO}:${IMAGE_TAG}",
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
        {"name": "SIMPLE_AUTH", "value": "false"},
        {"name": "SIMPLE_AUTH_ENABLED", "value": "false"},
        {"name": "FIREBASE_PROJECT_ID", "value": "aiglossarypro"},
        {"name": "FIREBASE_CLIENT_EMAIL", "value": "firebase-adminsdk-fbsvc@aiglossarypro.iam.gserviceaccount.com"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/database-HqtDrG"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/jwt-JGrrVJ"},
        {"name": "OPENAI_API_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/openai-0ltiKK"},
        {"name": "SESSION_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/session-g7vUMO"},
        {"name": "FIREBASE_PRIVATE_KEY_BASE64", "valueFrom": "arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/firebase-private-key-guP8N3"}
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

# Ensure IAM role has access to secrets
echo -e "${YELLOW}Updating IAM permissions...${NC}"
cat > secrets-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": [
                "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/*"
            ]
        }
    ]
}
EOF

aws iam put-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-name AIGlossaryProSecretsPolicy \
    --policy-document file://secrets-policy.json \
    --no-cli-pager 2>/dev/null || echo "Policy already attached"

rm -f secrets-policy.json

# Register task definition
NEW_TASK_DEF=$(aws ecs register-task-definition \
    --cli-input-json file://task-definition-prod.json \
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
echo "This typically takes 2-3 minutes..."

DEPLOYMENT_SUCCESS=false
PUBLIC_IP=""

for i in {1..40}; do
    # Get service status
    SERVICE_JSON=$(aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION \
        --output json 2>/dev/null)
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to get service status${NC}"
        break
    fi
    
    RUNNING_COUNT=$(echo "$SERVICE_JSON" | jq -r '.services[0].runningCount // 0')
    DESIRED_COUNT=$(echo "$SERVICE_JSON" | jq -r '.services[0].desiredCount // 0')
    
    echo -ne "\r  Progress: Running=$RUNNING_COUNT/$DESIRED_COUNT (attempt $i/40)"
    
    # Check for running task
    TASK_ARN=$(aws ecs list-tasks \
        --cluster $CLUSTER_NAME \
        --service-name $SERVICE_NAME \
        --desired-status RUNNING \
        --region $REGION \
        --query 'taskArns[0]' \
        --output text 2>/dev/null)
    
    if [ ! -z "$TASK_ARN" ] && [ "$TASK_ARN" != "None" ] && [ "$RUNNING_COUNT" = "$DESIRED_COUNT" ] && [ "$RUNNING_COUNT" -gt 0 ]; then
        # Get task details
        TASK_DETAILS=$(aws ecs describe-tasks \
            --cluster $CLUSTER_NAME \
            --tasks "$TASK_ARN" \
            --region $REGION 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            # Get public IP
            ENI_ID=$(echo "$TASK_DETAILS" | jq -r '.tasks[0].attachments[0].details[] | select(.name=="networkInterfaceId").value // empty')
            
            if [ ! -z "$ENI_ID" ]; then
                PUBLIC_IP=$(aws ec2 describe-network-interfaces \
                    --network-interface-ids "$ENI_ID" \
                    --region $REGION \
                    --query 'NetworkInterfaces[0].Association.PublicIp' \
                    --output text 2>/dev/null || echo "")
                
                if [ ! -z "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
                    DEPLOYMENT_SUCCESS=true
                    break
                fi
            fi
        fi
    fi
    
    # Check for failed tasks
    if [ $((i % 5)) -eq 0 ]; then
        STOPPED_TASK=$(aws ecs list-tasks \
            --cluster $CLUSTER_NAME \
            --service-name $SERVICE_NAME \
            --desired-status STOPPED \
            --region $REGION \
            --query 'taskArns[0]' \
            --output text 2>/dev/null)
        
        if [ ! -z "$STOPPED_TASK" ] && [ "$STOPPED_TASK" != "None" ]; then
            echo -e "\n${YELLOW}Checking stopped task...${NC}"
            STOP_INFO=$(aws ecs describe-tasks \
                --cluster $CLUSTER_NAME \
                --tasks "$STOPPED_TASK" \
                --region $REGION \
                --query 'tasks[0].{stopCode: stopCode, stoppedReason: stoppedReason}' 2>/dev/null)
            
            if [ ! -z "$STOP_INFO" ]; then
                echo -e "${YELLOW}Task stopped: $(echo $STOP_INFO | jq -r '.stoppedReason // "Unknown"')${NC}"
            fi
        fi
    fi
    
    sleep 10
done

# Clean up
rm -f task-definition-prod.json

echo ""
if [ "$DEPLOYMENT_SUCCESS" = true ]; then
    echo -e "\n${GREEN}🎉 Deployment Successful!${NC}"
    echo "========================"
    echo -e "${BLUE}Public IP:${NC} $PUBLIC_IP"
    echo ""
    echo -e "${GREEN}Access URLs:${NC}"
    echo "  🌐 API: http://$PUBLIC_IP:8080"
    echo "  🏥 Health: http://$PUBLIC_IP:8080/health"
    echo "  📚 API Docs: http://$PUBLIC_IP:8080/api-docs"
    echo "  🔍 Search: http://$PUBLIC_IP:8080/api/search"
    
    # Test health endpoint
    echo -e "\n${YELLOW}Testing health endpoint...${NC}"
    sleep 10
    
    HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "http://$PUBLIC_IP:8080/health" 2>/dev/null || echo "000")
    HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
        echo "$HEALTH_RESPONSE" | head -n-1 | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
    else
        echo -e "${YELLOW}⚠️ Health check returned: $HTTP_CODE${NC}"
        echo "The service may still be initializing. Try again in a minute."
    fi
else
    echo -e "\n${YELLOW}⚠️ Deployment may still be in progress${NC}"
    echo "The service might need more time to stabilize."
    echo ""
    echo "Check status with:"
    echo "  aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION"
    echo ""
    echo "View logs with:"
    echo "  aws logs tail /ecs/aiglossarypro-api --follow --region $REGION"
fi

echo -e "\n${BLUE}📋 Deployment Summary:${NC}"
echo "  Task Definition: ${NEW_TASK_DEF##*/}"
echo "  Cluster: $CLUSTER_NAME"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"

echo -e "\n${BLUE}🛠️ Management Commands:${NC}"
echo "  Status: aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION | jq '.services[0] | {status, runningCount, desiredCount}'"
echo "  Logs: aws logs tail /ecs/aiglossarypro-api --follow --region $REGION"
echo "  Stop: aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --desired-count 0 --region $REGION"
echo "  Scale: aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --desired-count 2 --region $REGION"