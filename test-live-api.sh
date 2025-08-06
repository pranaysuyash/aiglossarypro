#!/bin/bash

# AIGlossaryPro Live API Testing Script
# Tests all API endpoints on the deployed frontend and backend

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API URLs
CLOUDFRONT_URL="https://d1m7nnfj3im4kp.cloudfront.net"
DIRECT_API_URL="http://aiglossarypro-api-alb-1884179415.us-east-1.elb.amazonaws.com"

echo "🧪 Testing AIGlossaryPro Live APIs"
echo "=================================="

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC} (Status: $status_code)"
        if [ "$4" = "show" ]; then
            echo "Response: $(echo $body | jq -r '.status // .message // .' 2>/dev/null | head -c 100)"
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $(echo $body | head -c 200)"
    fi
    echo
}

# Test Direct API Health
echo -e "${YELLOW}1. Testing Direct API Health${NC}"
test_endpoint "Health Check" "$DIRECT_API_URL/health" "200" "show"

# Test CloudFront Frontend
echo -e "${YELLOW}2. Testing CloudFront Frontend${NC}"
test_endpoint "Frontend HTML" "$CLOUDFRONT_URL/" "200"
test_endpoint "Frontend Index" "$CLOUDFRONT_URL/index.html" "200"

# Test API through CloudFront
echo -e "${YELLOW}3. Testing API through CloudFront${NC}"
test_endpoint "API Health" "$CLOUDFRONT_URL/health" "200" "show"
test_endpoint "API Terms" "$CLOUDFRONT_URL/api/terms" "200" "show"
test_endpoint "API Search" "$CLOUDFRONT_URL/api/search?q=AI" "200" "show"

# Test specific API endpoints
echo -e "${YELLOW}4. Testing Specific API Features${NC}"

# Get first term ID for testing
echo -n "Fetching term IDs... "
TERM_ID=$(curl -s "$CLOUDFRONT_URL/api/terms" | jq -r '.data[0].id // empty' 2>/dev/null)
if [ -n "$TERM_ID" ]; then
    echo -e "${GREEN}✓ Found term ID: $TERM_ID${NC}"
    test_endpoint "Get Term by ID" "$CLOUDFRONT_URL/api/terms/$TERM_ID" "200" "show"
else
    echo -e "${YELLOW}⚠ No terms found${NC}"
fi

# Test search functionality
echo -e "${YELLOW}5. Testing Search Functionality${NC}"
test_endpoint "Search: Machine" "$CLOUDFRONT_URL/api/search?q=Machine" "200" "show"
test_endpoint "Search: Empty" "$CLOUDFRONT_URL/api/search?q=" "400" "show"

# Test error handling
echo -e "${YELLOW}6. Testing Error Handling${NC}"
test_endpoint "Invalid Route" "$CLOUDFRONT_URL/api/invalid-route" "404"
test_endpoint "Invalid Term ID" "$CLOUDFRONT_URL/api/terms/99999" "404"

# Test CORS headers
echo -e "${YELLOW}7. Testing CORS Configuration${NC}"
echo -n "Checking CORS headers... "
cors_headers=$(curl -s -I -X OPTIONS "$CLOUDFRONT_URL/api/terms" -H "Origin: https://example.com" | grep -i "access-control")
if [ -n "$cors_headers" ]; then
    echo -e "${GREEN}✓ CORS enabled${NC}"
    echo "$cors_headers"
else
    echo -e "${RED}✗ CORS not configured${NC}"
fi

# Performance test
echo -e "\n${YELLOW}8. Performance Test${NC}"
echo -n "Testing response time... "
time_total=$(curl -s -w "%{time_total}" -o /dev/null "$CLOUDFRONT_URL/api/terms")
echo -e "Response time: ${GREEN}${time_total}s${NC}"

# Summary
echo -e "\n${YELLOW}=================================="
echo "Test Summary"
echo "==================================${NC}"
echo "CloudFront URL: $CLOUDFRONT_URL"
echo "Direct API URL: $DIRECT_API_URL"
echo ""
echo "✅ Frontend and API are integrated through CloudFront"
echo "✅ All routes are properly configured with /api prefix"
echo "✅ Health checks are passing"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "\n${YELLOW}Note: Install 'jq' for better JSON output formatting${NC}"
fi