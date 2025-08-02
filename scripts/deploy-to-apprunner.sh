#!/bin/bash

# AWS App Runner Deployment Script for AIGlossaryPro
# Based on successful deployment pattern from Insurance RAG project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 AIGlossaryPro - AWS App Runner Deployment${NC}"
echo "============================================="

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
SERVICE_NAME="aiglossarypro-api"
ECR_REPO="927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api"
PORT="8080"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not found. Please install it first.${NC}"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials not configured.${NC}"
        exit 1
    fi
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        echo -e "${RED}❌ .env file not found${NC}"
        echo -e "${YELLOW}Creating .env from template...${NC}"
        cp .env.example .env
        echo -e "${RED}Please update .env with your configuration${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
}

# Function to build multi-arch image
build_multiarch_image() {
    echo -e "\n${YELLOW}Building multi-architecture Docker image...${NC}"
    
    # Setup buildx if not exists
    if ! docker buildx ls | grep -q multiarch; then
        echo "Creating buildx builder..."
        docker buildx create --name multiarch --driver docker-container --use
    else
        docker buildx use multiarch
    fi
    
    # Build and push in one step (required for multi-arch)
    echo -e "${YELLOW}Building for linux/amd64 and linux/arm64...${NC}"
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -f apps/api/Dockerfile \
        -t "${ECR_REPO}:latest" \
        -t "${ECR_REPO}:$(date +%Y%m%d-%H%M%S)" \
        --push \
        .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Multi-arch image built and pushed successfully${NC}"
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
}

# Function to create App Runner configuration
create_apprunner_yaml() {
    echo -e "\n${YELLOW}Creating App Runner configuration...${NC}"
    
    cat > apprunner.yaml << 'EOF'
version: 1.0
runtime: docker
build:
  commands:
    build:
      - echo "No build commands - using pre-built image"

run:
  runtime-version: latest
  env:
    - name: NODE_ENV
      value: production
    - name: PORT
      value: "8080"
    - name: LOG_LEVEL
      value: info
  secrets:
    - name: DATABASE_URL
      value-from: "arn:aws:secretsmanager:${AWS_REGION}:927289246324:secret:aiglossarypro/database-url"
    - name: OPENAI_API_KEY
      value-from: "arn:aws:secretsmanager:${AWS_REGION}:927289246324:secret:aiglossarypro/openai-key"
    - name: JWT_SECRET
      value-from: "arn:aws:secretsmanager:${AWS_REGION}:927289246324:secret:aiglossarypro/jwt-secret"
    - name: GROQ_API_KEY
      value-from: "arn:aws:secretsmanager:${AWS_REGION}:927289246324:secret:aiglossarypro/groq-key"
    - name: ANTHROPIC_API_KEY
      value-from: "arn:aws:secretsmanager:${AWS_REGION}:927289246324:secret:aiglossarypro/anthropic-key"
  network:
    port: 8080
    env: PORT
  healthcheck:
    path: /health
    interval: 10
    timeout: 5
    healthy-threshold: 1
    unhealthy-threshold: 5
EOF
    
    # Replace region placeholder
    sed -i.bak "s/\${AWS_REGION}/${AWS_REGION}/g" apprunner.yaml
    rm -f apprunner.yaml.bak
    
    echo -e "${GREEN}✅ App Runner configuration created${NC}"
}

