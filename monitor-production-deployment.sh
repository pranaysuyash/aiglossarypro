#!/bin/bash

# Monitor production App Runner service deployment
SERVICE_ARN="arn:aws:apprunner:us-east-1:927289246324:service/aiglossarypro-api-production/195e15dca78b48cca9e9b5cfb7760968"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Monitoring Production App Runner Deployment${NC}"
echo "Service: aiglossarypro-api-production"
echo "URL: https://2arbdqppdt.us-east-1.awsapprunner.com"
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
        echo -e "${GREEN}[$TIMESTAMP] ✅ Deployment successful! Service is RUNNING${NC}"
        
        # Test health endpoint
        echo ""
        echo "Testing health endpoint..."
        HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "https://2arbdqppdt.us-east-1.awsapprunner.com/health" 2>/dev/null)
        HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
        BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✅ Health check passed!${NC}"
            echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
        else
            echo -e "${YELLOW}⚠️  Health check returned: $HTTP_CODE${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
        echo -e "${GREEN}Service URL: https://2arbdqppdt.us-east-1.awsapprunner.com${NC}"
        
        exit 0
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo -e "${RED}[$TIMESTAMP] ❌ Deployment failed with status: $STATUS${NC}"
        
        echo ""
        echo "Checking logs for errors..."
        
        # Get the service ID for log lookup
        SERVICE_ID="195e15dca78b48cca9e9b5cfb7760968"
        LOG_GROUP="/aws/apprunner/aiglossarypro-api-production/$SERVICE_ID/service"
        
        # Try to get recent logs
        aws logs tail "$LOG_GROUP" --since 10m 2>/dev/null | tail -50
        
        exit 1
    else
        echo -e "${YELLOW}[$TIMESTAMP] Status: $STATUS (Elapsed: ${elapsed}s, Attempt: $attempt)${NC}"
    fi
    
    # Stop after 30 minutes
    if [ $elapsed -gt 1800 ]; then
        echo -e "${RED}Timeout: Deployment took too long${NC}"
        exit 1
    fi
    
    # Wait before next check
    sleep 30
done