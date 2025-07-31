#!/bin/bash

# Performance Benchmarking Script
# Comprehensive performance testing for AWS App Runner deployment

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
WARMUP_REQUESTS="${WARMUP_REQUESTS:-10}"
BENCHMARK_DURATION="${BENCHMARK_DURATION:-60}" # seconds

# Results directory
RESULTS_DIR="benchmark-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RESULTS_DIR"

# Check for required tools
check_prerequisites() {
    local missing_tools=()
    
    for tool in curl bc jq; do
        if ! command -v $tool > /dev/null 2>&1; then
            missing_tools+=($tool)
        fi
    done
    
    # Check for performance testing tools
    if ! command -v ab > /dev/null 2>&1 && ! command -v wrk > /dev/null 2>&1; then
        echo -e "${YELLOW}Warning: Neither 'ab' (Apache Bench) nor 'wrk' found${NC}"
        echo "Install one of them for load testing:"
        echo "  - Apache Bench: apt-get install apache2-utils"
        echo "  - wrk: apt-get install wrk"
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo -e "${RED}Error: Missing required tools: ${missing_tools[*]}${NC}"
        exit 1
    fi
}

# Warmup function
warmup() {
    echo -e "${BLUE}Warming up with $WARMUP_REQUESTS requests...${NC}"
    
    for i in $(seq 1 $WARMUP_REQUESTS); do
        curl -s -o /dev/null "$APP_URL/health"
        printf "."
    done
    echo -e " ${GREEN}Done${NC}"
}

# Single request benchmark
benchmark_single_request() {
    local endpoint=$1
    local iterations=${2:-100}
    
    echo -e "\n${CYAN}=== Single Request Benchmark: $endpoint ===${NC}"
    
    local total_time=0
    local min_time=999999
    local max_time=0
    local times=()
    
    for i in $(seq 1 $iterations); do
        local start_time=$(date +%s%N)
        local response=$(curl -s -w "\n%{http_code}|%{time_total}|%{size_download}" -o /dev/null "$APP_URL$endpoint" 2>/dev/null)
        local end_time=$(date +%s%N)
        
        local http_code=$(echo "$response" | cut -d'|' -f1)
        local curl_time=$(echo "$response" | cut -d'|' -f2)
        local size=$(echo "$response" | cut -d'|' -f3)
        
        # Convert to milliseconds
        local time_ms=$(echo "$curl_time * 1000" | bc | cut -d'.' -f1)
        times+=($time_ms)
        
        total_time=$((total_time + time_ms))
        
        if [ $time_ms -lt $min_time ]; then
            min_time=$time_ms
        fi
        
        if [ $time_ms -gt $max_time ]; then
            max_time=$time_ms
        fi
        
        # Progress indicator
        if [ $((i % 10)) -eq 0 ]; then
            printf "."
        fi
    done
    
    echo ""
    
    # Calculate statistics
    local avg_time=$((total_time / iterations))
    
    # Calculate percentiles (requires sorting)
    IFS=$'\n' sorted_times=($(sort -n <<<"${times[*]}"))
    unset IFS
    
    local p50_index=$((iterations * 50 / 100))
    local p95_index=$((iterations * 95 / 100))
    local p99_index=$((iterations * 99 / 100))
    
    local p50="${sorted_times[$p50_index]}"
    local p95="${sorted_times[$p95_index]}"
    local p99="${sorted_times[$p99_index]}"
    
    # Display results
    echo "Iterations: $iterations"
    echo "Average: ${avg_time}ms"
    echo "Min: ${min_time}ms"
    echo "Max: ${max_time}ms"
    echo "P50: ${p50}ms"
    echo "P95: ${p95}ms"
    echo "P99: ${p99}ms"
    
    # Save to file
    cat >> "$RESULTS_DIR/single-request-benchmark.csv" << EOF
$endpoint,$iterations,$avg_time,$min_time,$max_time,$p50,$p95,$p99
EOF
}

