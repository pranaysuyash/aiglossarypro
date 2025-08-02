#!/bin/bash

# Quick test script to verify Docker setup
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Testing Docker Setup for AIGlossaryPro${NC}"
echo "======================================"

# Change to project root
cd "$(dirname "$0")/.."

# Step 1: Clean up any existing containers
echo -e "\n${YELLOW}Step 1: Cleaning up existing containers...${NC}"
./scripts/cleanup-services.sh --docker

# Step 2: Build the image
echo -e "\n${YELLOW}Step 2: Building Docker image...${NC}"
./scripts/docker-debug.sh --full

echo -e "\n${GREEN}✅ Docker setup test complete!${NC}"
echo -e "${YELLOW}You can now use the following commands:${NC}"
echo ""
echo "  # Debug interactively:"
echo "  ./scripts/docker-debug.sh"
echo ""
echo "  # Clean up resources:"
echo "  ./scripts/cleanup-services.sh"
echo ""
echo "  # Deploy to ECS:"
echo "  ./scripts/deploy-to-ecs.sh"
echo ""