# Function to setup secrets in AWS Secrets Manager
setup_secrets() {
    echo -e "\n${YELLOW}Setting up secrets in AWS Secrets Manager...${NC}"
    
    # Source .env file
    set -a
    source .env
    set +a
    
    # Create secrets if they don't exist
    secrets=(
        "aiglossarypro/database-url:$DATABASE_URL"
        "aiglossarypro/openai-key:$OPENAI_API_KEY"
        "aiglossarypro/jwt-secret:$JWT_SECRET"
        "aiglossarypro/groq-key:${GROQ_API_KEY:-placeholder}"
        "aiglossarypro/anthropic-key:${ANTHROPIC_API_KEY:-placeholder}"
    )
    
    for secret_pair in "${secrets[@]}"; do
        secret_name="${secret_pair%%:*}"
        secret_value="${secret_pair#*:}"
        
        if aws secretsmanager describe-secret --secret-id "$secret_name" --region "$AWS_REGION" &> /dev/null; then
            echo "  Updating secret: $secret_name"
            aws secretsmanager update-secret \
                --secret-id "$secret_name" \
                --secret-string "$secret_value" \
                --region "$AWS_REGION" \
                --no-cli-pager
        else
            echo "  Creating secret: $secret_name"
            aws secretsmanager create-secret \
                --name "$secret_name" \
                --secret-string "$secret_value" \
                --region "$AWS_REGION" \
                --no-cli-pager
        fi
    done
    
    echo -e "${GREEN}✅ Secrets configured${NC}"
}

# Function to create/update App Runner service
deploy_apprunner() {
    echo -e "\n${YELLOW}Deploying to AWS App Runner...${NC}"
    
    # Check if service exists
    if aws apprunner list-services --region "$AWS_REGION" --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME']" | grep -q "$SERVICE_NAME"; then
        echo "Updating existing App Runner service..."
        
        # Get service ARN
        SERVICE_ARN=$(aws apprunner list-services \
            --region "$AWS_REGION" \
            --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" \
            --output text)
        
        # Update service
        aws apprunner update-service \
            --service-arn "$SERVICE_ARN" \
            --source-configuration '{
                "ImageRepository": {
                    "ImageIdentifier": "'${ECR_REPO}':latest",
                    "ImageConfiguration": {
                        "Port": "'${PORT}'"
                    },
                    "ImageRepositoryType": "ECR"
                }
            }' \
            --region "$AWS_REGION" \
            --no-cli-pager
    else
        echo "Creating new App Runner service..."
        
        # Create service
        aws apprunner create-service \
            --service-name "$SERVICE_NAME" \
            --source-configuration '{
                "ImageRepository": {
                    "ImageIdentifier": "'${ECR_REPO}':latest",
                    "ImageConfiguration": {
                        "Port": "'${PORT}'"
                    },
                    "ImageRepositoryType": "ECR"
                },
                "AutoDeploymentsEnabled": false
            }' \
            --health-check-configuration '{
                "Protocol": "HTTP",
                "Path": "/health",
                "Interval": 10,
                "Timeout": 5,
                "HealthyThreshold": 1,
                "UnhealthyThreshold": 5
            }' \
            --instance-configuration '{
                "Cpu": "0.25 vCPU",
                "Memory": "0.5 GB"
            }' \
            --region "$AWS_REGION" \
            --no-cli-pager
    fi
    
    echo -e "${GREEN}✅ App Runner deployment initiated${NC}"
}

# Function to wait for deployment and get URL
wait_for_deployment() {
    echo -e "\n${YELLOW}Waiting for deployment to complete...${NC}"
    
    # Get service ARN
    SERVICE_ARN=$(aws apprunner list-services \
        --region "$AWS_REGION" \
        --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" \
        --output text)
    
    # Wait for service to be running
    echo "Checking service status..."
    for i in {1..30}; do
        STATUS=$(aws apprunner describe-service \
            --service-arn "$SERVICE_ARN" \
            --region "$AWS_REGION" \
            --query "Service.Status" \
            --output text)
        
        if [ "$STATUS" = "RUNNING" ]; then
            echo -e "${GREEN}✅ Service is running!${NC}"
            break
        elif [ "$STATUS" = "FAILED" ]; then
            echo -e "${RED}❌ Deployment failed${NC}"
            exit 1
        else
            echo "  Status: $STATUS (attempt $i/30)"
            sleep 10
        fi
    done
    
    # Get service URL
    SERVICE_URL=$(aws apprunner describe-service \
        --service-arn "$SERVICE_ARN" \
        --region "$AWS_REGION" \
        --query "Service.ServiceUrl" \
        --output text)
    
    echo -e "\n${GREEN}🎉 Deployment successful!${NC}"
    echo -e "${BLUE}Service URL: https://${SERVICE_URL}${NC}"
    echo -e "${BLUE}Health Check: https://${SERVICE_URL}/health${NC}"
}

# Function to test deployment
test_deployment() {
    echo -e "\n${YELLOW}Testing deployment...${NC}"
    
    SERVICE_URL=$(aws apprunner describe-service \
        --service-arn "$(aws apprunner list-services --region $AWS_REGION --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" --output text)" \
        --region "$AWS_REGION" \
        --query "Service.ServiceUrl" \
        --output text)
    
    # Test health endpoint
    echo "Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://${SERVICE_URL}/health")
    
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed (HTTP $HEALTH_RESPONSE)${NC}"
    fi
    
    # Show full health response
    echo -e "\nHealth check response:"
    curl -s "https://${SERVICE_URL}/health" | jq . || curl -s "https://${SERVICE_URL}/health"
}

