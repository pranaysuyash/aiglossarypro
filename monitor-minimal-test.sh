#!/bin/bash

# Monitor minimal test App Runner deployment
SERVICE_ARN="arn:aws:apprunner:us-east-1:927289246324:service/aiglossarypro-minimal-test/7485877c550a4ad0b753b53738d3eeb7"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Monitoring Minimal Test Deployment${NC}"
echo "Service: aiglossarypro-minimal-test"
echo "URL: https://braxv25vsj.us-east-1.awsapprunner.com"
echo ""
echo "This is a minimal test with:"
echo "  - Simple Express server"
echo "  - Only /health endpoint"  
echo "  - No complex dependencies"
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
        HEALTH_RESPONSE=$(curl -s -m 10 "https://braxv25vsj.us-east-1.awsapprunner.com/health" 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Health check passed!${NC}"
            echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
            
            echo ""
            echo -e "${GREEN}🎉 MINIMAL TEST SUCCESSFUL!${NC}"
            echo ""
            echo "This proves:"
            echo "  ✅ App Runner can deploy and run our app"
            echo "  ✅ CommonJS build works"
            echo "  ✅ Health check endpoint works"
            echo ""
            echo "Next: Fix the full app startup issues"
        else
            echo -e "${RED}❌ Health check failed${NC}"
        fi
        
        exit 0
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo -e "${RED}[$TIMESTAMP] ❌ Deployment failed with status: $STATUS${NC}"
        
        echo ""
        echo "Checking for errors..."
        LOG_GROUP="/aws/apprunner/aiglossarypro-minimal-test/7485877c550a4ad0b753b53738d3eeb7/service"
        
        # Check runtime errors
        echo "Runtime errors:"
        aws logs tail "$LOG_GROUP" --since 15m 2>/dev/null | grep -E "(exit code|Error:|failed)" | tail -20
        
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