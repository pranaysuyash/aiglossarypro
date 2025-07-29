#!/bin/bash

# AI Glossary Pro - Comprehensive API Testing Script
# Using Gemini CLI to generate and execute API tests

echo "=================================="
echo "AI Glossary Pro API Testing Suite"
echo "=================================="
echo ""

BASE_URL="http://localhost:3001/api"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="Test123456!"
AUTH_TOKEN=""
TEST_RESULTS_FILE="api-test-results-$(date +%Y%m%d-%H%M%S).md"

# Function to test API endpoint
test_api() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local headers=$5
    
    echo "Testing: $description"
    echo "Endpoint: $method $endpoint"
    
    # Build curl command
    curl_cmd="curl -s -X $method $BASE_URL$endpoint"
    
    if [ ! -z "$headers" ]; then
        curl_cmd="$curl_cmd $headers"
    fi
    
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    # Execute and capture response
    response=$(eval $curl_cmd)
    status_code=$(eval "$curl_cmd -w '%{http_code}' -o /dev/null")
    
    echo "Status Code: $status_code"
    echo "Response: $response" | jq . 2>/dev/null || echo "$response"
    echo "---"
    echo ""
    
    # Log to results file
    echo "## $description" >> $TEST_RESULTS_FILE
    echo "- **Endpoint:** $method $endpoint" >> $TEST_RESULTS_FILE
    echo "- **Status Code:** $status_code" >> $TEST_RESULTS_FILE
    echo "- **Response:**" >> $TEST_RESULTS_FILE
    echo "\`\`\`json" >> $TEST_RESULTS_FILE
    echo "$response" | jq . 2>/dev/null >> $TEST_RESULTS_FILE || echo "$response" >> $TEST_RESULTS_FILE
    echo "\`\`\`" >> $TEST_RESULTS_FILE
    echo "" >> $TEST_RESULTS_FILE
}

# Initialize results file
echo "# AI Glossary Pro API Test Results" > $TEST_RESULTS_FILE
echo "**Test Date:** $(date)" >> $TEST_RESULTS_FILE
echo "**Base URL:** $BASE_URL" >> $TEST_RESULTS_FILE
echo "" >> $TEST_RESULTS_FILE

# 1. HEALTH CHECK
echo "=== 1. HEALTH CHECK ===" 
test_api "GET" "/health" "Health Check API"

# 2. AUTHENTICATION APIs
echo "=== 2. AUTHENTICATION APIs ==="

# Register user
test_api "POST" "/auth/register" "User Registration" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Test User\"}"

