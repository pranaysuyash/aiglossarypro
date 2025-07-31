#!/bin/bash

# Monitor final App Runner service deployment
SERVICE_ARN="arn:aws:apprunner:us-east-1:927289246324:service/aiglossarypro-api-final/bfdc4227ae6c4b97b075c07134f60762"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Monitoring Final App Runner Deployment${NC}"
echo "Service: aiglossarypro-api-final"
echo "URL: https://3wn9gr5wrp.us-east-1.awsapprunner.com"
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
        HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://3wn9gr5wrp.us-east-1.awsapprunner.com/health")
        
        if [ "$HEALTH_RESPONSE" = "200" ]; then
            echo -e "${GREEN}✅ Health check passed!${NC}"
            curl -s "https://3wn9gr5wrp.us-east-1.awsapprunner.com/health" | jq .
        else
            echo -e "${YELLOW}⚠️  Health check returned: $HEALTH_RESPONSE${NC}"
        fi
        
        exit 0
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo -e "${RED}[$TIMESTAMP] ❌ Deployment failed with status: $STATUS${NC}"
        
        echo ""
        echo "Checking logs for errors..."
        LOG_GROUP="/aws/apprunner/aiglossarypro-api-final/$SERVICE_ID/service"
        
        # Try to find build logs
        aws logs describe-log-streams \
            --log-group-name "$LOG_GROUP" \
            --order-by LastEventTime \
            --descending \
            --limit 5 2>/dev/null | jq -r '.logStreams[].logStreamName' | while read stream; do
            echo "Stream: $stream"
            aws logs tail "$LOG_GROUP" --log-stream-name "$stream" --since 10m 2>/dev/null | head -30
            echo "---"
        done
        
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