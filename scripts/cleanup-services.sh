#!/bin/bash

# Cleanup script for Docker containers and AWS ECS services
# This script helps clean up failed deployments and orphaned resources

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Service Cleanup Script${NC}"
echo "======================"

# Configuration
PROJECT_NAME="aiglossarypro"
ECS_CLUSTER="default"
ECS_SERVICE="aiglossarypro-api"
ECR_REPO="927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api"
AWS_REGION="us-east-1"

# Function to cleanup local Docker resources
cleanup_docker() {
    echo -e "\n${GREEN}Cleaning up local Docker resources...${NC}"
    
    # Stop running containers
    echo -e "${YELLOW}Stopping containers with name pattern: ${PROJECT_NAME}${NC}"
    docker ps -a --filter "name=${PROJECT_NAME}" --format "{{.Names}}" | while read container; do
        echo "  Stopping: $container"
        docker stop "$container" 2>/dev/null || true
        docker rm "$container" 2>/dev/null || true
    done
    
    # Remove dangling images
    echo -e "${YELLOW}Removing dangling images...${NC}"
    docker image prune -f
    
    # Remove project-specific images
    echo -e "${YELLOW}Removing project images...${NC}"
    docker images --filter "reference=${PROJECT_NAME}*" --format "{{.Repository}}:{{.Tag}}" | while read image; do
        echo "  Removing: $image"
        docker rmi "$image" 2>/dev/null || true
    done
    
    # Clean build cache
    echo -e "${YELLOW}Cleaning Docker build cache...${NC}"
    docker builder prune -f
    
    echo -e "${GREEN}Local Docker cleanup complete!${NC}"
}

# Function to check AWS CLI
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}AWS CLI not found. Skipping ECS cleanup.${NC}"
        return 1
    fi
    
    # Check if we have valid credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}AWS credentials not configured. Skipping ECS cleanup.${NC}"
        return 1
    fi
    
    return 0
}

# Function to cleanup ECS resources
cleanup_ecs() {
    echo -e "\n${GREEN}Cleaning up ECS resources...${NC}"
    
    if ! check_aws_cli; then
        return
    fi
    
    # Check if service exists
    if aws ecs describe-services --cluster "$ECS_CLUSTER" --services "$ECS_SERVICE" --region "$AWS_REGION" 2>/dev/null | grep -q "serviceName"; then
        echo -e "${YELLOW}Found ECS service: $ECS_SERVICE${NC}"
        
        # Update service to 0 desired count
        echo "  Setting desired count to 0..."
        aws ecs update-service \
            --cluster "$ECS_CLUSTER" \
            --service "$ECS_SERVICE" \
            --desired-count 0 \
            --region "$AWS_REGION" \
            --no-cli-pager 2>/dev/null || true
        
        # Stop all running tasks
        echo "  Stopping running tasks..."
        aws ecs list-tasks \
            --cluster "$ECS_CLUSTER" \
            --service-name "$ECS_SERVICE" \
            --region "$AWS_REGION" \
            --query 'taskArns[]' \
            --output text | tr '\t' '\n' | while read task; do
            if [ ! -z "$task" ]; then
                echo "    Stopping task: ${task##*/}"
                aws ecs stop-task \
                    --cluster "$ECS_CLUSTER" \
                    --task "$task" \
                    --region "$AWS_REGION" \
                    --no-cli-pager 2>/dev/null || true
            fi
        done
        
        # Optionally delete the service
        read -p "Delete ECS service $ECS_SERVICE? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "  Deleting service..."
            aws ecs delete-service \
                --cluster "$ECS_CLUSTER" \
                --service "$ECS_SERVICE" \
                --force \
                --region "$AWS_REGION" \
                --no-cli-pager 2>/dev/null || true
        fi
    else
        echo -e "${YELLOW}No ECS service found: $ECS_SERVICE${NC}"
    fi
    
    echo -e "${GREEN}ECS cleanup complete!${NC}"
}