# Login
login_response=$(curl -s -X POST $BASE_URL/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
AUTH_TOKEN=$(echo $login_response | jq -r '.token' 2>/dev/null)

test_api "POST" "/auth/login" "User Login" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"

# Verify token
if [ ! -z "$AUTH_TOKEN" ] && [ "$AUTH_TOKEN" != "null" ]; then
    test_api "GET" "/auth/verify" "Token Verification" \
        "" "-H 'Authorization: Bearer $AUTH_TOKEN'"
fi

# 3. TERMS/GLOSSARY APIs
echo "=== 3. TERMS/GLOSSARY APIs ==="

test_api "GET" "/terms" "Get All Terms (Paginated)"
test_api "GET" "/terms?limit=5&offset=0" "Get Terms with Pagination"
test_api "GET" "/terms/1" "Get Single Term by ID"
test_api "GET" "/terms/search?q=machine" "Search Terms"

# 4. CATEGORIES APIs
echo "=== 4. CATEGORIES APIs ==="

test_api "GET" "/categories" "Get All Categories"
test_api "GET" "/categories/1" "Get Single Category"
test_api "GET" "/categories/1/terms" "Get Terms by Category"

# 5. SUBCATEGORIES APIs
echo "=== 5. SUBCATEGORIES APIs ==="

test_api "GET" "/subcategories" "Get All Subcategories"
test_api "GET" "/subcategories/by-category/1" "Get Subcategories by Category"

# 6. SEARCH APIs
echo "=== 6. SEARCH APIs ==="

test_api "GET" "/search?q=neural" "Basic Search"
test_api "GET" "/search/advanced?q=deep&category=1" "Advanced Search"
test_api "GET" "/adaptive-search?q=AI%20models" "Adaptive AI Search"

# 7. USER APIs (Authenticated)
echo "=== 7. USER APIs ==="

if [ ! -z "$AUTH_TOKEN" ] && [ "$AUTH_TOKEN" != "null" ]; then
    test_api "GET" "/user/profile" "Get User Profile" \
        "" "-H 'Authorization: Bearer $AUTH_TOKEN'"
    
    test_api "PUT" "/user/profile" "Update User Profile" \
        "{\"name\":\"Updated Test User\"}" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'"
    
    test_api "GET" "/user/progress" "Get User Progress" \
        "" "-H 'Authorization: Bearer $AUTH_TOKEN'"
fi

# 8. PROGRESS TRACKING APIs
echo "=== 8. PROGRESS TRACKING APIs ==="

if [ ! -z "$AUTH_TOKEN" ] && [ "$AUTH_TOKEN" != "null" ]; then
    test_api "POST" "/progress/term/1" "Mark Term as Viewed" \
        "{\"termId\":1}" \
        "-H 'Authorization: Bearer $AUTH_TOKEN'"
    
    test_api "GET" "/progress/stats" "Get Progress Statistics" \
        "" "-H 'Authorization: Bearer $AUTH_TOKEN'"
fi

# 9. PERSONALIZATION APIs
echo "=== 9. PERSONALIZATION APIs ==="

test_api "GET" "/personalization/recommendations" "Get Recommendations"
test_api "GET" "/personalization/learning-path" "Get Learning Path"

# 10. ANALYTICS APIs
echo "=== 10. ANALYTICS APIs ==="

test_api "GET" "/analytics/popular-terms" "Get Popular Terms"
test_api "GET" "/analytics/trending" "Get Trending Topics"

# 11. FEEDBACK APIs
echo "=== 11. FEEDBACK APIs ==="

test_api "POST" "/feedback" "Submit Feedback" \
    "{\"type\":\"suggestion\",\"message\":\"Great glossary!\",\"email\":\"$TEST_EMAIL\"}"

# 12. NEWSLETTER APIs
echo "=== 12. NEWSLETTER APIs ==="

test_api "POST" "/newsletter/subscribe" "Newsletter Subscribe" \
    "{\"email\":\"newsletter@example.com\",\"name\":\"Newsletter User\"}"

# 13. CACHE APIs
echo "=== 13. CACHE APIs ==="

test_api "GET" "/cache/stats" "Get Cache Statistics"
test_api "GET" "/cache-analytics" "Get Cache Analytics"

# 14. SEO APIs
echo "=== 14. SEO APIs ==="

test_api "GET" "/seo/sitemap" "Get Sitemap"
test_api "GET" "/seo/meta/term/1" "Get Term SEO Metadata"

# 15. CONTENT APIs
echo "=== 15. CONTENT APIs ==="

test_api "GET" "/content/export?format=json" "Export Content as JSON"
test_api "GET" "/content/stats" "Get Content Statistics"

# 16. LEARNING PATHS APIs
echo "=== 16. LEARNING PATHS APIs ==="

test_api "GET" "/learning-paths" "Get All Learning Paths"
test_api "GET" "/learning-paths/beginner" "Get Beginner Learning Path"

# 17. CODE EXAMPLES APIs
echo "=== 17. CODE EXAMPLES APIs ==="

test_api "GET" "/code-examples/term/1" "Get Code Examples for Term"

# 18. RELATIONSHIPS APIs
echo "=== 18. RELATIONSHIPS APIs ==="

test_api "GET" "/relationships/term/1" "Get Term Relationships"
test_api "GET" "/relationships/graph" "Get Relationship Graph"

# 19. MEDIA APIs
echo "=== 19. MEDIA APIs ==="

test_api "GET" "/media/term/1" "Get Media for Term"

# 20. ADMIN APIs (if authenticated as admin)
echo "=== 20. ADMIN APIs ==="

# Note: These would require admin authentication
test_api "GET" "/admin/stats" "Admin Dashboard Stats"
test_api "GET" "/admin/users" "Get All Users (Admin)"

echo ""
echo "=================================="
echo "API Testing Complete!"
echo "Results saved to: $TEST_RESULTS_FILE"
echo "=================================="

# Generate summary using Gemini
echo ""
echo "Generating test summary with Gemini..."
echo ""

# Create a prompt for Gemini to analyze the results
cat > /tmp/gemini-prompt.txt << EOF
Please analyze the following API test results and provide:
1. Summary of all tested endpoints
2. Success rate (based on 2xx status codes)
3. Any failed endpoints or errors
4. Recommendations for improvement
5. Security observations

Test Results:
$(cat $TEST_RESULTS_FILE)
EOF

# Use Gemini to analyze results
echo "Running Gemini analysis..."
gemini -p "$(cat /tmp/gemini-prompt.txt)" > api-test-analysis-$(date +%Y%m%d-%H%M%S).md

echo "Analysis complete!"