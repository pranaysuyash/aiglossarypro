#\!/bin/bash

# Comprehensive API Testing Script
# Tests all routes on both ALB and CloudFront

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# URLs
ALB_URL="http://aiglossarypro-api-alb-1884179415.us-east-1.elb.amazonaws.com"
CF_URL="https://d1m7nnfj3im4kp.cloudfront.net"

echo -e "${BLUE}======================================"
echo "🧪 Comprehensive API Route Testing"
echo -e "======================================${NC}\n"

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local alb_url=$3
    local cf_url=$4
    local data=$5
    local headers=$6
    
    echo -e "\n${YELLOW}Testing: $name${NC}"
    echo "Method: $method"
    
    # Test ALB
    echo -n "ALB: "
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$alb_url" $headers 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$alb_url" $headers $data 2>/dev/null || echo "000")
    fi
    
    status=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d' | head -c 200)
    
    if [[ "$status" =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}✓ OK${NC} (Status: $status)"
    else
        echo -e "${RED}✗ FAILED${NC} (Status: $status)"
    fi
    
    # Test CloudFront
    echo -n "CloudFront: "
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$cf_url" $headers 2>/dev/null || echo "000")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$cf_url" $headers $data 2>/dev/null || echo "000")
    fi
    
    status=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d' | head -c 200)
    
    if [[ "$status" =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}✓ OK${NC} (Status: $status)"
    else
        echo -e "${RED}✗ FAILED${NC} (Status: $status)"
        echo "Response preview: $body"
    fi
}

# Health & System Routes
echo -e "${BLUE}=== Health & System Routes ===${NC}"
test_endpoint "Health Check" "GET" "$ALB_URL/health" "$CF_URL/health" "" ""
test_endpoint "API Health" "GET" "$ALB_URL/api/health" "$CF_URL/api/health" "" ""

# Core Term Routes
echo -e "\n${BLUE}=== Core Term Routes ===${NC}"
test_endpoint "List Terms" "GET" "$ALB_URL/api/terms" "$CF_URL/api/terms" "" "-H 'Accept: application/json'"
test_endpoint "Get Term by ID" "GET" "$ALB_URL/api/terms/1" "$CF_URL/api/terms/1" "" "-H 'Accept: application/json'"
test_endpoint "Get Invalid Term" "GET" "$ALB_URL/api/terms/99999" "$CF_URL/api/terms/99999" "" "-H 'Accept: application/json'"

# Search Routes
echo -e "\n${BLUE}=== Search Routes ===${NC}"
test_endpoint "Search with Query" "GET" "$ALB_URL/api/search?q=Machine" "$CF_URL/api/search?q=Machine" "" "-H 'Accept: application/json'"
test_endpoint "Search Empty Query" "GET" "$ALB_URL/api/search?q=" "$CF_URL/api/search?q=" "" "-H 'Accept: application/json'"
test_endpoint "Search No Query" "GET" "$ALB_URL/api/search" "$CF_URL/api/search" "" "-H 'Accept: application/json'"
test_endpoint "Advanced Search" "POST" "$ALB_URL/api/search/advanced" "$CF_URL/api/search/advanced" "-d '{\"query\":\"neural\",\"filters\":{\"category\":\"deep-learning\"}}'" "-H 'Content-Type: application/json'"

# Category Routes
echo -e "\n${BLUE}=== Category Routes ===${NC}"
test_endpoint "List Categories" "GET" "$ALB_URL/api/categories" "$CF_URL/api/categories" "" "-H 'Accept: application/json'"
test_endpoint "Get Category" "GET" "$ALB_URL/api/categories/machine-learning" "$CF_URL/api/categories/machine-learning" "" "-H 'Accept: application/json'"

# Authentication Routes
echo -e "\n${BLUE}=== Authentication Routes ===${NC}"
test_endpoint "Auth Status" "GET" "$ALB_URL/api/auth/status" "$CF_URL/api/auth/status" "" "-H 'Accept: application/json'"
test_endpoint "Login Endpoint" "POST" "$ALB_URL/api/auth/login" "$CF_URL/api/auth/login" "-d '{\"email\":\"test@example.com\",\"password\":\"test123\"}'" "-H 'Content-Type: application/json'"
test_endpoint "Logout" "POST" "$ALB_URL/api/auth/logout" "$CF_URL/api/auth/logout" "" "-H 'Accept: application/json'"

# User Routes
echo -e "\n${BLUE}=== User Routes ===${NC}"
test_endpoint "User Profile" "GET" "$ALB_URL/api/user/profile" "$CF_URL/api/user/profile" "" "-H 'Accept: application/json'"
test_endpoint "User Favorites" "GET" "$ALB_URL/api/user/favorites" "$CF_URL/api/user/favorites" "" "-H 'Accept: application/json'"
test_endpoint "User Progress" "GET" "$ALB_URL/api/user/progress" "$CF_URL/api/user/progress" "" "-H 'Accept: application/json'"

