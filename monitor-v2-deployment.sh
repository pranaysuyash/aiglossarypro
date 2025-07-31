#!/bin/bash

# Monitor v2 App Runner service deployment with all fixes
SERVICE_ARN="arn:aws:apprunner:us-east-1:927289246324:service/aiglossarypro-api-v2/051a9307fc054a23b26bb4c447a9b151"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Monitoring App Runner V2 Deployment (Fresh Build)${NC}"
echo "Service: aiglossarypro-api-v2"
echo "URL: https://j3peeeapbk.us-east-1.awsapprunner.com"
echo ""
echo "Critical Fixes Applied:"
echo "  ✅ Environment variables (DATABASE_URL, SESSION_SECRET, JWT_SECRET)"
echo "  ✅ Simple auth enabled as fallback"
echo "  ✅ Config package exports fixed for CommonJS"
echo "  ✅ Fresh build without cache"
echo ""

start_time=$(date +%s)
attempt=0

while true; do
    attempt=$((attempt + 1))
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    # Get service status
    STATUS=$(aws apprunner describe-service \
        --service-arn "$SERVICE_ARN" \
        --query "Service.Status" \
        --output text 2>/dev/null)
    
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ -z "$STATUS" ]; then
        echo -e "${RED}[$TIMESTAMP] Failed to get status${NC}"
    elif [ "$STATUS" = "RUNNING" ]; then
        echo -e "${GREEN}[$TIMESTAMP] ✅ DEPLOYMENT SUCCESSFUL! Service is RUNNING${NC}"
        echo ""
        
        # Test health endpoint
        echo "Testing health endpoint..."
        HEALTH_RESPONSE=$(curl -s -m 10 -w "\n%{http_code}" "https://j3peeeapbk.us-east-1.awsapprunner.com/health" 2>/dev/null)
        HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
        BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✅ Health check passed!${NC}"
            echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
            
            echo ""
            echo -e "${GREEN}🎉 🎉 🎉 DEPLOYMENT SUCCESSFUL! 🎉 🎉 🎉${NC}"
            echo ""
            echo -e "${GREEN}Service is live at: https://j3peeeapbk.us-east-1.awsapprunner.com${NC}"
            echo ""
            echo "Quick test URLs:"
            echo "  - Health: https://j3peeeapbk.us-east-1.awsapprunner.com/health"
            echo "  - API Docs: https://j3peeeapbk.us-east-1.awsapprunner.com/api/docs"
        else
            echo -e "${YELLOW}⚠️  Health check returned: $HTTP_CODE${NC}"
            echo "Response: $BODY"
        fi
        
        exit 0
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo -e "${RED}[$TIMESTAMP] ❌ Deployment failed with status: $STATUS${NC}"
        
        echo ""
        echo "Getting failure details..."
        
        # Get the deployment ID
        DEPLOYMENT_ID="73cb3ed3b437436688fffbcd8139a41f"
        LOG_GROUP="/aws/apprunner/aiglossarypro-api-v2/051a9307fc054a23b26bb4c447a9b151/service"
        
        # Check application logs
        echo "Application logs:"
        aws logs tail "$LOG_GROUP" --log-stream-name-prefix "application" --since 15m 2>/dev/null | tail -30
        
        # Check for specific errors
        echo ""
        echo "Error details:"
        aws logs tail "$LOG_GROUP" --since 15m 2>/dev/null | grep -E "(exit code|failed to start|Error:|ERROR)" | tail -20
        
        exit 1
    else
        echo -e "${YELLOW}[$TIMESTAMP] Status: $STATUS (Elapsed: ${elapsed}s)${NC}"
        
        # Show build progress every 5th attempt
        if [ $((attempt % 5)) -eq 0 ]; then
            echo "Checking build progress..."
            aws logs tail "/aws/apprunner/aiglossarypro-api-v2/051a9307fc054a23b26bb4c447a9b151/service" --log-stream-name-prefix "deployment" --since 2m 2>/dev/null | grep -E "(Step [0-9]+|BUILD|Successfully)" | tail -5
        fi
    fi
    
    # Stop after 30 minutes
    if [ $elapsed -gt 1800 ]; then
        echo -e "${RED}Timeout: Deployment took too long${NC}"
        exit 1
    fi
    
    # Wait before next check
    sleep 30
done