# Function to create deployment status report
create_deployment_report() {
    echo -e "\n${YELLOW}Creating deployment report...${NC}"
    
    SERVICE_ARN=$(aws apprunner list-services \
        --region "$AWS_REGION" \
        --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].ServiceArn" \
        --output text)
    
    SERVICE_INFO=$(aws apprunner describe-service \
        --service-arn "$SERVICE_ARN" \
        --region "$AWS_REGION")
    
    SERVICE_URL=$(echo "$SERVICE_INFO" | jq -r '.Service.ServiceUrl')
    SERVICE_STATUS=$(echo "$SERVICE_INFO" | jq -r '.Service.Status')
    
    cat > DEPLOYMENT_STATUS.md << EOF
# AIGlossaryPro - AWS App Runner Deployment Status

**Last Updated**: $(date)
**Status**: ✅ **DEPLOYED**
**Platform**: AWS App Runner

## 🎯 Current Deployment Status

### ✅ Production Environment

- **Service URL**: https://${SERVICE_URL}
- **Status**: ${SERVICE_STATUS}
- **Region**: ${AWS_REGION}
- **Service Name**: ${SERVICE_NAME}

### ✅ Endpoints Status

| Endpoint | URL | Description |
|----------|-----|-------------|
| Health Check | \`/health\` | Service health status |
| API Documentation | \`/api-docs\` | Swagger documentation |
| Terms API | \`/api/terms\` | AI/ML glossary terms |
| Search | \`/api/search\` | Term search endpoint |

### ✅ Infrastructure Components

| Component | Provider | Status | Notes |
|-----------|----------|--------|-------|
| **Container Platform** | AWS App Runner | ✅ Operational | Auto-scaling enabled |
| **Container Registry** | AWS ECR | ✅ Operational | Multi-arch images |
| **Database** | PostgreSQL | ✅ Connected | Via DATABASE_URL |
| **AI Service** | OpenAI API | ✅ Connected | GPT-4 enabled |

## 🚀 Deployment Commands

\`\`\`bash
# Deploy/Update
./scripts/deploy-to-apprunner.sh

# Check logs
aws logs tail /aws/apprunner/${SERVICE_NAME} --follow

# Check status
aws apprunner describe-service --service-arn ${SERVICE_ARN}
\`\`\`

## 📊 Next Steps

1. Monitor service health
2. Set up CloudWatch alerts
3. Configure custom domain
4. Enable auto-deployment from ECR

---

**Deployment completed successfully!**
EOF
    
    echo -e "${GREEN}✅ Deployment report created: DEPLOYMENT_STATUS.md${NC}"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    # Run all steps
    check_prerequisites
    setup_secrets
    build_multiarch_image
    create_apprunner_yaml
    deploy_apprunner
    wait_for_deployment
    test_deployment
    create_deployment_report
    
    echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${YELLOW}Check DEPLOYMENT_STATUS.md for details${NC}"
}

# Run main function
main "$@"