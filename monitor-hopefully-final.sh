#!/bin/bash

# Monitor the hopefully final successful deployment
SERVICE_ARN="arn:aws:apprunner:us-east-1:927289246324:service/aiglossarypro-api-working/e8204a2d19574b82be975d4b669168de"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Monitoring Deployment - Simple Runtime Command${NC}"
echo "Service: aiglossarypro-api-working"
echo "URL: https://p9mwh22fhi.us-east-1.awsapprunner.com"
echo ""
echo "Critical fix:"
echo "  ✅ Simplified runtime command to: node dist/test-minimal.js"
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
        HEALTH_RESPONSE=$(curl -s -m 10 "https://p9mwh22fhi.us-east-1.awsapprunner.com/health" 2>/dev/null)
        
        if [ $? -eq 0 ] && [ -n "$HEALTH_RESPONSE" ]; then
            echo -e "${GREEN}✅ Health check passed!${NC}"
            echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
            
            echo ""
            echo -e "${GREEN}🎉 🎉 🎉 DEPLOYMENT SUCCESSFUL! 🎉 🎉 🎉${NC}"
            echo ""
            echo -e "${GREEN}AIGlossaryPro API is now running on AWS App Runner!${NC}"
            echo ""
            echo "🌐 Service URL: https://p9mwh22fhi.us-east-1.awsapprunner.com"
            echo "❤️  Health: https://p9mwh22fhi.us-east-1.awsapprunner.com/health"
            echo ""
            echo "✅ Successfully deployed with:"
            echo "  - CommonJS build"
            echo "  - Runtime dependencies"
            echo "  - Minimal test server"
            echo "  - Simple runtime command"
            echo ""
            echo "Next steps:"
            echo "  1. Deploy the full application (change from test-minimal.js to index.js)"
            echo "  2. Configure real database"
            echo "  3. Set up authentication"
        else
            echo -e "${YELLOW}⚠️  Health check failed${NC}"
        fi
        
        exit 0
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo -e "${RED}[$TIMESTAMP] ❌ Deployment failed with status: $STATUS${NC}"
        
        echo ""
        echo "Checking for errors..."
        LOG_GROUP="/aws/apprunner/aiglossarypro-api-working/e8204a2d19574b82be975d4b669168de/service"
        
        # This time, check for application logs
        echo "Application logs (if any):"
        aws logs describe-log-streams --log-group-name "$LOG_GROUP" --log-stream-name-prefix "application" --query "logStreams[*].logStreamName" --output json 2>/dev/null
        
        aws logs tail "$LOG_GROUP" --since 15m 2>/dev/null | grep -E "(error|Error|exit|crash)" | tail -20
        
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