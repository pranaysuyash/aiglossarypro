#!/usr/bin/env bash

# Strict, safe bash
set -euo pipefail

# --- Configuration (override via env) ---
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
ECR_REPO="${ECR_REPO:-aiglossarypro-api}"

CLUSTER="${CLUSTER:-aiglossarypro}"
SERVICE="${SERVICE:-aiglossarypro-api-production}"
FAMILY="${FAMILY:-aiglossarypro-api}"
CONTAINER_NAME="${CONTAINER_NAME:-api}"

CPU="${CPU:-512}"
MEMORY="${MEMORY:-2048}"

LOG_GROUP_NAME="${LOG_GROUP_NAME:-/ecs/aiglossarypro-api}"
LOG_GROUP_REGION="${LOG_GROUP_REGION:-$AWS_REGION}"
LOG_STREAM_PREFIX="${LOG_STREAM_PREFIX:-ecs}"

# Secrets (must be ARNs or name/ID resolvable by Secrets Manager)
SECRET_ARN_DATABASE_URL="${SECRET_ARN_DATABASE_URL:-}"
SECRET_ARN_SESSION_SECRET="${SECRET_ARN_SESSION_SECRET:-}"
# Optional additional secrets (set to empty to skip)
SECRET_ARN_JWT_SECRET="${SECRET_ARN_JWT_SECRET:-}"
SECRET_ARN_GOOGLE_CLIENT_ID="${SECRET_ARN_GOOGLE_CLIENT_ID:-}"
SECRET_ARN_GOOGLE_CLIENT_SECRET="${SECRET_ARN_GOOGLE_CLIENT_SECRET:-}"

# Roles (must already exist)
EXECUTION_ROLE_ARN="${EXECUTION_ROLE_ARN:-}"
TASK_ROLE_ARN="${TASK_ROLE_ARN:-}"

DOCKERFILE="${DOCKERFILE:-apps/api/Dockerfile.debian}"

# Image tag defaults to short git SHA + timestamp
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "nosha")
TS=$(date +%Y%m%d%H%M%S)
IMAGE_TAG="${IMAGE_TAG:-$TS-$GIT_SHA}"

USE_BUILDX="${USE_BUILDX:-1}"
PLATFORM="${PLATFORM:-linux/amd64}"

# Runtime env for the container
RUNTIME_NODE_ENV="${RUNTIME_NODE_ENV:-production}"
RUNTIME_PORT="${RUNTIME_PORT:-8080}"
RUNTIME_USE_STANDARD_PG="${RUNTIME_USE_STANDARD_PG:-true}"
RUNTIME_NODE_OPTIONS="${RUNTIME_NODE_OPTIONS:---enable-source-maps --max-old-space-size=1536 --trace-uncaught --trace-warnings}"

# Validation flags
VALIDATE_LOCAL="${VALIDATE_LOCAL:-0}"

# --- Preconditions ---
need() { command -v "$1" >/dev/null 2>&1 || { echo "ERROR: '$1' is required" >&2; exit 1; }; }
need aws
need docker
need jq
need sed

if [[ -z "$AWS_ACCOUNT_ID" ]]; then
  echo "ERROR: AWS_ACCOUNT_ID must be set" >&2
  exit 1
fi
if [[ -z "$EXECUTION_ROLE_ARN" || -z "$TASK_ROLE_ARN" ]]; then
  echo "ERROR: EXECUTION_ROLE_ARN and TASK_ROLE_ARN must be set" >&2
  exit 1
fi
if [[ -z "$SECRET_ARN_DATABASE_URL" || -z "$SECRET_ARN_SESSION_SECRET" ]]; then
  echo "ERROR: SECRET_ARN_DATABASE_URL and SECRET_ARN_SESSION_SECRET must be set" >&2
  exit 1
fi

set -x

ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"

# --- Login to ECR ---
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Ensure repository exists
aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$AWS_REGION" >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name "$ECR_REPO" --region "$AWS_REGION" >/dev/null

# --- Build image ---
if [[ "$USE_BUILDX" == "1" ]]; then
  docker buildx build \
    --platform "$PLATFORM" \
    -f "$DOCKERFILE" \
    -t "$ECR_URI:$IMAGE_TAG" \
    -t "$ECR_URI:latest" \
    --push .
else
  docker build -f "$DOCKERFILE" -t "$ECR_URI:$IMAGE_TAG" .
  docker tag "$ECR_URI:$IMAGE_TAG" "$ECR_URI:latest"
  docker push "$ECR_URI:$IMAGE_TAG"
  docker push "$ECR_URI:latest"
fi

