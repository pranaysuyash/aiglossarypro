#!/bin/bash
set -euo pipefail

# Server Status Script
# Shows the current status of the EC2 server and application

# Load instance ID from config or environment
INSTANCE_ID="${INSTANCE_ID:-}"
REGION="${AWS_REGION:-us-east-1}"
DOMAIN="${DOMAIN:-aiglossarypro.com}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check for instance ID
if [ -z "$INSTANCE_ID" ]; then
    # Try to load from local config
    if [ -f ~/.aiglossarypro/config ]; then
        source ~/.aiglossarypro/config
    fi
fi

echo -e "${BLUE}📊 Server Status${NC}"
echo "================"
echo ""

# EC2 Instance Status
if [ -n "$INSTANCE_ID" ]; then
    echo -e "${YELLOW}EC2 Instance${NC}"
    echo "Instance ID: $INSTANCE_ID"
    
    # Get instance details
    INSTANCE_INFO=$(aws ec2 describe-instances \
        --instance-ids "$INSTANCE_ID" \
        --region "$REGION" \
        --query 'Reservations[0].Instances[0].{State:State.Name,Type:InstanceType,PublicIP:PublicIpAddress,PrivateIP:PrivateIpAddress,LaunchTime:LaunchTime}' \
        --output json 2>/dev/null || echo "{}")
    
    STATE=$(echo "$INSTANCE_INFO" | jq -r '.State // "unknown"')
    TYPE=$(echo "$INSTANCE_INFO" | jq -r '.Type // "unknown"')
    PUBLIC_IP=$(echo "$INSTANCE_INFO" | jq -r '.PublicIP // "none"')
    LAUNCH_TIME=$(echo "$INSTANCE_INFO" | jq -r '.LaunchTime // "unknown"')
    
    echo -n "State: "
    if [ "$STATE" = "running" ]; then
        echo -e "${GREEN}$STATE ✅${NC}"
    elif [ "$STATE" = "stopped" ]; then
        echo -e "${YELLOW}$STATE ⚠️${NC}"
    else
        echo -e "${RED}$STATE ❌${NC}"
    fi
    
    echo "Type: $TYPE"
    echo "Public IP: $PUBLIC_IP"
    
    if [ "$STATE" = "running" ] && [ "$LAUNCH_TIME" != "unknown" ]; then
        # Calculate uptime
        LAUNCH_EPOCH=$(date -d "$LAUNCH_TIME" +%s 2>/dev/null || echo 0)
        NOW_EPOCH=$(date +%s)
        if [ $LAUNCH_EPOCH -gt 0 ]; then
            UPTIME_SECONDS=$((NOW_EPOCH - LAUNCH_EPOCH))
            UPTIME_DAYS=$((UPTIME_SECONDS / 86400))
            UPTIME_HOURS=$(((UPTIME_SECONDS % 86400) / 3600))
            echo "Uptime: ${UPTIME_DAYS}d ${UPTIME_HOURS}h"
        fi
    fi
    
    # Get CloudWatch metrics if running
    if [ "$STATE" = "running" ]; then
        echo ""
        echo -e "${YELLOW}Resource Usage (last 5 min)${NC}"
        
        # CPU Usage
        CPU=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/EC2 \
            --metric-name CPUUtilization \
            --dimensions Name=InstanceId,Value="$INSTANCE_ID" \
            --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
            --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
            --period 300 \
            --statistics Average \
            --region "$REGION" \
            --query 'Datapoints[0].Average' \
            --output text 2>/dev/null || echo "N/A")
        
        if [ "$CPU" != "N/A" ] && [ "$CPU" != "None" ]; then
            CPU_INT=$(echo "$CPU" | cut -d. -f1)
            echo -n "CPU: "
            if [ "$CPU_INT" -lt 50 ]; then
                echo -e "${GREEN}${CPU_INT}% ✅${NC}"
            elif [ "$CPU_INT" -lt 80 ]; then
                echo -e "${YELLOW}${CPU_INT}% ⚠️${NC}"
            else
                echo -e "${RED}${CPU_INT}% ❌${NC}"
            fi
        else
            echo "CPU: N/A"
        fi
    fi
else
    echo -e "${YELLOW}⚠️ No instance ID configured${NC}"
fi

# Application Status
echo ""
echo -e "${YELLOW}Application Status${NC}"

# Check if domain is reachable
echo -n "Website (https://$DOMAIN): "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Online${NC}"
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}❌ Unreachable${NC}"
else
    echo -e "${YELLOW}⚠️ HTTP $HTTP_CODE${NC}"
fi

echo -n "API Health: "
API_STATUS=$(curl -s "https://$DOMAIN/api/health" 2>/dev/null | jq -r '.status // "error"' 2>/dev/null || echo "error")
if [ "$API_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Not responding${NC}"
fi

# Cost Information
echo ""
echo -e "${YELLOW}💰 Cost Information${NC}"

if [ "$STATE" = "running" ]; then
    echo "Current cost: ~\$0.50/day (t3.small running)"
    echo "To save costs: ./server-stop.sh"
elif [ "$STATE" = "stopped" ]; then
    echo "Current cost: ~\$0.12/day (Elastic IP only)"
    echo "To start server: ./server-start.sh"
else
    echo "Unable to determine cost"
fi

# Monthly cost estimate
echo ""
echo "Monthly estimates:"
echo "  24/7 running: ~\$15.12"
echo "  12 hrs/day: ~\$7.56"
echo "  Stopped: ~\$3.60 (Elastic IP)"

# Quick Actions
echo ""
echo -e "${BLUE}Quick Actions${NC}"
echo "============="

if [ "$STATE" = "running" ]; then
    echo "SSH to server:"
    echo "  ssh -i ~/.ssh/your-key.pem ec2-user@$PUBLIC_IP"
    echo ""
    echo "Stop server (save costs):"
    echo "  ./server-stop.sh"
elif [ "$STATE" = "stopped" ]; then
    echo "Start server:"
    echo "  ./server-start.sh"
fi

echo ""
echo "Verify deployment:"
echo "  ./verify-ec2-deployment.sh"
echo ""
echo "View this status:"
echo "  ./server-status.sh"