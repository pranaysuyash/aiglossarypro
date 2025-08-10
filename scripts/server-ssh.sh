#!/bin/bash
set -euo pipefail

# SSH to EC2 Server Script
# Connects to the EC2 instance via SSH

# Load config
INSTANCE_ID="${INSTANCE_ID:-}"
REGION="${AWS_REGION:-us-east-1}"
KEY_PATH="${KEY_PATH:-}"
SSH_USER="${SSH_USER:-ec2-user}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check for config
if [ -z "$INSTANCE_ID" ] || [ -z "$KEY_PATH" ]; then
    # Try to load from local config
    if [ -f ~/.aiglossarypro/config ]; then
        source ~/.aiglossarypro/config
    fi
fi

if [ -z "$INSTANCE_ID" ]; then
    echo -e "${RED}❌ ERROR: INSTANCE_ID not set${NC}"
    echo "Set it via environment variable or create ~/.aiglossarypro/config"
    exit 1
fi

if [ -z "$KEY_PATH" ]; then
    echo -e "${RED}❌ ERROR: KEY_PATH not set${NC}"
    echo "Set it to the path of your SSH private key"
    exit 1
fi

if [ ! -f "$KEY_PATH" ]; then
    echo -e "${RED}❌ ERROR: SSH key not found at $KEY_PATH${NC}"
    exit 1
fi

# Get instance state and IP
echo -e "${YELLOW}Connecting to EC2 instance...${NC}"

INSTANCE_INFO=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION" \
    --query 'Reservations[0].Instances[0].{State:State.Name,PublicIP:PublicIpAddress}' \
    --output json 2>/dev/null || echo "{}")

STATE=$(echo "$INSTANCE_INFO" | jq -r '.State // "unknown"')
PUBLIC_IP=$(echo "$INSTANCE_INFO" | jq -r '.PublicIP // "none"')

if [ "$STATE" != "running" ]; then
    echo -e "${RED}❌ Instance is not running (state: $STATE)${NC}"
    echo "Start it first with: ./server-start.sh"
    exit 1
fi

if [ "$PUBLIC_IP" = "none" ] || [ "$PUBLIC_IP" = "null" ]; then
    echo -e "${RED}❌ No public IP found${NC}"
    exit 1
fi

echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo "Connecting as: $SSH_USER"
echo ""

# Connect via SSH
echo -e "${GREEN}Connecting...${NC}"
echo "----------------------------------------"
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$SSH_USER@$PUBLIC_IP"