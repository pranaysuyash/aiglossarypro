#!/bin/bash

# Comprehensive Test Suite for AWS App Runner Deployment
# This script continuously tests all aspects of the deployed application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_URL="${APP_URL:-https://your-app-name.awsapprunner.com}"
TEST_INTERVAL="${TEST_INTERVAL:-30}"
PERFORMANCE_THRESHOLD="${PERFORMANCE_THRESHOLD:-1000}" # milliseconds

# Test results storage
RESULTS_DIR="test-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

# Log file
LOG_FILE="$RESULTS_DIR/test-suite.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local test_name=$3
    
    log "Testing: $test_name"
    
    # Make request and capture all metrics
    response=$(curl -s -w "\n%{http_code}|%{time_total}|%{size_download}" "$APP_URL$endpoint" 2>/dev/null)
    
    # Parse response
    body=$(echo "$response" | head -n -1)
    metrics=$(echo "$response" | tail -n 1)
    http_code=$(echo "$metrics" | cut -d'|' -f1)
    time_total=$(echo "$metrics" | cut -d'|' -f2)
    size_download=$(echo "$metrics" | cut -d'|' -f3)
    
    # Convert time to milliseconds
    time_ms=$(echo "$time_total * 1000" | bc | cut -d'.' -f1)
    
    # Check status code
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $test_name: HTTP $http_code (${time_ms}ms)${NC}"
        
        # Check performance
        if [ "$time_ms" -gt "$PERFORMANCE_THRESHOLD" ]; then
            echo -e "${YELLOW}⚠️  Performance warning: ${time_ms}ms > ${PERFORMANCE_THRESHOLD}ms${NC}"
        fi
        
        # Log success
        echo "$endpoint,$http_code,$time_ms,$size_download,SUCCESS" >> "$RESULTS_DIR/results.csv"
        return 0
    else
        echo -e "${RED}❌ $test_name: HTTP $http_code (expected $expected_status)${NC}"
        echo "Response: $body" | head -100
        
        # Log failure
        echo "$endpoint,$http_code,$time_ms,$size_download,FAILURE" >> "$RESULTS_DIR/results.csv"
        return 1
    fi
}

# Function to test JSON endpoint
test_json_endpoint() {
    local endpoint=$1
    local expected_field=$2
    local test_name=$3
    
    log "Testing JSON: $test_name"
    
    response=$(curl -s "$APP_URL$endpoint" 2>/dev/null)
    
    if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $test_name: Valid JSON with field '$expected_field'${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name: Invalid JSON or missing field '$expected_field'${NC}"
        echo "Response: $response" | head -100
        return 1
    fi
}

# Function to run performance test
performance_test() {
    local endpoint=$1
    local test_name=$2
    local iterations=${3:-10}
    
    log "Performance Test: $test_name ($iterations iterations)"
    
    local total_time=0
    local min_time=999999
    local max_time=0
    local failed=0
    
    for i in $(seq 1 $iterations); do
        response=$(curl -s -w "%{time_total}" -o /dev/null "$APP_URL$endpoint" 2>/dev/null)
        time_ms=$(echo "$response * 1000" | bc | cut -d'.' -f1)
        
        if [ $? -eq 0 ]; then
            total_time=$((total_time + time_ms))
            
            if [ "$time_ms" -lt "$min_time" ]; then
                min_time=$time_ms
            fi
            
            if [ "$time_ms" -gt "$max_time" ]; then
                max_time=$time_ms
            fi
            
            printf "."
        else
            failed=$((failed + 1))
            printf "!"
        fi
    done
    
    echo ""
    
    if [ $failed -eq 0 ]; then
        avg_time=$((total_time / iterations))
        echo -e "${GREEN}✅ Performance: Avg: ${avg_time}ms, Min: ${min_time}ms, Max: ${max_time}ms${NC}"
        
        # Save performance data
        echo "$test_name,$avg_time,$min_time,$max_time,$iterations" >> "$RESULTS_DIR/performance.csv"
    else
        echo -e "${RED}❌ Performance test failed: $failed/$iterations requests failed${NC}"
    fi
}

# Function to test database connectivity
test_database() {
    log "Testing database connectivity via API"
    
    # Test an endpoint that requires database
    if test_endpoint "/api/terms?limit=1" "200" "Database Query Test"; then
        echo -e "${GREEN}✅ Database connectivity confirmed${NC}"
        return 0
    else
        echo -e "${RED}❌ Database connectivity issues${NC}"
        return 1
    fi
}

# Function to run load test
load_test() {
    local endpoint=$1
    local concurrent=${2:-10}
    local requests=${3:-100}
    
    log "Load Test: $endpoint (${concurrent} concurrent, ${requests} total)"
    
    if command -v ab > /dev/null; then
        ab -n "$requests" -c "$concurrent" -q "$APP_URL$endpoint" > "$RESULTS_DIR/load-test.txt" 2>&1
        
        # Extract key metrics
        if grep -q "Requests per second" "$RESULTS_DIR/load-test.txt"; then
            rps=$(grep "Requests per second" "$RESULTS_DIR/load-test.txt" | awk '{print $4}')
            avg_time=$(grep "Time per request" "$RESULTS_DIR/load-test.txt" | head -1 | awk '{print $4}')
            echo -e "${GREEN}✅ Load Test: ${rps} req/s, ${avg_time}ms avg response${NC}"
        else
            echo -e "${RED}❌ Load test failed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Apache Bench (ab) not installed, skipping load test${NC}"
    fi
}

# Function to check SSL certificate
test_ssl() {
    log "Testing SSL certificate"
    
    domain=$(echo "$APP_URL" | sed 's|https://||' | sed 's|/.*||')
    
    # Check certificate expiry
    expiry=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    if [ -n "$expiry" ]; then
        echo -e "${GREEN}✅ SSL Certificate valid until: $expiry${NC}"
        
        # Check days until expiry
        expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry" +%s 2>/dev/null)
        current_epoch=$(date +%s)
        days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ "$days_left" -lt 30 ]; then
            echo -e "${YELLOW}⚠️  Certificate expires in $days_left days${NC}"
        fi
    else
        echo -e "${RED}❌ Could not verify SSL certificate${NC}"
    fi
}

