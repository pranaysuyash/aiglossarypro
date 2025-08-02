#!/bin/bash
set -e

echo "🚀 Deploying AIGlossaryPro API with Multi-Architecture Support to ECS"
echo "====================================================================="

# Configuration
REGION="${AWS_REGION:-us-east-1}"
ECR_REPO_NAME="aiglossarypro-api"
CLUSTER_NAME="aiglossarypro-cluster"
SERVICE_NAME="aiglossarypro-api-service"
TASK_FAMILY="aiglossarypro-api-task"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO_NAME"

echo "✅ Account ID: $ACCOUNT_ID"
echo "📦 ECR URI: $ECR_URI"
echo "🆕 Service Name: $SERVICE_NAME"
echo "🏗️ Target Architecture: Multi-arch (linux/amd64, linux/arm64)"
echo "💻 Build Platform: $(uname -m) ($(uname -s))"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Check prerequisites
echo ""
echo "🔍 Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run: aws configure${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install it first.${NC}"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

# Check Docker buildx for multi-platform builds
echo "🔧 Setting up Docker buildx for multi-platform builds..."
if ! docker buildx ls | grep -q multiarch; then
    docker buildx create --name multiarch --driver docker-container --use
else
    docker buildx use multiarch
fi
docker buildx inspect --bootstrap

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Step 1: Login to ECR
echo ""
echo "1️⃣ Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

# Step 2: Build and push multi-platform image
echo ""
echo "2️⃣ Building and pushing multi-platform Docker image..."

# Clear build cache if requested
if [ "$1" == "--no-cache" ]; then
    echo -e "${YELLOW}Clearing Docker build cache...${NC}"
    docker builder prune -f
fi

echo "🔨 Building Docker image for linux/amd64 and linux/arm64..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -f apps/api/Dockerfile \
    -t "${ECR_URI}:latest" \
    -t "${ECR_URI}:$(date +%Y%m%d-%H%M%S)" \
    --push \
    --progress=plain \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Multi-platform Docker image built and pushed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 3: Create or update ECS cluster
echo ""
echo "3️⃣ Setting up ECS cluster..."
aws ecs describe-clusters --clusters $CLUSTER_NAME --region $REGION > /dev/null 2>&1 || {
    echo "Creating ECS cluster..."
    aws ecs create-cluster \
        --cluster-name $CLUSTER_NAME \
        --region $REGION \
        --capacity-providers FARGATE FARGATE_SPOT \
        --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
}

# Step 4: Create task execution role if it doesn't exist
echo ""
echo "4️⃣ Setting up IAM roles..."
EXECUTION_ROLE_NAME="aiglossarypro-ecs-execution-role"
TASK_ROLE_NAME="aiglossarypro-ecs-task-role"

# Check if execution role exists
if ! aws iam get-role --role-name $EXECUTION_ROLE_NAME > /dev/null 2>&1; then
    echo "Creating execution role..."
    cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    
    aws iam create-role \
        --role-name $EXECUTION_ROLE_NAME \
        --assume-role-policy-document file://trust-policy.json
    
    aws iam attach-role-policy \
        --role-name $EXECUTION_ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    
    rm trust-policy.json
fi

# Step 5: Create task definition
echo ""
echo "5️⃣ Creating ECS task definition..."

# Get secrets from .env file if it exists
if [ -f ".env" ]; then
    echo "Loading environment variables from .env..."
    set -a
    source .env
    set +a
fi

