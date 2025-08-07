#!/bin/bash

# Load Testing Script for AIGlossaryPro API
# Date: 2025-08-06
# API Base URL: https://d1m7nnfj3im4kp.cloudfront.net/api

set -e

API_BASE="https://d1m7nnfj3im4kp.cloudfront.net/api"
RESULTS_DIR="monitoring/results"
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
LOAD_TEST_FILE="$RESULTS_DIR/load_test_$TIMESTAMP.txt"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "=== AIGlossaryPro API Load Testing ===" | tee "$LOAD_TEST_FILE"
echo "Timestamp: $(date)" | tee -a "$LOAD_TEST_FILE"
echo "API Base URL: $API_BASE" | tee -a "$LOAD_TEST_FILE"
echo "============================================" | tee -a "$LOAD_TEST_FILE"
echo "" | tee -a "$LOAD_TEST_FILE"

# Function to run Apache Bench test
run_ab_test() {
    local endpoint="$1"
    local name="$2"
    local requests="$3"
    local concurrency="$4"
    
    echo "=== Load Test: $name ===" | tee -a "$LOAD_TEST_FILE"
    echo "Endpoint: $endpoint" | tee -a "$LOAD_TEST_FILE"
    echo "Total Requests: $requests" | tee -a "$LOAD_TEST_FILE"
    echo "Concurrency Level: $concurrency" | tee -a "$LOAD_TEST_FILE"
    echo "" | tee -a "$LOAD_TEST_FILE"
    
    # Run Apache Bench
    ab -n "$requests" -c "$concurrency" -v 2 "$API_BASE$endpoint" 2>&1 | tee -a "$LOAD_TEST_FILE"
    
    echo "" | tee -a "$LOAD_TEST_FILE"
    echo "---" | tee -a "$LOAD_TEST_FILE"
    echo "" | tee -a "$LOAD_TEST_FILE"
}

# Function to run curl-based concurrent test
run_concurrent_test() {
    local endpoint="$1"
    local name="$2"
    local concurrent_requests="$3"
    
    echo "=== Concurrent Test: $name ===" | tee -a "$LOAD_TEST_FILE"
    echo "Endpoint: $endpoint" | tee -a "$LOAD_TEST_FILE"
    echo "Concurrent Requests: $concurrent_requests" | tee -a "$LOAD_TEST_FILE"
    echo "" | tee -a "$LOAD_TEST_FILE"
    
    # Create temporary files for results
    local temp_dir="/tmp/load_test_$$"
    mkdir -p "$temp_dir"
    
    echo "Starting $concurrent_requests concurrent requests..." | tee -a "$LOAD_TEST_FILE"
    start_time=$(date +%s.%3N)
    
    # Launch concurrent requests
    for i in $(seq 1 "$concurrent_requests"); do
        curl -w "Request $i: %{time_total}s, Code: %{response_code}\n" \
             -s -o /dev/null "$API_BASE$endpoint" > "$temp_dir/result_$i.txt" &
    done
    
    # Wait for all to complete
    wait
    end_time=$(date +%s.%3N)
    
    # Calculate total time
    total_time=$(echo "$end_time - $start_time" | bc -l)
    
    echo "All requests completed in: ${total_time}s" | tee -a "$LOAD_TEST_FILE"
    echo "" | tee -a "$LOAD_TEST_FILE"
    
    # Aggregate results
    echo "Individual Request Results:" | tee -a "$LOAD_TEST_FILE"
    for i in $(seq 1 "$concurrent_requests"); do
        cat "$temp_dir/result_$i.txt" | tee -a "$LOAD_TEST_FILE"
    done
    
    # Cleanup
    rm -rf "$temp_dir"
    
    echo "" | tee -a "$LOAD_TEST_FILE"
    echo "---" | tee -a "$LOAD_TEST_FILE"
    echo "" | tee -a "$LOAD_TEST_FILE"
}

# Function to test under stress conditions
stress_test() {
    echo "=== Stress Test ===" | tee -a "$LOAD_TEST_FILE"
    echo "Testing API behavior under increasing load..." | tee -a "$LOAD_TEST_FILE"
    echo "" | tee -a "$LOAD_TEST_FILE"
    
    # Progressive load test
    for concurrency in 1 5 10 20; do
        echo "Testing with concurrency level: $concurrency" | tee -a "$LOAD_TEST_FILE"
        run_concurrent_test "/health" "Stress Test (C=$concurrency)" "$concurrency"
        
        # Brief pause between tests
        echo "Cooling down for 10 seconds..." | tee -a "$LOAD_TEST_FILE"
        sleep 10
    done
}

# Main load testing execution
echo "Starting load testing suite..." | tee -a "$LOAD_TEST_FILE"
echo "" | tee -a "$LOAD_TEST_FILE"

# Light load tests using Apache Bench
echo "Phase 1: Light Load Tests (Apache Bench)" | tee -a "$LOAD_TEST_FILE"
echo "=========================================" | tee -a "$LOAD_TEST_FILE"
echo "" | tee -a "$LOAD_TEST_FILE"

run_ab_test "/health" "Health Check Light Load" 50 5
run_ab_test "/terms" "Terms Endpoint Light Load" 30 3

# Medium load tests
echo "Phase 2: Medium Load Tests" | tee -a "$LOAD_TEST_FILE"
echo "==========================" | tee -a "$LOAD_TEST_FILE"
echo "" | tee -a "$LOAD_TEST_FILE"

run_ab_test "/health" "Health Check Medium Load" 100 10

# Concurrent tests
echo "Phase 3: Concurrent Request Tests" | tee -a "$LOAD_TEST_FILE"
echo "==================================" | tee -a "$LOAD_TEST_FILE"
echo "" | tee -a "$LOAD_TEST_FILE"

run_concurrent_test "/health" "Health Check Concurrent" 10
run_concurrent_test "/terms" "Terms Concurrent" 5

# Stress testing (commented out to avoid overwhelming the API)
echo "Phase 4: Stress Testing (Limited)" | tee -a "$LOAD_TEST_FILE"
echo "=================================" | tee -a "$LOAD_TEST_FILE"
echo "" | tee -a "$LOAD_TEST_FILE"

# Only run light stress test
run_concurrent_test "/health" "Light Stress Test" 15

echo "=== Load Testing Summary ===" | tee -a "$LOAD_TEST_FILE"
echo "" | tee -a "$LOAD_TEST_FILE"
echo "Load testing completed at: $(date)" | tee -a "$LOAD_TEST_FILE"
echo "Full results saved to: $LOAD_TEST_FILE" | tee -a "$LOAD_TEST_FILE"
echo "" | tee -a "$LOAD_TEST_FILE"

echo "Load testing completed. Check $LOAD_TEST_FILE for detailed results."