# Concurrent request benchmark using curl
benchmark_concurrent_curl() {
    local endpoint=$1
    local concurrent=${2:-10}
    local total_requests=${3:-1000}
    
    echo -e "\n${CYAN}=== Concurrent Request Benchmark (curl): $endpoint ===${NC}"
    echo "Concurrent connections: $concurrent"
    echo "Total requests: $total_requests"
    
    local temp_dir="$RESULTS_DIR/concurrent-temp"
    mkdir -p "$temp_dir"
    
    local start_time=$(date +%s)
    
    # Launch concurrent curl processes
    for i in $(seq 1 $concurrent); do
        (
            local requests_per_process=$((total_requests / concurrent))
            for j in $(seq 1 $requests_per_process); do
                curl -s -w "%{http_code},%{time_total}\n" -o /dev/null "$APP_URL$endpoint" >> "$temp_dir/results-$i.txt" 2>/dev/null
            done
        ) &
    done
    
    # Wait for all processes
    wait
    
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    # Analyze results
    cat "$temp_dir"/results-*.txt > "$temp_dir/all-results.txt"
    
    local total_success=$(grep "^200," "$temp_dir/all-results.txt" | wc -l)
    local total_completed=$(wc -l < "$temp_dir/all-results.txt")
    local requests_per_second=$((total_completed / total_duration))
    
    # Calculate average response time
    local avg_response=$(awk -F',' '{sum+=$2; count++} END {print sum/count*1000}' "$temp_dir/all-results.txt")
    
    echo "Duration: ${total_duration}s"
    echo "Completed requests: $total_completed"
    echo "Successful requests: $total_success"
    echo "Requests/second: $requests_per_second"
    echo "Average response time: ${avg_response}ms"
    
    # Cleanup
    rm -rf "$temp_dir"
}

# Load test using Apache Bench
benchmark_ab() {
    if ! command -v ab > /dev/null 2>&1; then
        echo -e "${YELLOW}Skipping Apache Bench test (not installed)${NC}"
        return
    fi
    
    local endpoint=$1
    local concurrent=${2:-50}
    local requests=${3:-1000}
    
    echo -e "\n${CYAN}=== Apache Bench Load Test: $endpoint ===${NC}"
    
    ab -n $requests -c $concurrent -g "$RESULTS_DIR/ab-plot.tsv" "$APP_URL$endpoint" > "$RESULTS_DIR/ab-results.txt" 2>&1
    
    # Extract key metrics
    if [ -f "$RESULTS_DIR/ab-results.txt" ]; then
        echo "Results saved to: $RESULTS_DIR/ab-results.txt"
        
        # Display key metrics
        grep "Requests per second" "$RESULTS_DIR/ab-results.txt" || true
        grep "Time per request" "$RESULTS_DIR/ab-results.txt" | head -1 || true
        grep "Transfer rate" "$RESULTS_DIR/ab-results.txt" || true
        grep "Percentage of the requests" "$RESULTS_DIR/ab-results.txt" -A 10 || true
    fi
}

# Load test using wrk
benchmark_wrk() {
    if ! command -v wrk > /dev/null 2>&1; then
        echo -e "${YELLOW}Skipping wrk test (not installed)${NC}"
        return
    fi
    
    local endpoint=$1
    local threads=${2:-4}
    local connections=${3:-100}
    local duration=${4:-30}
    
    echo -e "\n${CYAN}=== wrk Load Test: $endpoint ===${NC}"
    echo "Threads: $threads, Connections: $connections, Duration: ${duration}s"
    
    wrk -t$threads -c$connections -d${duration}s --latency "$APP_URL$endpoint" > "$RESULTS_DIR/wrk-results.txt" 2>&1
    
    if [ -f "$RESULTS_DIR/wrk-results.txt" ]; then
        cat "$RESULTS_DIR/wrk-results.txt"
    fi
}

# Memory and resource test
benchmark_resources() {
    echo -e "\n${CYAN}=== Resource Usage Test ===${NC}"
    
    # Test with increasing payload sizes
    local sizes=(1 10 100 1000 10000)
    
    for size in "${sizes[@]}"; do
        echo -n "Testing with ${size}KB payload: "
        
        # Generate payload
        local payload=$(head -c ${size}000 /dev/zero | base64 | tr -d '\n')
        
        # Measure response
        local response=$(curl -s -w "%{http_code},%{time_total},%{size_download}" -X POST \
            -H "Content-Type: application/json" \
            -d "{\"data\":\"$payload\"}" \
            -o /dev/null \
            "$APP_URL/api/echo" 2>/dev/null || echo "000,0,0")
        
        local http_code=$(echo "$response" | cut -d',' -f1)
        local time_total=$(echo "$response" | cut -d',' -f2)
        
        if [ "$http_code" = "200" ]; then
            echo -e "${GREEN}OK (${time_total}s)${NC}"
        elif [ "$http_code" = "413" ]; then
            echo -e "${YELLOW}Payload too large${NC}"
        else
            echo -e "${RED}Failed (HTTP $http_code)${NC}"
        fi
    done
}