# --- Optional local validation (containerized) ---
if [[ "$VALIDATE_LOCAL" == "1" ]]; then
  set +x
  echo "Running local validation..."
  docker run --rm --entrypoint node "$ECR_URI:$IMAGE_TAG" -e "console.log('node ok')" >/dev/null
  # Try health endpoint if env file exists
  if [[ -f .env.production ]]; then
    CID=$(docker run -d -p 8080:8080 --env-file .env.production -e USE_STANDARD_PG=true "$ECR_URI:$IMAGE_TAG")
    sleep 5
    curl -sf http://localhost:8080/health >/dev/null || { echo "Local health check failed" >&2; docker logs "$CID" || true; docker rm -f "$CID"; exit 1; }
    docker rm -f "$CID" >/dev/null || true
  fi
  set -x
fi

# --- Build task definition JSON ---
TMP_JSON=$(mktemp /tmp/taskdef.XXXXXX.json)

cat > "$TMP_JSON" <<JSON
{
  "family": "$FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "$CPU",
  "memory": "$MEMORY",
  "executionRoleArn": "$EXECUTION_ROLE_ARN",
  "taskRoleArn": "$TASK_ROLE_ARN",
  "containerDefinitions": [
    {
      "name": "$CONTAINER_NAME",
      "image": "$ECR_URI:$IMAGE_TAG",
      "essential": true,
      "portMappings": [ { "containerPort": 8080, "protocol": "tcp" } ],
      "environment": [
        { "name": "NODE_ENV", "value": "$RUNTIME_NODE_ENV" },
        { "name": "PORT", "value": "$RUNTIME_PORT" },
        { "name": "USE_STANDARD_PG", "value": "$RUNTIME_USE_STANDARD_PG" },
        { "name": "NODE_OPTIONS", "value": "$RUNTIME_NODE_OPTIONS" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "$SECRET_ARN_DATABASE_URL" },
        { "name": "SESSION_SECRET", "valueFrom": "$SECRET_ARN_SESSION_SECRET" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "$LOG_GROUP_NAME",
          "awslogs-region": "$LOG_GROUP_REGION",
          "awslogs-stream-prefix": "$LOG_STREAM_PREFIX"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
        "interval": 15,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 180
      }
    }
  ]
}
JSON

# Add optional secrets safely via jq to avoid JSON syntax issues
if [[ -n "$SECRET_ARN_JWT_SECRET" ]]; then
  jq --arg n "JWT_SECRET" --arg v "$SECRET_ARN_JWT_SECRET" \
    '.containerDefinitions[0].secrets += [{"name":$n, "valueFrom":$v}]' \
    "$TMP_JSON" >"$TMP_JSON.tmp" && mv "$TMP_JSON.tmp" "$TMP_JSON"
fi

if [[ -n "$SECRET_ARN_GOOGLE_CLIENT_ID" ]]; then
  jq --arg n "GOOGLE_CLIENT_ID" --arg v "$SECRET_ARN_GOOGLE_CLIENT_ID" \
    '.containerDefinitions[0].secrets += [{"name":$n, "valueFrom":$v}]' \
    "$TMP_JSON" >"$TMP_JSON.tmp" && mv "$TMP_JSON.tmp" "$TMP_JSON"
fi

if [[ -n "$SECRET_ARN_GOOGLE_CLIENT_SECRET" ]]; then
  jq --arg n "GOOGLE_CLIENT_SECRET" --arg v "$SECRET_ARN_GOOGLE_CLIENT_SECRET" \
    '.containerDefinitions[0].secrets += [{"name":$n, "valueFrom":$v}]' \
    "$TMP_JSON" >"$TMP_JSON.tmp" && mv "$TMP_JSON.tmp" "$TMP_JSON"
fi

# Register task definition
TD_ARN=$(aws ecs register-task-definition --region "$AWS_REGION" \
  --cli-input-json "file://$TMP_JSON" | jq -r '.taskDefinition.taskDefinitionArn')

echo "Registered task definition: $TD_ARN"

# Update service
aws ecs update-service --region "$AWS_REGION" \
  --cluster "$CLUSTER" --service "$SERVICE" \
  --task-definition "$TD_ARN" --force-new-deployment >/dev/null

echo "Waiting for service to stabilize..."
aws ecs wait services-stable --region "$AWS_REGION" --cluster "$CLUSTER" --services "$SERVICE"

set +x
echo "\n✅ Deployment complete"
echo "Cluster:   $CLUSTER"
echo "Service:   $SERVICE"
echo "Image:     $ECR_URI:$IMAGE_TAG"
echo "Task def:  $TD_ARN"
echo "Logs:      CloudWatch group '$LOG_GROUP_NAME' (region $LOG_GROUP_REGION)"

#!/bin/bash
set -e

echo "🚀 Production ECS Deployment for AIGlossaryPro"
echo "==========================================="

# Configuration
REGION="${AWS_REGION:-us-east-1}"
CLUSTER_NAME="aiglossarypro"
SERVICE_NAME="aiglossarypro-api-production"
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
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/database"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/jwt"},
        {"name": "OPENAI_API_KEY", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/openai"},
        {"name": "SESSION_SECRET", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/session"},
        {"name": "FIREBASE_PRIVATE_KEY_BASE64", "valueFrom": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:aiglossarypro/firebase-private-key-guP8N3"}
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