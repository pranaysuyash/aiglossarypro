#!/bin/bash
set -euo pipefail

# Stop EC2 Server Script
# Stops the EC2 instance to save costs

# Load instance ID from config or environment
INSTANCE_ID="${INSTANCE_ID:-}"
REGION="${AWS_REGION:-us-east-1}"
FORCE="${FORCE:-0}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check for instance ID
if [ -z "$INSTANCE_ID" ]; then
    # Try to load from local config
    if [ -f ~/.aiglossarypro/config ]; then
        source ~/.aiglossarypro/config
    fi
fi

if [ -z "$INSTANCE_ID" ]; then
    echo -e "${RED}❌ ERROR: INSTANCE_ID not set${NC}"
    echo "Set it via environment variable or create ~/.aiglossarypro/config with:"
    echo "  INSTANCE_ID=i-xxxxxxxxxxxxxxxxx"
    exit 1
fi

echo -e "${YELLOW}🛑 Stopping EC2 Server${NC}"
echo "Instance ID: $INSTANCE_ID"
echo "Region: $REGION"
echo ""

# Check current state
CURRENT_STATE=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION" \
    --query 'Reservations[0].Instances[0].State.Name' \
    --output text 2>/dev/null || echo "unknown")

echo "Current state: $CURRENT_STATE"

if [ "$CURRENT_STATE" = "stopped" ]; then
    echo -e "${GREEN}✅ Instance is already stopped${NC}"
elif [ "$CURRENT_STATE" = "running" ]; then
    # Confirm before stopping unless forced
    if [ "$FORCE" != "1" ]; then
        echo -e "${YELLOW}⚠️  This will stop the server and make the site unavailable${NC}"
        echo -n "Are you sure you want to stop the server? (y/N): "
        read -r CONFIRM
        
        if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
            echo "Cancelled"
            exit 0
        fi
    fi
    
    echo -e "${YELLOW}Stopping instance...${NC}"
    
    aws ec2 stop-instances \
        --instance-ids "$INSTANCE_ID" \
        --region "$REGION" \
        --output json > /dev/null
    
    echo "Waiting for instance to stop..."
    aws ec2 wait instance-stopped \
        --instance-ids "$INSTANCE_ID" \
        --region "$REGION"
    
    echo -e "${GREEN}✅ Instance stopped successfully${NC}"
else
    echo -e "${RED}❌ Unexpected state: $CURRENT_STATE${NC}"
    exit 1
fi

# Calculate cost savings
echo ""
echo "💰 Cost Savings:"
echo "  While stopped: ~\$0.50/day saved (t3.small)"
echo "  Elastic IP cost while stopped: ~\$0.12/day"
echo "  Net savings: ~\$0.38/day"
echo ""
echo "To restart the server:"
echo "  ./server-start.sh"