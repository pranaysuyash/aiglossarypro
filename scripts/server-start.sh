#!/bin/bash
set -euo pipefail

# Start EC2 Server Script
# Starts the EC2 instance and waits for it to be ready

# Load instance ID from config or environment
INSTANCE_ID="${INSTANCE_ID:-}"
REGION="${AWS_REGION:-us-east-1}"

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
    echo "  ELASTIC_IP=xx.xxx.xxx.xxx"
    exit 1
fi

echo -e "${YELLOW}🚀 Starting EC2 Server${NC}"
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

if [ "$CURRENT_STATE" = "running" ]; then
    echo -e "${GREEN}✅ Instance is already running${NC}"
elif [ "$CURRENT_STATE" = "stopped" ]; then
    echo -e "${YELLOW}Starting instance...${NC}"
    
    aws ec2 start-instances \
        --instance-ids "$INSTANCE_ID" \
        --region "$REGION" \
        --output json > /dev/null
    
    echo "Waiting for instance to be running..."
    aws ec2 wait instance-running \
        --instance-ids "$INSTANCE_ID" \
        --region "$REGION"
    
    echo -e "${GREEN}✅ Instance started successfully${NC}"
    
    # Get public IP
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids "$INSTANCE_ID" \
        --region "$REGION" \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)
    
    echo "Public IP: $PUBLIC_IP"
    
    # Wait for SSH to be ready
    echo -e "${YELLOW}Waiting for SSH to be ready...${NC}"
    MAX_ATTEMPTS=30
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if nc -zv "$PUBLIC_IP" 22 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ SSH is ready${NC}"
            break
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            echo -e "${YELLOW}⚠️ SSH may not be ready yet${NC}"
            break
        fi
        
        echo -n "."
        sleep 5
    done
    
    echo ""
    echo -e "${GREEN}✅ Server is ready!${NC}"
else
    echo -e "${RED}❌ Unexpected state: $CURRENT_STATE${NC}"
    exit 1
fi

# Display access information
echo ""
echo "Access your application:"
echo "  🌐 Website: https://aiglossarypro.com"
echo "  🔌 API: https://aiglossarypro.com/api/health"
echo ""
echo "SSH access:"
if [ -n "${KEY_PATH:-}" ]; then
    echo "  ssh -i $KEY_PATH ec2-user@$PUBLIC_IP"
else
    echo "  ssh -i ~/.ssh/your-key.pem ec2-user@$PUBLIC_IP"
fi
echo ""
echo "To check status on the server:"
echo "  ./check-status.sh"
echo ""
echo "To stop the server (save costs):"
echo "  ./server-stop.sh"