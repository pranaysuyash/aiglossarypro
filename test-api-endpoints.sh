#!/bin/bash

# API Endpoint Testing Script
# Tests all API endpoints with various scenarios

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
APP_URL="${APP_URL:-https://your-app-name.awsapprunner.com}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
TEST_USER_EMAIL="${TEST_USER_EMAIL:-test@example.com}"
TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-testpassword123}"

# Results directory
RESULTS_DIR="api-test-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$RESULTS_DIR/test.log"
}

# Test function
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    local headers=${6:-}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "Testing: $test_name"
    
    # Build curl command
    curl_cmd="curl -s -w '\n%{http_code}' -X $method '$APP_URL$endpoint'"
    
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd $headers"
    fi
    
    if [ -n "$AUTH_TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $AUTH_TOKEN'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    # Execute request
    response=$(eval "$curl_cmd" 2>/dev/null || echo "CURL_ERROR")
    
    if [ "$response" = "CURL_ERROR" ]; then
        echo -e "${RED}❌ $test_name: Connection failed${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
    
    # Parse response
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    # Save response
    echo "=== $test_name ===" >> "$RESULTS_DIR/responses.txt"
    echo "Request: $method $endpoint" >> "$RESULTS_DIR/responses.txt"
    echo "Status: $http_code" >> "$RESULTS_DIR/responses.txt"
    echo "Body: $body" >> "$RESULTS_DIR/responses.txt"
    echo "" >> "$RESULTS_DIR/responses.txt"
    
    # Check result
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $test_name: HTTP $http_code${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # Additional validation for successful responses
        if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
            if echo "$body" | jq . > /dev/null 2>&1; then
                echo "   Valid JSON response"
            else
                echo -e "${YELLOW}   Warning: Response is not valid JSON${NC}"
            fi
        fi
        
        return 0
    else
        echo -e "${RED}❌ $test_name: HTTP $http_code (expected $expected_status)${NC}"
        echo "   Response: $body" | head -3
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test categories
test_health_endpoints() {
    echo -e "\n${BLUE}=== Health & Status Endpoints ===${NC}"
    
    test_api "GET" "/health" "" "200" "Health Check"
    test_api "GET" "/api/status" "" "200" "API Status"
}

test_public_endpoints() {
    echo -e "\n${BLUE}=== Public Endpoints ===${NC}"
    
    test_api "GET" "/api/terms" "" "200" "List Terms (No Auth)"
    test_api "GET" "/api/terms?limit=5" "" "200" "List Terms with Limit"
    test_api "GET" "/api/terms?page=1&limit=10" "" "200" "List Terms with Pagination"
    test_api "GET" "/api/terms?category=AI" "" "200" "List Terms by Category"
    test_api "GET" "/api/categories" "" "200" "List Categories"
    test_api "GET" "/api/search?q=machine" "" "200" "Search Terms"
}

test_auth_endpoints() {
    echo -e "\n${BLUE}=== Authentication Endpoints ===${NC}"
    
    # Register
    local register_data='{
        "email": "'$TEST_USER_EMAIL'",
        "password": "'$TEST_USER_PASSWORD'",
        "firstName": "Test",
        "lastName": "User"
    }'
    
    if test_api "POST" "/api/auth/register" "$register_data" "201" "User Registration"; then
        # Extract token from response if available
        local token=$(echo "$body" | jq -r '.token // .access_token // ""' 2>/dev/null)
        if [ -n "$token" ]; then
            AUTH_TOKEN="$token"
            echo "   Token obtained: ${token:0:20}..."
        fi
    fi
    
    # Login
    local login_data='{
        "email": "'$TEST_USER_EMAIL'",
        "password": "'$TEST_USER_PASSWORD'"
    }'
    
    test_api "POST" "/api/auth/login" "$login_data" "200" "User Login"
    
    # Get current user
    test_api "GET" "/api/auth/me" "" "200" "Get Current User"
    
    # Logout
    test_api "POST" "/api/auth/logout" "" "200" "User Logout"
}

test_protected_endpoints() {
    echo -e "\n${BLUE}=== Protected Endpoints ===${NC}"
    
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${YELLOW}⚠️  No auth token available, skipping protected endpoint tests${NC}"
        return
    fi
    
    test_api "GET" "/api/user/profile" "" "200" "Get User Profile"
    test_api "GET" "/api/user/favorites" "" "200" "Get User Favorites"
    test_api "GET" "/api/user/progress" "" "200" "Get User Progress"
}

test_crud_operations() {
    echo -e "\n${BLUE}=== CRUD Operations (Admin) ===${NC}"
    
    # Create
    local create_data='{
        "name": "Test Term",
        "definition": "A term created for testing",
        "category": "Testing"
    }'
    
    test_api "POST" "/api/admin/terms" "$create_data" "201" "Create Term (Admin)"
    
    # Update
    local update_data='{
        "definition": "Updated definition for testing"
    }'
    
    test_api "PUT" "/api/admin/terms/1" "$update_data" "200" "Update Term (Admin)"
    
    # Delete
    test_api "DELETE" "/api/admin/terms/1" "" "204" "Delete Term (Admin)"
}

