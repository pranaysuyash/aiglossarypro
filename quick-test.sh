#!/bin/bash

# Quick Test Script - Run this to quickly verify deployment status

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get App Runner service URL
echo -e "${BLUE}🔍 Quick Deployment Test${NC}"
echo "========================"

# Check if APP_URL is set
if [ -z "$APP_URL" ]; then
    echo -e "${YELLOW}APP_URL not set. Trying to detect from AWS...${NC}"
    
    # Try to get URL from AWS CLI
    if command -v aws > /dev/null 2>&1; then
        SERVICE_URL=$(aws apprunner list-services --query "ServiceSummaryList[0].ServiceUrl" --output text 2>/dev/null)
        if [ "$SERVICE_URL" != "None" ] && [ -n "$SERVICE_URL" ]; then
            APP_URL="https://$SERVICE_URL"
            echo -e "${GREEN}Found service URL: $APP_URL${NC}"
        else
            echo -e "${RED}Could not detect service URL from AWS${NC}"
            echo "Please set: export APP_URL=https://your-app.awsapprunner.com"
            exit 1
        fi
    else
        echo -e "${RED}AWS CLI not found. Please set APP_URL manually:${NC}"
        echo "export APP_URL=https://your-app.awsapprunner.com"
        exit 1
    fi
fi

echo "Testing: $APP_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local name=$2
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$APP_URL$endpoint" 2>/dev/null)
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ OK (HTTP $http_code)${NC}"
        if [ "$endpoint" = "/health" ]; then
            echo "Response: $body" | jq . 2>/dev/null || echo "Response: $body"
        fi
        return 0
    else
        echo -e "${RED}❌ Failed (HTTP $http_code)${NC}"
        return 1
    fi
}

# Run tests
echo -e "${BLUE}Running tests...${NC}"
echo ""

success=0
total=0

# Test 1: Health check
total=$((total + 1))
if test_endpoint "/health" "Health Check"; then
    success=$((success + 1))
fi

# Test 2: API Status
total=$((total + 1))
if test_endpoint "/api/terms?limit=1" "API Endpoint"; then
    success=$((success + 1))
fi

# Test 3: Check response time
echo ""
echo -n "Testing response time... "
start_time=$(date +%s%N)
curl -s -o /dev/null "$APP_URL/health"
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 1000 ]; then
    echo -e "${GREEN}✅ Fast (${response_time}ms)${NC}"
elif [ $response_time -lt 3000 ]; then
    echo -e "${YELLOW}⚠️  Acceptable (${response_time}ms)${NC}"
else
    echo -e "${RED}❌ Slow (${response_time}ms)${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}Summary${NC}"
echo "======="
echo "Tests passed: $success/$total"

if [ $success -eq $total ]; then
    echo -e "${GREEN}✅ Deployment is working!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run full test suite: ./test-suite.sh"
    echo "2. Monitor dashboard: ./deployment-dashboard.sh"
    echo "3. Test API endpoints: ./test-api-endpoints.sh"
    echo "4. Run benchmarks: ./benchmark-performance.sh"
else
    echo -e "${RED}❌ Deployment has issues${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check AWS Console for deployment status"
    echo "2. View logs: aws logs tail /aws/apprunner/SERVICE_NAME/application"
    echo "3. See AWS_APPRUNNER_TROUBLESHOOTING.md"
fi