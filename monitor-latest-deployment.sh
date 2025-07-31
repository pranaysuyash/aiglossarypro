#!/bin/bash

# Monitor latest App Runner service deployment with all fixes
SERVICE_ARN="arn:aws:apprunner:us-east-1:927289246324:service/aiglossarypro-api-production/9a76d4f02e8144fabfcb9e8f06dcdfbb"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Monitoring Latest Production App Runner Deployment${NC}"
echo "Service: aiglossarypro-api-production"
echo "URL: https://7n5q5pufxj.us-east-1.awsapprunner.com"
echo "Fixes Applied:"
echo "  ✅ Environment variables added (DATABASE_URL, SESSION_SECRET)"
echo "  ✅ Simple auth enabled as fallback"
echo "  ✅ Config package exports fixed for CommonJS"
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
        HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "https://7n5q5pufxj.us-east-1.awsapprunner.com/health" 2>/dev/null)
        HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
        BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✅ Health check passed!${NC}"
            echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
            
            echo ""
            echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
            echo -e "${GREEN}Service is running at: https://7n5q5pufxj.us-east-1.awsapprunner.com${NC}"
            echo ""
            echo "Next steps:"
            echo "1. Update environment variables with real database connection"
            echo "2. Configure proper authentication (Firebase or OAuth)"
            echo "3. Set up monitoring and alerts"
        else
            echo -e "${YELLOW}⚠️  Health check returned: $HTTP_CODE${NC}"
            echo "Response body: $BODY"
        fi
        
        exit 0
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo -e "${RED}[$TIMESTAMP] ❌ Deployment failed with status: $STATUS${NC}"
        
        echo ""
        echo "Checking logs for errors..."
        
        # Get the service ID for log lookup
        SERVICE_ID="9a76d4f02e8144fabfcb9e8f06dcdfbb"
        LOG_GROUP="/aws/apprunner/aiglossarypro-api-production/$SERVICE_ID/service"
        
        # Try to get application logs if they exist
        echo "Checking for application logs..."
        aws logs tail "$LOG_GROUP" --log-stream-name-prefix "application" --since 10m 2>/dev/null | tail -50
        
        # Get deployment logs
        echo ""
        echo "Checking deployment logs..."
        aws logs tail "$LOG_GROUP" --log-stream-name-prefix "deployment" --since 10m 2>/dev/null | grep -E "(error|Error|ERROR|failed|Failed|exit)" | tail -30
        
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