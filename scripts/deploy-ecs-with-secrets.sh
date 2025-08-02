#!/bin/bash
set -e

echo "🚀 ECS Deployment with AWS Secrets Manager"
echo "========================================="

# Configuration
REGION="${AWS_REGION:-us-east-1}"
CLUSTER_NAME="aiglossarypro"
SERVICE_NAME="aiglossarypro-api"
TASK_FAMILY="aiglossarypro-api"
ECR_REPO="927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Checking prerequisites...${NC}"

# Step 1: Setup secrets if needed
echo -e "\n${YELLOW}1️⃣ Setting up AWS Secrets Manager...${NC}"
./scripts/setup-secrets.sh

# Step 2: Ensure task execution role has permission to access secrets
echo -e "\n${YELLOW}2️⃣ Updating IAM role permissions...${NC}"

# Create policy for Secrets Manager access
cat > secrets-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "secretsmanager:GetSecretValue"
            ],
            "Resource": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/*"
        }
    ]
}
EOF

# Attach policy to execution role
aws iam put-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-name AIGlossaryProSecretsAccess \
    --policy-document file://secrets-policy.json \
    --no-cli-pager 2>/dev/null || echo "Policy already exists"

rm -f secrets-policy.json

echo -e "${GREEN}✅ IAM permissions configured${NC}"

# Step 3: Create task definition with secrets
echo -e "\n${YELLOW}3️⃣ Creating task definition with secrets...${NC}"

cat > task-definition-secrets.json << EOF
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "aiglossarypro-api",
      "image": "${ECR_REPO}:latest",
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
        {"name": "RATE_LIMIT_MAX_REQUESTS", "value": "100"},
        {"name": "SIMPLE_AUTH", "value": "false"},
        {"name": "SIMPLE_AUTH_ENABLED", "value": "false"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/database-url"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/jwt-secret"},
        {"name": "OPENAI_API_KEY", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/openai-api-key"},
        {"name": "GROQ_API_KEY", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/groq-api-key"},
        {"name": "ANTHROPIC_API_KEY", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/anthropic-api-key"},
        {"name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/redis-url"},
        {"name": "ADMIN_API_KEY", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/admin-api-key"},
        {"name": "FIREBASE_CLIENT_EMAIL", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/firebase-client-email"},
        {"name": "FIREBASE_PROJECT_ID", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/firebase-project-id"},
        {"name": "FIREBASE_PRIVATE_KEY_BASE64", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/firebase-private-key-base64"},
        {"name": "POSTHOG_API_KEY", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/posthog-api-key"},
        {"name": "SESSION_SECRET", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/session-secret"}
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
    --cli-input-json file://task-definition-secrets.json \
    --region $REGION \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo -e "${GREEN}✅ Task definition created: ${NEW_TASK_DEF##*/}${NC}"

# Step 4: Update service
echo -e "\n${YELLOW}4️⃣ Updating ECS service...${NC}"

aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --task-definition "$NEW_TASK_DEF" \
    --desired-count 1 \
    --force-new-deployment \
    --region $REGION \
    --output json > /dev/null

echo -e "${GREEN}✅ Service update initiated${NC}"

# Step 5: Monitor deployment
echo -e "\n${YELLOW}5️⃣ Monitoring deployment...${NC}"

for i in {1..30}; do
    SERVICE_JSON=$(aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION \
        --output json)
    
    RUNNING_COUNT=$(echo "$SERVICE_JSON" | jq -r '.services[0].runningCount')
    DESIRED_COUNT=$(echo "$SERVICE_JSON" | jq -r '.services[0].desiredCount')
    PENDING_COUNT=$(echo "$SERVICE_JSON" | jq -r '.services[0].pendingCount')
    
    echo -e "  Attempt $i: Running=$RUNNING_COUNT, Desired=$DESIRED_COUNT, Pending=$PENDING_COUNT"
    
    # Check for running task
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
        
        if [ "$TASK_STATUS" = "RUNNING" ] && [ "$RUNNING_COUNT" = "$DESIRED_COUNT" ]; then
            echo -e "${GREEN}✅ Task is running!${NC}"
            
            # Get public IP
            TASK_DETAILS=$(aws ecs describe-tasks \
                --cluster $CLUSTER_NAME \
                --tasks "$TASK_ARN" \
                --region $REGION)
            
            ENI_ID=$(echo "$TASK_DETAILS" | jq -r '.tasks[0].attachments[0].details[] | select(.name=="networkInterfaceId").value')
            
            if [ ! -z "$ENI_ID" ] && [ "$ENI_ID" != "null" ]; then
                PUBLIC_IP=$(aws ec2 describe-network-interfaces \
                    --network-interface-ids "$ENI_ID" \
                    --region $REGION \
                    --query 'NetworkInterfaces[0].Association.PublicIp' \
                    --output text 2>/dev/null || echo "N/A")
                
                if [ "$PUBLIC_IP" != "N/A" ]; then
                    echo -e "\n${GREEN}🎉 Deployment successful!${NC}"
                    echo "========================"
                    echo "Public IP: $PUBLIC_IP"
                    echo ""
                    echo "Access URLs:"
                    echo "  API: http://$PUBLIC_IP:8080"
                    echo "  Health: http://$PUBLIC_IP:8080/health"
                    echo "  Docs: http://$PUBLIC_IP:8080/api-docs"
                    
                    # Test health endpoint
                    echo -e "\n${YELLOW}Testing health endpoint...${NC}"
                    sleep 10
                    if curl -f -s -o /dev/null "http://$PUBLIC_IP:8080/health"; then
                        echo -e "${GREEN}✅ Health check passed!${NC}"
                        curl -s "http://$PUBLIC_IP:8080/health" | jq .
                    else
                        echo -e "${YELLOW}⚠️ Health check not responding yet${NC}"
                    fi
                fi
            fi
            break
        fi
    fi
    
    # Check for failed tasks
    STOPPED_TASK=$(aws ecs list-tasks \
        --cluster $CLUSTER_NAME \
        --service-name $SERVICE_NAME \
        --desired-status STOPPED \
        --region $REGION \
        --query 'taskArns[0]' \
        --output text 2>/dev/null)
    
    if [ ! -z "$STOPPED_TASK" ] && [ "$STOPPED_TASK" != "None" ]; then
        echo -e "${YELLOW}Checking stopped task for errors...${NC}"
        STOP_REASON=$(aws ecs describe-tasks \
            --cluster $CLUSTER_NAME \
            --tasks "$STOPPED_TASK" \
            --region $REGION \
            --query 'tasks[0].stoppedReason' \
            --output text)
        
        if [ ! -z "$STOP_REASON" ]; then
            echo -e "${RED}Task stopped: $STOP_REASON${NC}"
        fi
    fi
    
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠️ Deployment taking longer than expected${NC}"
        echo "Check CloudWatch logs:"
        echo "  aws logs tail /ecs/aiglossarypro-api --follow"
    fi
    
    sleep 10
done

# Clean up
rm -f task-definition-secrets.json

echo -e "\n${GREEN}Deployment process complete!${NC}"
echo ""
echo "Useful commands:"
echo "  View logs: aws logs tail /ecs/aiglossarypro-api --follow"
echo "  Check service: aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME"
echo "  List secrets: aws secretsmanager list-secrets --region $REGION"