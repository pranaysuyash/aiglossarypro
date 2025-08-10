#!/bin/bash
set -euo pipefail

# EC2 API Start Script
# Pulls latest ECR image and runs API container with Secrets Manager values

# Configuration from environment
AWS_REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID="${ACCOUNT_ID:-927289246324}"
ECR_REPO="${ECR_REPO:-aiglossarypro-api}"
DATABASE_URL_ARN="${DATABASE_URL_ARN:-}"
SESSION_SECRET_ARN="${SESSION_SECRET_ARN:-}"
JWT_SECRET_ARN="${JWT_SECRET_ARN:-}"
CONTAINER_NAME="${CONTAINER_NAME:-api}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Starting API on EC2${NC}"
echo "Region: $AWS_REGION"
echo "Account: $ACCOUNT_ID"
echo "ECR Repo: $ECR_REPO"
echo ""

# Validate requirements
if [ -z "$DATABASE_URL_ARN" ] || [ -z "$SESSION_SECRET_ARN" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL_ARN and SESSION_SECRET_ARN are required${NC}"
    exit 1
fi

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Install with: sudo yum install -y docker && sudo systemctl enable --now docker"
    exit 1
fi

if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Docker is not running or you need sudo${NC}"
    echo "Try: sudo systemctl start docker"
    exit 1
fi

# Step 1: Login to ECR
echo -e "${YELLOW}1️⃣ Logging in to ECR...${NC}"
aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Step 2: Pull latest image
ECR_URI="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:$IMAGE_TAG"
echo -e "${YELLOW}2️⃣ Pulling image: $ECR_URI${NC}"
docker pull "$ECR_URI"

# Step 3: Fetch secrets from Secrets Manager
echo -e "${YELLOW}3️⃣ Fetching secrets from Secrets Manager...${NC}"

DATABASE_URL=$(aws secretsmanager get-secret-value \
    --secret-id "$DATABASE_URL_ARN" \
    --region "$AWS_REGION" \
    --query 'SecretString' \
    --output text)

SESSION_SECRET=$(aws secretsmanager get-secret-value \
    --secret-id "$SESSION_SECRET_ARN" \
    --region "$AWS_REGION" \
    --query 'SecretString' \
    --output text)

if [ -n "$JWT_SECRET_ARN" ]; then
    JWT_SECRET=$(aws secretsmanager get-secret-value \
        --secret-id "$JWT_SECRET_ARN" \
        --region "$AWS_REGION" \
        --query 'SecretString' \
        --output text 2>/dev/null || echo "")
else
    JWT_SECRET=""
fi

echo -e "${GREEN}✅ Secrets fetched successfully${NC}"

# Step 4: Stop existing container if running
echo -e "${YELLOW}4️⃣ Checking for existing container...${NC}"
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "  Stopping existing container..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
fi

# Step 5: Run new container
echo -e "${YELLOW}5️⃣ Starting API container...${NC}"

# Build docker run command
DOCKER_CMD="docker run -d --name $CONTAINER_NAME --restart unless-stopped -p 8080:8080"

# Add environment variables
DOCKER_CMD="$DOCKER_CMD -e NODE_ENV=production"
DOCKER_CMD="$DOCKER_CMD -e PORT=8080"
DOCKER_CMD="$DOCKER_CMD -e USE_STANDARD_PG=true"
DOCKER_CMD="$DOCKER_CMD -e REDIS_ENABLED=false"
DOCKER_CMD="$DOCKER_CMD -e ALLOW_DEGRADED_STARTUP=true"
DOCKER_CMD="$DOCKER_CMD -e ALLOW_NO_AUTH_FOR_DEBUG=true"
DOCKER_CMD="$DOCKER_CMD -e NODE_OPTIONS='--enable-source-maps --max-old-space-size=1536 --trace-uncaught --trace-warnings --unhandled-rejections=warn'"
DOCKER_CMD="$DOCKER_CMD -e DATABASE_URL='$DATABASE_URL'"
DOCKER_CMD="$DOCKER_CMD -e SESSION_SECRET='$SESSION_SECRET'"

# Add JWT secret if provided
if [ -n "$JWT_SECRET" ]; then
    DOCKER_CMD="$DOCKER_CMD -e JWT_SECRET='$JWT_SECRET'"
fi

# Add image
DOCKER_CMD="$DOCKER_CMD $ECR_URI"

# Run the container
CONTAINER_ID=$(eval "$DOCKER_CMD")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Container started: ${CONTAINER_ID:0:12}${NC}"
else
    echo -e "${RED}❌ Failed to start container${NC}"
    exit 1
fi

# Step 6: Wait for health check
echo -e "${YELLOW}6️⃣ Waiting for API to be healthy...${NC}"
sleep 10

MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API is healthy!${NC}"
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo -e "${RED}❌ Health check failed after $MAX_ATTEMPTS attempts${NC}"
        echo "Checking container logs:"
        docker logs --tail 50 "$CONTAINER_NAME"
        exit 1
    fi
    
    echo -n "."
    sleep 2
done

echo ""

# Step 7: Test endpoints
echo -e "${YELLOW}7️⃣ Testing API endpoints...${NC}"

echo -n "  /health: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
[ "$HTTP_CODE" = "200" ] && echo -e "${GREEN}✅ $HTTP_CODE${NC}" || echo -e "${RED}❌ $HTTP_CODE${NC}"

echo -n "  /api/health: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health)
[ "$HTTP_CODE" = "200" ] && echo -e "${GREEN}✅ $HTTP_CODE${NC}" || echo -e "${YELLOW}⚠️  $HTTP_CODE${NC}"

echo -n "  /api/terms: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/terms)
[ "$HTTP_CODE" = "200" ] && echo -e "${GREEN}✅ $HTTP_CODE${NC}" || echo -e "${YELLOW}⚠️  $HTTP_CODE${NC}"

echo ""
echo -e "${GREEN}🎉 API is running on EC2!${NC}"
echo ""
echo "Container commands:"
echo "  View logs: docker logs -f $CONTAINER_NAME"
echo "  Stop: docker stop $CONTAINER_NAME"
echo "  Restart: docker restart $CONTAINER_NAME"
echo "  Remove: docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
echo ""
echo "API endpoints:"
echo "  http://localhost:8080/health"
echo "  http://localhost:8080/api/health"
echo "  http://localhost:8080/api/terms"
echo "  http://localhost:8080/api/categories"