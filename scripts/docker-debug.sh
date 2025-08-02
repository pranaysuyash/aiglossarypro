#!/bin/bash

# Docker debugging script for AIGlossaryPro API
# This script helps debug container issues locally before ECS deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Docker Debug Script for AIGlossaryPro API${NC}"
echo "========================================="

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Detect system architecture
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    PLATFORM="linux/arm64/v8"
    TAG_SUFFIX="arm64"
    echo -e "${YELLOW}Detected ARM64 architecture${NC}"
else
    PLATFORM="linux/amd64"
    TAG_SUFFIX="amd64"
    echo -e "${YELLOW}Detected AMD64 architecture${NC}"
fi

# Function to cleanup containers
cleanup_containers() {
    echo -e "${YELLOW}Cleaning up stopped containers...${NC}"
    docker ps -a --filter "name=aiglossarypro-api" --filter "status=exited" -q | xargs -r docker rm
    echo -e "${GREEN}Cleanup complete${NC}"
}

# Function to build the image
build_image() {
    echo -e "${GREEN}Building Docker image for platform: $PLATFORM${NC}"
    docker build \
        --platform "$PLATFORM" \
        -f apps/api/Dockerfile \
        -t "aiglossarypro-api:$TAG_SUFFIX" \
        -t "aiglossarypro-api:latest" \
        .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Build successful!${NC}"
    else
        echo -e "${RED}Build failed!${NC}"
        exit 1
    fi
}

# Function to run interactive shell
run_interactive() {
    echo -e "${GREEN}Starting interactive shell in container...${NC}"
    docker run -it --rm \
        --name aiglossarypro-api-debug \
        --platform "$PLATFORM" \
        --entrypoint sh \
        -e NODE_ENV=production \
        -e LOG_LEVEL=debug \
        -v "$PROJECT_ROOT/.env:/app/.env:ro" \
        "aiglossarypro-api:$TAG_SUFFIX"
}

# Function to run with verbose logging
run_verbose() {
    echo -e "${GREEN}Running container with verbose logging...${NC}"
    docker run --rm \
        --name aiglossarypro-api-verbose \
        --platform "$PLATFORM" \
        -e NODE_ENV=production \
        -e LOG_LEVEL=debug \
        -e DEBUG="*" \
        -v "$PROJECT_ROOT/.env:/app/.env:ro" \
        -p 8080:8080 \
        "aiglossarypro-api:$TAG_SUFFIX"
}

# Function to check container logs
check_logs() {
    CONTAINER_ID=$(docker ps -a --filter "name=aiglossarypro-api" --latest -q)
    if [ -z "$CONTAINER_ID" ]; then
        echo -e "${RED}No container found${NC}"
        return
    fi
    
    echo -e "${GREEN}Container logs:${NC}"
    docker logs "$CONTAINER_ID"
    
    echo -e "${GREEN}Exit code:${NC}"
    docker inspect "$CONTAINER_ID" --format='{{.State.ExitCode}}'
}

# Function to test with minimal config
test_minimal() {
    echo -e "${GREEN}Testing with minimal configuration...${NC}"
    docker run --rm \
        --name aiglossarypro-api-minimal \
        --platform "$PLATFORM" \
        -e NODE_ENV=production \
        -e PORT=8080 \
        -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
        -e OPENAI_API_KEY="sk-test" \
        -e JWT_SECRET="test-secret" \
        -e NODE_OPTIONS="--trace-warnings" \
        "aiglossarypro-api:$TAG_SUFFIX"
}

# Function to validate environment
validate_env() {
    echo -e "${GREEN}Validating environment file...${NC}"
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        echo -e "${RED}.env file not found!${NC}"
        echo "Creating template .env file..."
        cat > "$PROJECT_ROOT/.env.template" << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# API Keys
OPENAI_API_KEY=sk-xxx
GROQ_API_KEY=gsk_xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# Auth
JWT_SECRET=your-jwt-secret
ADMIN_API_KEY=your-admin-key

# Server
PORT=8080
NODE_ENV=production

# Optional
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379
EOF
        echo -e "${YELLOW}Template created at .env.template${NC}"
        return 1
    fi
    
    # Check for required variables
    REQUIRED_VARS=("DATABASE_URL" "OPENAI_API_KEY" "JWT_SECRET")
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^$var=" "$PROJECT_ROOT/.env"; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo -e "${RED}Missing required environment variables:${NC}"
        printf '%s\n' "${MISSING_VARS[@]}"
        return 1
    fi
    
    echo -e "${GREEN}Environment validation passed!${NC}"
    return 0
}

# Main menu
show_menu() {
    echo ""
    echo "Select an option:"
    echo "1) Clean up stopped containers"
    echo "2) Build Docker image"
    echo "3) Run interactive shell"
    echo "4) Run with verbose logging"
    echo "5) Test with minimal config"
    echo "6) Check container logs"
    echo "7) Validate environment"
    echo "8) Full debug cycle (clean, build, validate, run)"
    echo "9) Exit"
    echo ""
}

# Full debug cycle
full_debug() {
    cleanup_containers
    validate_env || return 1
    build_image
    echo -e "${YELLOW}Starting container with verbose logging...${NC}"
    run_verbose
}

# Main loop
if [ "$1" = "--full" ]; then
    full_debug
    exit 0
fi

while true; do
    show_menu
    read -p "Enter choice [1-9]: " choice
    
    case $choice in
        1) cleanup_containers ;;
        2) build_image ;;
        3) run_interactive ;;
        4) run_verbose ;;
        5) test_minimal ;;
        6) check_logs ;;
        7) validate_env ;;
        8) full_debug ;;
        9) echo "Exiting..."; exit 0 ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
done