# Function to test security headers
test_security_headers() {
    log "Testing security headers"
    
    headers=$(curl -s -I "$APP_URL/health" 2>/dev/null)
    
    # Check for security headers
    security_headers=(
        "X-Content-Type-Options: nosniff"
        "X-Frame-Options"
        "X-XSS-Protection"
        "Strict-Transport-Security"
    )
    
    for header in "${security_headers[@]}"; do
        if echo "$headers" | grep -qi "$header"; then
            echo -e "${GREEN}✅ $header present${NC}"
        else
            echo -e "${RED}❌ $header missing${NC}"
        fi
    done
}

# Main test execution
main() {
    echo -e "${BLUE}🧪 AWS App Runner Comprehensive Test Suite${NC}"
    echo "==========================================="
    echo "Target URL: $APP_URL"
    echo "Test Interval: ${TEST_INTERVAL}s"
    echo "Results Directory: $RESULTS_DIR"
    echo ""
    
    # Initialize CSV files
    echo "endpoint,status,time_ms,size_bytes,result" > "$RESULTS_DIR/results.csv"
    echo "test_name,avg_ms,min_ms,max_ms,iterations" > "$RESULTS_DIR/performance.csv"
    
    iteration=0
    total_tests=0
    passed_tests=0
    
    while true; do
        iteration=$((iteration + 1))
        echo -e "\n${CYAN}=== Test Iteration #$iteration - $(date) ===${NC}\n"
        
        # 1. Basic connectivity
        echo -e "${BLUE}1. Basic Connectivity Tests${NC}"
        if test_endpoint "/health" "200" "Health Check"; then
            ((passed_tests++))
        fi
        ((total_tests++))
        
        # 2. API endpoints
        echo -e "\n${BLUE}2. API Endpoint Tests${NC}"
        if test_json_endpoint "/health" "status" "Health JSON Structure"; then
            ((passed_tests++))
        fi
        ((total_tests++))
        
        # 3. Database connectivity
        echo -e "\n${BLUE}3. Database Tests${NC}"
        if test_database; then
            ((passed_tests++))
        fi
        ((total_tests++))
        
        # 4. Performance tests (every 5 iterations)
        if [ $((iteration % 5)) -eq 0 ]; then
            echo -e "\n${BLUE}4. Performance Tests${NC}"
            performance_test "/health" "Health Endpoint" 20
            performance_test "/api/terms?limit=10" "API Query" 10
        fi
        
        # 5. Security tests (every 10 iterations)
        if [ $((iteration % 10)) -eq 0 ]; then
            echo -e "\n${BLUE}5. Security Tests${NC}"
            test_ssl
            test_security_headers
        fi
        
        # 6. Load test (every 20 iterations)
        if [ $((iteration % 20)) -eq 0 ]; then
            echo -e "\n${BLUE}6. Load Test${NC}"
            load_test "/health" 50 500
        fi
        
        # Summary
        success_rate=$((passed_tests * 100 / total_tests))
        echo -e "\n${CYAN}Summary: $passed_tests/$total_tests tests passed ($success_rate%)${NC}"
        
        # Generate report
        cat > "$RESULTS_DIR/summary-iteration-$iteration.txt" << EOF
Test Suite Summary - Iteration $iteration
=====================================
Timestamp: $(date)
Target URL: $APP_URL
Total Tests: $total_tests
Passed: $passed_tests
Failed: $((total_tests - passed_tests))
Success Rate: $success_rate%

Next iteration in ${TEST_INTERVAL}s...
EOF
        
        # Alert on low success rate
        if [ "$success_rate" -lt 90 ]; then
            echo -e "${RED}⚠️  ALERT: Success rate below 90%${NC}"
            
            # Optional: Send alert (configure your alerting here)
            # aws sns publish --topic-arn "arn:aws:sns:..." --message "Deployment test failure"
        fi
        
        echo -e "\n${YELLOW}Waiting ${TEST_INTERVAL}s before next iteration...${NC}"
        sleep "$TEST_INTERVAL"
    done
}

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v curl > /dev/null; then
    echo -e "${RED}Error: curl is required${NC}"
    exit 1
fi

if ! command -v jq > /dev/null; then
    echo -e "${YELLOW}Warning: jq not found, JSON tests will be limited${NC}"
fi

if ! command -v bc > /dev/null; then
    echo -e "${RED}Error: bc is required for calculations${NC}"
    exit 1
fi

# Run main test suite
main