test_error_handling() {
    echo -e "\n${BLUE}=== Error Handling ===${NC}"
    
    test_api "GET" "/api/nonexistent" "" "404" "Non-existent Endpoint"
    test_api "GET" "/api/terms/99999" "" "404" "Non-existent Resource"
    test_api "POST" "/api/auth/login" '{"email":"invalid"}' "400" "Invalid Request Body"
    test_api "GET" "/api/admin/users" "" "401" "Unauthorized Access"
    test_api "POST" "/api/terms" "" "405" "Method Not Allowed"
}

test_performance() {
    echo -e "\n${BLUE}=== Performance Tests ===${NC}"
    
    # Test response times
    for endpoint in "/health" "/api/terms?limit=1" "/api/categories"; do
        local start_time=$(date +%s%N)
        curl -s -o /dev/null "$APP_URL$endpoint"
        local end_time=$(date +%s%N)
        local response_time=$(( (end_time - start_time) / 1000000 ))
        
        if [ $response_time -lt 1000 ]; then
            echo -e "${GREEN}✅ $endpoint: ${response_time}ms${NC}"
        else
            echo -e "${YELLOW}⚠️  $endpoint: ${response_time}ms (slow)${NC}"
        fi
    done
}

test_security() {
    echo -e "\n${BLUE}=== Security Tests ===${NC}"
    
    # SQL Injection attempt
    test_api "GET" "/api/search?q='; DROP TABLE users; --" "" "400" "SQL Injection Protection"
    
    # XSS attempt
    test_api "POST" "/api/terms" '{"name":"<script>alert(1)</script>"}' "400" "XSS Protection"
    
    # Large payload
    local large_data=$(printf '{"data":"%*s"}' 1000000 | tr ' ' 'x')
    test_api "POST" "/api/test" "$large_data" "413" "Large Payload Rejection"
    
    # Rate limiting (if implemented)
    echo "Testing rate limiting..."
    local rate_limit_hit=false
    for i in {1..150}; do
        status=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/terms")
        if [ "$status" = "429" ]; then
            echo -e "${GREEN}✅ Rate limiting active (triggered after $i requests)${NC}"
            rate_limit_hit=true
            break
        fi
    done
    
    if [ "$rate_limit_hit" = false ]; then
        echo -e "${YELLOW}⚠️  Rate limiting might not be configured${NC}"
    fi
}

# Generate report
generate_report() {
    local report_file="$RESULTS_DIR/test-report.txt"
    
    echo "API Endpoint Test Report" > "$report_file"
    echo "========================" >> "$report_file"
    echo "Date: $(date)" >> "$report_file"
    echo "Target: $APP_URL" >> "$report_file"
    echo "" >> "$report_file"
    echo "Test Summary" >> "$report_file"
    echo "------------" >> "$report_file"
    echo "Total Tests: $TOTAL_TESTS" >> "$report_file"
    echo "Passed: $PASSED_TESTS" >> "$report_file"
    echo "Failed: $FAILED_TESTS" >> "$report_file"
    echo "Success Rate: $((PASSED_TESTS * 100 / TOTAL_TESTS))%" >> "$report_file"
    echo "" >> "$report_file"
    
    # Add recommendations
    echo "Recommendations" >> "$report_file"
    echo "--------------" >> "$report_file"
    
    if [ $FAILED_TESTS -gt 0 ]; then
        echo "- Review failed tests in responses.txt" >> "$report_file"
        echo "- Check server logs for error details" >> "$report_file"
    fi
    
    echo "" >> "$report_file"
    echo "Full test log: $RESULTS_DIR/test.log" >> "$report_file"
    echo "API responses: $RESULTS_DIR/responses.txt" >> "$report_file"
    
    echo -e "\n${CYAN}Report saved to: $report_file${NC}"
}

# Main execution
main() {
    echo -e "${CYAN}🧪 API Endpoint Testing Suite${NC}"
    echo "=============================="
    echo "Target: $APP_URL"
    echo "Results: $RESULTS_DIR"
    echo ""
    
    # Check if jq is available
    if ! command -v jq > /dev/null 2>&1; then
        echo -e "${YELLOW}Warning: jq not found. JSON validation will be limited.${NC}"
    fi
    
    # Run all test categories
    test_health_endpoints
    test_public_endpoints
    test_auth_endpoints
    test_protected_endpoints
    test_crud_operations
    test_error_handling
    test_performance
    test_security
    
    # Summary
    echo -e "\n${CYAN}=== Test Summary ===${NC}"
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    
    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    if [ $success_rate -ge 90 ]; then
        echo -e "Success Rate: ${GREEN}${success_rate}%${NC}"
    elif [ $success_rate -ge 70 ]; then
        echo -e "Success Rate: ${YELLOW}${success_rate}%${NC}"
    else
        echo -e "Success Rate: ${RED}${success_rate}%${NC}"
    fi
    
    # Generate report
    generate_report
}

# Run tests
main