# Stress test
stress_test() {
    echo -e "\n${CYAN}=== Stress Test ===${NC}"
    echo "Running sustained load for $BENCHMARK_DURATION seconds..."
    
    local endpoint="/health"
    local start_time=$(date +%s)
    local end_time=$((start_time + BENCHMARK_DURATION))
    local request_count=0
    local error_count=0
    
    while [ $(date +%s) -lt $end_time ]; do
        # Launch background requests
        for i in {1..10}; do
            (
                if ! curl -s -o /dev/null "$APP_URL$endpoint"; then
                    echo "E" >> "$RESULTS_DIR/stress-errors.txt"
                fi
            ) &
        done
        
        request_count=$((request_count + 10))
        
        # Don't overwhelm
        sleep 0.1
    done
    
    wait
    
    if [ -f "$RESULTS_DIR/stress-errors.txt" ]; then
        error_count=$(wc -l < "$RESULTS_DIR/stress-errors.txt")
    fi
    
    local success_rate=$(( (request_count - error_count) * 100 / request_count ))
    
    echo "Total requests: $request_count"
    echo "Errors: $error_count"
    echo "Success rate: ${success_rate}%"
    
    if [ $success_rate -ge 99 ]; then
        echo -e "${GREEN}✅ Excellent stability under load${NC}"
    elif [ $success_rate -ge 95 ]; then
        echo -e "${YELLOW}⚠️  Some errors under load${NC}"
    else
        echo -e "${RED}❌ Significant errors under load${NC}"
    fi
}

# Generate performance report
generate_report() {
    local report_file="$RESULTS_DIR/performance-report.md"
    
    cat > "$report_file" << EOF
# Performance Benchmark Report

**Date:** $(date)  
**Target:** $APP_URL  
**Duration:** $BENCHMARK_DURATION seconds  

## Summary

This report contains comprehensive performance benchmarks for the deployed application.

## Single Request Performance

\`\`\`
$(cat "$RESULTS_DIR/single-request-benchmark.csv" 2>/dev/null || echo "No data")
\`\`\`

## Load Test Results

### Apache Bench Results
\`\`\`
$(head -50 "$RESULTS_DIR/ab-results.txt" 2>/dev/null || echo "Test not run")
\`\`\`

### wrk Results
\`\`\`
$(cat "$RESULTS_DIR/wrk-results.txt" 2>/dev/null || echo "Test not run")
\`\`\`

## Recommendations

$(
if [ -f "$RESULTS_DIR/single-request-benchmark.csv" ]; then
    avg_response=$(tail -1 "$RESULTS_DIR/single-request-benchmark.csv" | cut -d',' -f3)
    if [ "$avg_response" -lt 100 ]; then
        echo "- ✅ Response times are excellent (<100ms average)"
    elif [ "$avg_response" -lt 500 ]; then
        echo "- ⚠️  Response times are acceptable but could be improved"
    else
        echo "- ❌ Response times are slow (>500ms average)"
        echo "  - Consider caching frequently accessed data"
        echo "  - Optimize database queries"
        echo "  - Enable compression"
    fi
fi
)

## Next Steps

1. Review detailed results in: $RESULTS_DIR
2. Compare with previous benchmarks
3. Monitor production metrics
4. Implement optimizations as needed

EOF
    
    echo -e "\n${GREEN}Performance report saved to: $report_file${NC}"
}

# Main execution
main() {
    echo -e "${CYAN}🚀 Performance Benchmarking Suite${NC}"
    echo "=================================="
    echo "Target: $APP_URL"
    echo "Results: $RESULTS_DIR"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Initialize CSV files
    echo "endpoint,iterations,avg_ms,min_ms,max_ms,p50_ms,p95_ms,p99_ms" > "$RESULTS_DIR/single-request-benchmark.csv"
    
    # Warmup
    warmup
    
    # Run benchmarks
    benchmark_single_request "/health" 100
    benchmark_single_request "/api/terms?limit=10" 50
    benchmark_single_request "/api/search?q=test" 50
    
    benchmark_concurrent_curl "/health" 10 1000
    
    benchmark_ab "/health" 50 1000
    benchmark_ab "/api/terms" 25 500
    
    benchmark_wrk "/health" 4 100 30
    
    benchmark_resources
    
    stress_test
    
    # Generate report
    generate_report
    
    echo -e "\n${GREEN}✅ Benchmarking complete!${NC}"
    echo "Results saved in: $RESULTS_DIR"
}

# Run benchmarks
main