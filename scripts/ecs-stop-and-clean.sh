#!/bin/bash
set -euo pipefail

# ECS Stop and Clean Script
# Scales ECS service to 0 and optionally cleans up resources

# Configuration from environment
AWS_REGION="${AWS_REGION:-us-east-1}"
CLUSTER="${CLUSTER:-aiglossarypro}"
SERVICE="${SERVICE:-aiglossarypro-api-production}"
DELETE_SERVICE="${DELETE_SERVICE:-0}"
DELETE_TASK_DEFS="${DELETE_TASK_DEFS:-0}"
FAMILY="${FAMILY:-aiglossarypro-api}"
ECS_TG_ARN="${ECS_TG_ARN:-}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping ECS Service${NC}"
echo "Region: $AWS_REGION"
echo "Cluster: $CLUSTER"
echo "Service: $SERVICE"
echo ""

# Step 1: Scale service to 0
echo -e "${YELLOW}1️⃣ Scaling service to 0...${NC}"
aws ecs update-service \
    --cluster "$CLUSTER" \
    --service "$SERVICE" \
    --desired-count 0 \
    --region "$AWS_REGION" \
    --output json > /dev/null

# Wait for service to stabilize
echo "Waiting for service to stabilize..."
aws ecs wait services-stable \
    --cluster "$CLUSTER" \
    --services "$SERVICE" \
    --region "$AWS_REGION" || true

echo -e "${GREEN}✅ Service scaled to 0${NC}"

# Step 2: Optionally delete the service
if [ "$DELETE_SERVICE" = "1" ]; then
    echo -e "${YELLOW}2️⃣ Deleting service...${NC}"
    aws ecs delete-service \
        --cluster "$CLUSTER" \
        --service "$SERVICE" \
        --region "$AWS_REGION" \
        --output json > /dev/null
    echo -e "${GREEN}✅ Service deleted${NC}"
fi

# Step 3: Optionally deregister task definitions
if [ "$DELETE_TASK_DEFS" = "1" ] && [ -n "$FAMILY" ]; then
    echo -e "${YELLOW}3️⃣ Deregistering inactive task definitions...${NC}"
    
    # List all task definitions for the family
    TASK_DEFS=$(aws ecs list-task-definitions \
        --family-prefix "$FAMILY" \
        --status ACTIVE \
        --region "$AWS_REGION" \
        --query 'taskDefinitionArns[]' \
        --output text)
    
    if [ -n "$TASK_DEFS" ]; then
        COUNT=0
        for TD in $TASK_DEFS; do
            # Check if this task def is in use
            IN_USE=$(aws ecs list-services \
                --cluster "$CLUSTER" \
                --region "$AWS_REGION" \
                --query "serviceArns[?contains(@, '$TD')]" \
                --output text)
            
            if [ -z "$IN_USE" ]; then
                echo "  Deregistering: ${TD##*/}"
                aws ecs deregister-task-definition \
                    --task-definition "$TD" \
                    --region "$AWS_REGION" \
                    --output json > /dev/null || true
                ((COUNT++))
            fi
        done
        echo -e "${GREEN}✅ Deregistered $COUNT task definitions${NC}"
    else
        echo "No task definitions found for family: $FAMILY"
    fi
fi

# Step 4: Optionally delete ECS target group
if [ -n "$ECS_TG_ARN" ]; then
    echo -e "${YELLOW}4️⃣ Deleting ECS target group...${NC}"
    
    # First deregister all targets
    TARGETS=$(aws elbv2 describe-target-health \
        --target-group-arn "$ECS_TG_ARN" \
        --region "$AWS_REGION" \
        --query 'TargetHealthDescriptions[].Target.Id' \
        --output text 2>/dev/null || true)
    
    if [ -n "$TARGETS" ]; then
        echo "  Deregistering targets..."
        for TARGET in $TARGETS; do
            aws elbv2 deregister-targets \
                --target-group-arn "$ECS_TG_ARN" \
                --targets Id="$TARGET" \
                --region "$AWS_REGION" 2>/dev/null || true
        done
    fi
    
    # Delete the target group
    aws elbv2 delete-target-group \
        --target-group-arn "$ECS_TG_ARN" \
        --region "$AWS_REGION" 2>/dev/null && \
        echo -e "${GREEN}✅ Target group deleted${NC}" || \
        echo -e "${YELLOW}⚠️  Could not delete target group (may be in use)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 ECS cleanup complete!${NC}"
echo ""
echo "Summary:"
echo "- Service scaled to 0: ✅"
[ "$DELETE_SERVICE" = "1" ] && echo "- Service deleted: ✅"
[ "$DELETE_TASK_DEFS" = "1" ] && echo "- Task definitions cleaned: ✅"
[ -n "$ECS_TG_ARN" ] && echo "- Target group cleaned: ✅"
echo ""
echo "To restart ECS later:"
echo "  aws ecs update-service --cluster $CLUSTER --service $SERVICE --desired-count 1 --region $AWS_REGION"