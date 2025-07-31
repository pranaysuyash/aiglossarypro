#!/bin/bash

# Monitor specific App Runner service deployment
SERVICE_ARN="arn:aws:apprunner:us-east-1:927289246324:service/aiglossarypro-api/afc2703bae2b4e9fb49b8476a119f208"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Monitoring App Runner Deployment${NC}"
echo "Service: aiglossarypro-api"
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
        
        # Get service URL
        SERVICE_URL=$(aws apprunner describe-service \
            --service-arn "$SERVICE_ARN" \
            --query "Service.ServiceUrl" \
            --output text)
        
        echo -e "${GREEN}Service URL: https://$SERVICE_URL${NC}"
        echo ""
        echo "Testing health endpoint..."
        curl -s "https://$SERVICE_URL/health" | jq . || echo "Health check not ready yet"
        
        exit 0
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo -e "${RED}[$TIMESTAMP] ❌ Deployment failed with status: $STATUS${NC}"
        
        echo ""
        echo "Checking CloudWatch logs for errors..."
        aws logs tail "/aws/apprunner/aiglossarypro-api/service" --since 10m 2>/dev/null | head -50
        
        exit 1
    else
        echo -e "${YELLOW}[$TIMESTAMP] Status: $STATUS (Elapsed: ${elapsed}s)${NC}"
    fi
    
    # Stop after 30 minutes
    if [ $elapsed -gt 1800 ]; then
        echo -e "${RED}Timeout: Deployment took too long${NC}"
        exit 1
    fi
    
    # Wait before next check
    sleep 30
done