cat > task-definition.json << EOF
{
  "family": "$TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/$EXECUTION_ROLE_NAME",
  "taskRoleArn": "arn:aws:iam::$ACCOUNT_ID:role/$EXECUTION_ROLE_NAME",
  "containerDefinitions": [
    {
      "name": "aiglossarypro-api",
      "image": "$ECR_URI:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
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
          "value": "8080"
        },
        {
          "name": "LOG_LEVEL",
          "value": "info"
        },
        {
          "name": "DATABASE_URL",
          "value": "${DATABASE_URL:-postgresql://user:pass@localhost:5432/aiglossary}"
        },
        {
          "name": "JWT_SECRET",
          "value": "${JWT_SECRET:-your-jwt-secret}"
        },
        {
          "name": "OPENAI_API_KEY",
          "value": "${OPENAI_API_KEY:-sk-test}"
        },
        {
          "name": "GROQ_API_KEY",
          "value": "${GROQ_API_KEY:-}"
        },
        {
          "name": "ANTHROPIC_API_KEY",
          "value": "${ANTHROPIC_API_KEY:-}"
        },
        {
          "name": "REDIS_URL",
          "value": "${REDIS_URL:-}"
        },
        {
          "name": "ADMIN_API_KEY",
          "value": "${ADMIN_API_KEY:-}"
        }
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

# Create CloudWatch log group if it doesn't exist
aws logs create-log-group --log-group-name /ecs/aiglossarypro-api --region $REGION 2>/dev/null || true

# Register task definition
TASK_DEF_ARN=$(aws ecs register-task-definition \
    --cli-input-json file://task-definition.json \
    --region $REGION \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo -e "${GREEN}✅ Task definition registered: $TASK_DEF_ARN${NC}"

# Step 6: Create or update service
echo ""
echo "6️⃣ Creating/updating ECS service..."

# Check if service exists
if aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION | grep -q "serviceName"; then
    echo "Updating existing service..."
    
    # Update service with new task definition
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --task-definition $TASK_DEF_ARN \
        --force-new-deployment \
        --region $REGION > /dev/null
    
    echo -e "${GREEN}✅ Service update initiated${NC}"
else
    echo "Creating new service..."
    
    # Get default VPC and subnets
    DEFAULT_VPC=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region $REGION)
    SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$DEFAULT_VPC" --query "Subnets[*].SubnetId" --output text --region $REGION | tr '\t' ',')
    
    # Create security group
    SG_NAME="aiglossarypro-api-sg"
    SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" --query "SecurityGroups[0].GroupId" --output text --region $REGION 2>/dev/null)
    
    if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
        echo "Creating security group..."
        SG_ID=$(aws ec2 create-security-group \
            --group-name $SG_NAME \
            --description "Security group for AIGlossaryPro API" \
            --vpc-id $DEFAULT_VPC \
            --region $REGION \
            --query 'GroupId' \
            --output text)
        
        # Allow inbound traffic on port 8080
        aws ec2 authorize-security-group-ingress \
            --group-id $SG_ID \
            --protocol tcp \
            --port 8080 \
            --cidr 0.0.0.0/0 \
            --region $REGION
    fi
    
    # Create service
    aws ecs create-service \
        --cluster $CLUSTER_NAME \
        --service-name $SERVICE_NAME \
        --task-definition $TASK_DEF_ARN \
        --desired-count 1 \
        --launch-type FARGATE \
        --platform-version LATEST \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
        --region $REGION > /dev/null
    
    echo -e "${GREEN}✅ Service created${NC}"
fi

# Step 7: Wait for deployment to stabilize
echo ""
echo "7️⃣ Waiting for deployment to stabilize..."
echo "⏳ This may take 3-5 minutes..."

for i in {1..20}; do
    RUNNING_COUNT=$(aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION \
        --query 'services[0].runningCount' \
        --output text)
    
    DESIRED_COUNT=$(aws ecs describe-services \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $REGION \
        --query 'services[0].desiredCount' \
        --output text)
    
    echo "   Running: $RUNNING_COUNT / Desired: $DESIRED_COUNT"
    
    if [ "$RUNNING_COUNT" == "$DESIRED_COUNT" ] && [ "$RUNNING_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Service is stable!${NC}"
        break
    fi
    
    if [ $i -eq 20 ]; then
        echo -e "${YELLOW}⚠️ Service may still be stabilizing. Check ECS console for details.${NC}"
    fi
    
    sleep 15
done

# Step 8: Get service details
echo ""
echo "8️⃣ Getting service details..."

# Get task ARN
TASK_ARN=$(aws ecs list-tasks \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_NAME \
    --region $REGION \
    --query 'taskArns[0]' \
    --output text)

if [ ! -z "$TASK_ARN" ] && [ "$TASK_ARN" != "None" ]; then
    # Get task details
    TASK_DETAILS=$(aws ecs describe-tasks \
        --cluster $CLUSTER_NAME \
        --tasks $TASK_ARN \
        --region $REGION)
    
    # Get public IP
    ENI_ID=$(echo $TASK_DETAILS | jq -r '.tasks[0].attachments[0].details[] | select(.name=="networkInterfaceId").value')
    PUBLIC_IP=$(aws ec2 describe-network-interfaces \
        --network-interface-ids $ENI_ID \
        --region $REGION \
        --query 'NetworkInterfaces[0].Association.PublicIp' \
        --output text 2>/dev/null || echo "N/A")
    
    echo -e "${GREEN}Task ARN: $TASK_ARN${NC}"
    echo -e "${GREEN}Public IP: $PUBLIC_IP${NC}"
fi

# Clean up
rm -f task-definition.json

echo ""
echo "🎉 SUCCESS! AIGlossaryPro API deployed to ECS!"
echo "=============================================="
echo "🌐 Cluster: $CLUSTER_NAME"
echo "🚀 Service: $SERVICE_NAME"
echo "📊 Task Definition: $TASK_FAMILY"
if [ ! -z "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "N/A" ]; then
    echo "🔗 API URL: http://$PUBLIC_IP:8080"
    echo "🏥 Health Check: http://$PUBLIC_IP:8080/health"
    echo "📚 API Docs: http://$PUBLIC_IP:8080/api-docs"
fi
echo ""
echo "📊 Monitor: https://console.aws.amazon.com/ecs/home?region=$REGION#/clusters/$CLUSTER_NAME/services"
echo "📝 Logs: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups/log-group/%2Fecs%2Faiglossarypro-api"
echo ""
echo "🔧 Commands:"
echo "   View logs: aws logs tail /ecs/aiglossarypro-api --follow"
echo "   Update service: ./scripts/deploy-ecs-multiarch.sh"
echo "   Scale service: aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --desired-count 2"
echo ""
echo "💡 Tips:"
echo "   - For production, consider adding an Application Load Balancer"
echo "   - Enable auto-scaling for better resource utilization"
echo "   - Use AWS Secrets Manager for sensitive environment variables"
echo ""
echo "✅ Deployment complete!"