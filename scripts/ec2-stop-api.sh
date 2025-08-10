#!/bin/bash
set -euo pipefail

# EC2 API Stop Script
# Stops and removes the API container on EC2

CONTAINER_NAME="${CONTAINER_NAME:-api}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping API on EC2${NC}"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}⚠️  Container '$CONTAINER_NAME' not found${NC}"
    exit 0
fi

# Get container status
STATUS=$(docker inspect -f '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "unknown")
echo "Container status: $STATUS"

# Stop container if running
if [ "$STATUS" = "running" ]; then
    echo -e "${YELLOW}Stopping container...${NC}"
    docker stop "$CONTAINER_NAME"
    echo -e "${GREEN}✅ Container stopped${NC}"
else
    echo "Container is not running"
fi

# Remove container
echo -e "${YELLOW}Removing container...${NC}"
docker rm "$CONTAINER_NAME"
echo -e "${GREEN}✅ Container removed${NC}"

echo ""
echo -e "${GREEN}🎉 API stopped successfully!${NC}"
echo ""
echo "To start again, run:"
echo "  bash scripts/ec2-start-api.sh"