# Analytics Routes
echo -e "\n${BLUE}=== Analytics Routes ===${NC}"
test_endpoint "Analytics Overview" "GET" "$ALB_URL/api/analytics/overview" "$CF_URL/api/analytics/overview" "" "-H 'Accept: application/json'"
test_endpoint "Popular Terms" "GET" "$ALB_URL/api/analytics/popular" "$CF_URL/api/analytics/popular" "" "-H 'Accept: application/json'"
test_endpoint "Search Analytics" "GET" "$ALB_URL/api/analytics/search" "$CF_URL/api/analytics/search" "" "-H 'Accept: application/json'"

# Content Routes
echo -e "\n${BLUE}=== Content Routes ===${NC}"
test_endpoint "Content Accessibility" "GET" "$ALB_URL/api/content/accessibility/term/1" "$CF_URL/api/content/accessibility/term/1" "" "-H 'Accept: application/json'"
test_endpoint "Beginner Terms" "GET" "$ALB_URL/api/content/beginner-friendly" "$CF_URL/api/content/beginner-friendly" "" "-H 'Accept: application/json'"

# Admin Routes (should require auth)
echo -e "\n${BLUE}=== Admin Routes ===${NC}"
test_endpoint "Admin Stats" "GET" "$ALB_URL/api/admin/stats" "$CF_URL/api/admin/stats" "" "-H 'Accept: application/json'"
test_endpoint "Admin Users" "GET" "$ALB_URL/api/admin/users" "$CF_URL/api/admin/users" "" "-H 'Accept: application/json'"

# AI/Generation Routes
echo -e "\n${BLUE}=== AI/Generation Routes ===${NC}"
test_endpoint "Generate Definition" "POST" "$ALB_URL/api/ai/generate-definition" "$CF_URL/api/ai/generate-definition" "-d '{\"term\":\"Neural Network\"}'" "-H 'Content-Type: application/json'"
test_endpoint "Generate Examples" "POST" "$ALB_URL/api/ai/generate-examples" "$CF_URL/api/ai/generate-examples" "-d '{\"termId\":\"1\"}'" "-H 'Content-Type: application/json'"

# Feedback Routes
echo -e "\n${BLUE}=== Feedback Routes ===${NC}"
test_endpoint "Submit Feedback" "POST" "$ALB_URL/api/feedback" "$CF_URL/api/feedback" "-d '{\"termId\":\"1\",\"type\":\"improvement\",\"content\":\"Test feedback\"}'" "-H 'Content-Type: application/json'"
test_endpoint "Get Feedback" "GET" "$ALB_URL/api/feedback/term/1" "$CF_URL/api/feedback/term/1" "" "-H 'Accept: application/json'"

# Export Routes
echo -e "\n${BLUE}=== Export Routes ===${NC}"
test_endpoint "Export Terms CSV" "GET" "$ALB_URL/api/export/terms?format=csv" "$CF_URL/api/export/terms?format=csv" "" "-H 'Accept: text/csv'"
test_endpoint "Export Terms JSON" "GET" "$ALB_URL/api/export/terms?format=json" "$CF_URL/api/export/terms?format=json" "" "-H 'Accept: application/json'"

# Sections Routes
echo -e "\n${BLUE}=== Sections Routes ===${NC}"
test_endpoint "List Sections" "GET" "$ALB_URL/api/sections" "$CF_URL/api/sections" "" "-H 'Accept: application/json'"
test_endpoint "Get Section" "GET" "$ALB_URL/api/sections/1" "$CF_URL/api/sections/1" "" "-H 'Accept: application/json'"

# Daily Terms Routes
echo -e "\n${BLUE}=== Daily Terms Routes ===${NC}"
test_endpoint "Today's Term" "GET" "$ALB_URL/api/daily-terms/today" "$CF_URL/api/daily-terms/today" "" "-H 'Accept: application/json'"
test_endpoint "Daily Terms History" "GET" "$ALB_URL/api/daily-terms/history" "$CF_URL/api/daily-terms/history" "" "-H 'Accept: application/json'"

# WebSocket Test
echo -e "\n${BLUE}=== WebSocket Routes ===${NC}"
echo "WebSocket endpoints cannot be tested with curl"

# Summary
echo -e "\n${BLUE}======================================"
echo "📊 Test Summary"
echo -e "======================================${NC}"
echo "ALB URL: $ALB_URL"
echo "CloudFront URL: $CF_URL"
echo -e "\n${YELLOW}Note: Some routes may require authentication${NC}"
echo -e "${YELLOW}Check the full output above for detailed results${NC}"

# Performance comparison
echo -e "\n${BLUE}=== Performance Comparison ===${NC}"
echo -n "ALB Response Time: "
time_alb=$(curl -s -w "%{time_total}" -o /dev/null "$ALB_URL/api/terms")
echo "${time_alb}s"

echo -n "CloudFront Response Time: "
time_cf=$(curl -s -w "%{time_total}" -o /dev/null "$CF_URL/api/terms")
echo "${time_cf}s"