# Function to cleanup ECR images
cleanup_ecr() {
    echo -e "\n${GREEN}Cleaning up ECR images...${NC}"
    
    if ! check_aws_cli; then
        return
    fi
    
    # List untagged images
    echo -e "${YELLOW}Finding untagged images in ECR...${NC}"
    UNTAGGED_IMAGES=$(aws ecr list-images \
        --repository-name "${ECR_REPO##*/}" \
        --filter tagStatus=UNTAGGED \
        --region "$AWS_REGION" \
        --query 'imageIds[?imageDigest!=null].[imageDigest]' \
        --output text 2>/dev/null || echo "")
    
    if [ ! -z "$UNTAGGED_IMAGES" ]; then
        IMAGE_COUNT=$(echo "$UNTAGGED_IMAGES" | wc -l)
        echo "  Found $IMAGE_COUNT untagged images"
        
        read -p "Delete untagged ECR images? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "$UNTAGGED_IMAGES" | while read digest; do
                if [ ! -z "$digest" ]; then
                    echo "  Deleting image: $digest"
                    aws ecr batch-delete-image \
                        --repository-name "${ECR_REPO##*/}" \
                        --image-ids imageDigest="$digest" \
                        --region "$AWS_REGION" \
                        --no-cli-pager 2>/dev/null || true
                fi
            done
        fi
    else
        echo -e "${YELLOW}No untagged images found${NC}"
    fi
    
    echo -e "${GREEN}ECR cleanup complete!${NC}"
}

# Function to show container logs
show_recent_logs() {
    echo -e "\n${GREEN}Recent container logs:${NC}"
    
    # Local Docker logs
    RECENT_CONTAINER=$(docker ps -a --filter "name=${PROJECT_NAME}" --format "{{.Names}}" | head -1)
    if [ ! -z "$RECENT_CONTAINER" ]; then
        echo -e "${YELLOW}Last 20 lines from: $RECENT_CONTAINER${NC}"
        docker logs "$RECENT_CONTAINER" --tail 20 2>&1 || true
    fi
    
    # ECS logs (if available)
    if check_aws_cli; then
        echo -e "\n${YELLOW}Recent ECS task failures:${NC}"
        aws ecs list-tasks \
            --cluster "$ECS_CLUSTER" \
            --desired-status STOPPED \
            --region "$AWS_REGION" \
            --query 'taskArns[0:3]' \
            --output text | tr '\t' '\n' | while read task; do
            if [ ! -z "$task" ]; then
                echo "  Task: ${task##*/}"
                aws ecs describe-tasks \
                    --cluster "$ECS_CLUSTER" \
                    --tasks "$task" \
                    --region "$AWS_REGION" \
                    --query 'tasks[0].stoppedReason' \
                    --output text 2>/dev/null || echo "    No stop reason available"
            fi
        done
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "Select cleanup option:"
    echo "1) Clean local Docker resources only"
    echo "2) Clean ECS resources only"
    echo "3) Clean ECR untagged images"
    echo "4) Show recent container logs"
    echo "5) Full cleanup (Docker + ECS + ECR)"
    echo "6) Exit"
    echo ""
}

# Parse command line arguments
if [ "$1" = "--all" ]; then
    cleanup_docker
    cleanup_ecs
    cleanup_ecr
    exit 0
elif [ "$1" = "--docker" ]; then
    cleanup_docker
    exit 0
elif [ "$1" = "--ecs" ]; then
    cleanup_ecs
    exit 0
elif [ "$1" = "--logs" ]; then
    show_recent_logs
    exit 0
fi

# Interactive menu
while true; do
    show_menu
    read -p "Enter choice [1-6]: " choice
    
    case $choice in
        1) cleanup_docker ;;
        2) cleanup_ecs ;;
        3) cleanup_ecr ;;
        4) show_recent_logs ;;
        5) 
            cleanup_docker
            cleanup_ecs
            cleanup_ecr
            ;;
        6) echo "Exiting..."; exit 0 ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
done