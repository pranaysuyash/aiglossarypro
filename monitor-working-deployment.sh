#!/bin/bash

# Monitor deployment with proper dependency installation
SERVICE_ARN="arn:aws:apprunner:us-east-1:927289246324:service/aiglossarypro-minimal-test/062c433e78704701a0866560aaba6bd5"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Monitoring Deployment with Proper Dependencies${NC}"
echo "Service: aiglossarypro-minimal-test"
echo "URL: https://pnrfwrpvsv.us-east-1.awsapprunner.com"
echo ""
echo "Fix applied:"
echo "  ✅ Full pnpm install in post-build for runtime dependencies"
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
        echo -e "${GREEN}[$TIMESTAMP] ✅ SERVICE IS RUNNING!${NC}"
        echo ""
        
        # Test health endpoint
        echo "Testing health endpoint..."
        HEALTH_RESPONSE=$(curl -s -m 10 -w "\n%{http_code}" "https://pnrfwrpvsv.us-east-1.awsapprunner.com/health" 2>/dev/null)
        HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
        BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✅ Health check passed!${NC}"
            echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
            
            echo ""
            echo -e "${GREEN}🎉 🎉 🎉 DEPLOYMENT SUCCESSFUL! 🎉 🎉 🎉${NC}"
            echo ""
            echo -e "${GREEN}The AIGlossaryPro API is now running on AWS App Runner!${NC}"
            echo ""
            echo "Service URL: https://pnrfwrpvsv.us-east-1.awsapprunner.com"
            echo ""
            echo "Summary of what we fixed:"
            echo "  ✅ TypeScript build errors"
            echo "  ✅ CommonJS compatibility"
            echo "  ✅ Runtime dependencies installation"
            echo "  ✅ Environment variables"
            echo "  ✅ Health check endpoint"
            echo ""
            echo "Next steps:"
            echo "  1. Deploy the full application (not just minimal test)"
            echo "  2. Configure real database connection"
            echo "  3. Set up proper authentication"
            echo "  4. Enable monitoring and alerts"
        else
            echo -e "${YELLOW}⚠️  Health check returned: $HTTP_CODE${NC}"
            echo "Response: $BODY"
        fi
        
        exit 0
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo -e "${RED}[$TIMESTAMP] ❌ Deployment failed with status: $STATUS${NC}"
        
        echo ""
        echo "Checking logs..."
        LOG_GROUP="/aws/apprunner/aiglossarypro-minimal-test/062c433e78704701a0866560aaba6bd5/service"
        
        # Check for any errors
        aws logs tail "$LOG_GROUP" --since 15m 2>/dev/null | grep -E "(error|Error|failed|exit)" | tail -30
        
        exit 1
    else
        echo -e "${YELLOW}[$TIMESTAMP] Status: $STATUS (Elapsed: ${elapsed}s)${NC}"
        
        # Show dependency installation progress
        if [ $((attempt % 5)) -eq 0 ]; then
            echo "Checking dependency installation..."
            aws logs tail "/aws/apprunner/aiglossarypro-minimal-test/062c433e78704701a0866560aaba6bd5/service" --log-stream-name-prefix "deployment" --since 2m 2>/dev/null | grep -E "(pnpm install|node_modules|dependencies)" | tail -5
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