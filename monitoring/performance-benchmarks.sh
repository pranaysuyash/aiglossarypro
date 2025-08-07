#!/bin/bash

# Performance Benchmarking Script for AIGlossaryPro API
# Date: 2025-08-06
# API Base URL: https://d1m7nnfj3im4kp.cloudfront.net/api

set -e

API_BASE="https://d1m7nnfj3im4kp.cloudfront.net/api"
CURL_FORMAT_FILE="curl-format.txt"
RESULTS_DIR="monitoring/results"
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "=== AIGlossaryPro API Performance Benchmarks ==="
echo "Timestamp: $(date)"
echo "API Base URL: $API_BASE"
echo "=============================================="

# Function to run single endpoint test
test_endpoint() {
    local endpoint="$1"
    local name="$2"
    local iterations="${3:-5}"
    
    echo "Testing $name ($endpoint) - $iterations iterations..."
    
    local total_time=0
    local min_time=999999
    local max_time=0
    local success_count=0
    local error_count=0
    
    for i in $(seq 1 $iterations); do
        echo -n "  Iteration $i: "
        
        # Capture both timing and response code
        result=$(curl -w "%{time_total},%{response_code}" -s -o /dev/null "$API_BASE$endpoint" 2>/dev/null || echo "0,000")
        
        IFS=',' read -r time_total response_code <<< "$result"
        
        if [[ "$response_code" == "200" ]]; then
            success_count=$((success_count + 1))
            total_time=$(echo "$total_time + $time_total" | bc -l)
            
            # Update min/max
            if (( $(echo "$time_total < $min_time" | bc -l) )); then
                min_time="$time_total"
            fi
            if (( $(echo "$time_total > $max_time" | bc -l) )); then
                max_time="$time_total"
            fi
            
            echo "${time_total}s (${response_code})"
        else
            error_count=$((error_count + 1))
            echo "ERROR (${response_code})"
        fi
        
        sleep 1  # Avoid overwhelming the API
    done
    
    # Calculate statistics
    if [ $success_count -gt 0 ]; then
        avg_time=$(echo "scale=3; $total_time / $success_count" | bc -l)
        echo "  Results: Avg=${avg_time}s, Min=${min_time}s, Max=${max_time}s"
        echo "  Success Rate: $success_count/$iterations ($((success_count * 100 / iterations))%)"
    else
        echo "  All requests failed!"
        avg_time="N/A"
        min_time="N/A"
        max_time="N/A"
    fi
    
    echo "  ---"
    
    # Return results for CSV
    echo "$name,$endpoint,$iterations,$success_count,$error_count,$avg_time,$min_time,$max_time"
}

# Main benchmarking
echo "Starting performance benchmarks..."
echo ""

# CSV Header
csv_file="$RESULTS_DIR/benchmark_results_$TIMESTAMP.csv"
echo "Endpoint,Path,Iterations,Success,Errors,AvgTime,MinTime,MaxTime" > "$csv_file"

# Test various endpoints
test_endpoint "/health" "Health Check" 10 >> "$csv_file"
test_endpoint "/terms" "Terms List" 5 >> "$csv_file"
test_endpoint "/categories" "Categories" 5 >> "$csv_file"
test_endpoint "/search?q=AI" "Search Query" 5 >> "$csv_file"

echo ""
echo "=== Detailed Response Analysis ==="
echo ""

# Detailed analysis for key endpoints
echo "Health Check Detailed Analysis:"
curl -w "@$CURL_FORMAT_FILE" -s "https://d1m7nnfj3im4kp.cloudfront.net/api/health" | jq .
echo ""

echo "Terms Endpoint Analysis:"
curl -w "@$CURL_FORMAT_FILE" -s "https://d1m7nnfj3im4kp.cloudfront.net/api/terms" > /dev/null
echo ""

echo "Response Headers Analysis:"
curl -I -s "https://d1m7nnfj3im4kp.cloudfront.net/api/health"
echo ""

echo "=== CloudFront Performance Test ==="
echo "Testing CloudFront caching behavior..."

# Test caching by making multiple requests
echo "First request (cache miss expected):"
time curl -s -o /dev/null -w "Time: %{time_total}s, Status: %{response_code}\n" "https://d1m7nnfj3im4kp.cloudfront.net/api/health"

echo "Second request (cache hit expected):"
time curl -s -o /dev/null -w "Time: %{time_total}s, Status: %{response_code}\n" "https://d1m7nnfj3im4kp.cloudfront.net/api/health"

echo ""
echo "Results saved to: $csv_file"
echo "Benchmark completed at: $(date)"