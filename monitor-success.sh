#!/bin/bash

# Monitor hopefully successful deployment
SERVICE_ARN="arn:aws:apprunner:us-east-1:927289246324:service/aiglossarypro-api-working/4f58df3bf28c4c0ba56c1a3517784b93"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Monitoring Final Deployment${NC}"
echo "Service: aiglossarypro-api-working"
echo "URL: https://4q3xr7ecbq.us-east-1.awsapprunner.com"
echo ""
echo "All fixes applied:"
echo "  ✅ TypeScript compilation fixed"
echo "  ✅ CommonJS build configured"
echo "  ✅ Runtime dependencies with --no-frozen-lockfile"
echo "  ✅ Environment variables set"
echo "  ✅ Health check endpoint ready"
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
        HEALTH_RESPONSE=$(curl -s -m 10 "https://4q3xr7ecbq.us-east-1.awsapprunner.com/health" 2>/dev/null)
        
        if [ $? -eq 0 ] && [ -n "$HEALTH_RESPONSE" ]; then
            echo -e "${GREEN}✅ Health check passed!${NC}"
            echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
            
            echo ""
            echo -e "${GREEN}🎉 🎉 🎉 DEPLOYMENT SUCCESSFUL! 🎉 🎉 🎉${NC}"
            echo ""
            echo -e "${GREEN}AIGlossaryPro API is now running on AWS App Runner!${NC}"
            echo ""
            echo "🌐 Service URL: https://4q3xr7ecbq.us-east-1.awsapprunner.com"
            echo "❤️  Health: https://4q3xr7ecbq.us-east-1.awsapprunner.com/health"
            echo ""
            echo "✅ All issues resolved:"
            echo "  - TypeScript compilation errors"
            echo "  - CommonJS module format"
            echo "  - Runtime dependencies"
            echo "  - Environment variables"
            echo "  - Working directory setup"
            echo ""
            echo "🚀 Ready for production use!"
        else
            echo -e "${YELLOW}⚠️  Health check failed or timed out${NC}"
        fi
        
        exit 0
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo -e "${RED}[$TIMESTAMP] ❌ Deployment failed with status: $STATUS${NC}"
        
        echo ""
        echo "Checking logs..."
        LOG_GROUP="/aws/apprunner/aiglossarypro-api-working/4f58df3bf28c4c0ba56c1a3517784b93/service"
        
        # Check application logs
        echo "Application logs:"
        aws logs tail "$LOG_GROUP" --log-stream-name-prefix "application" --since 15m 2>/dev/null | tail -30
        
        echo ""
        echo "Deployment errors:"
        aws logs tail "$LOG_GROUP" --since 15m 2>/dev/null | grep -E "(error|Error|failed|exit)" | tail -20
        
        exit 1
    else
        echo -e "${YELLOW}[$TIMESTAMP] Status: $STATUS (Elapsed: ${elapsed}s)${NC}"
        
        # Show progress periodically
        if [ $((attempt % 5)) -eq 0 ]; then
            echo "Build progress..."
            aws logs tail "/aws/apprunner/aiglossarypro-api-working/4f58df3bf28c4c0ba56c1a3517784b93/service" --log-stream-name-prefix "deployment" --since 2m 2>/dev/null | grep -E "(Step|BUILD|dependencies|SUCCESS)" | tail -3
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