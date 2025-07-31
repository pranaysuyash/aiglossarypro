#!/bin/bash

# Real-time Deployment Dashboard
# Provides a live view of deployment status and health metrics

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
APP_URL="${APP_URL:-https://your-app-name.awsapprunner.com}"
REFRESH_RATE="${REFRESH_RATE:-5}"

# Clear screen and move cursor
clear_screen() {
    printf "\033c"
}

# Draw a box
draw_box() {
    local width=$1
    local title=$2
    
    # Top border
    echo -n "┌"
    for ((i=0; i<width-2; i++)); do echo -n "─"; done
    echo "┐"
    
    # Title
    if [ -n "$title" ]; then
        echo "│ ${BOLD}$title${NC}$(printf '%*s' $((width - ${#title} - 3)) '')│"
        echo -n "├"
        for ((i=0; i<width-2; i++)); do echo -n "─"; done
        echo "┤"
    fi
}

# Get current time
get_time() {
    date '+%H:%M:%S'
}

# Test health endpoint
test_health() {
    local start_time=$(date +%s%N)
    local response=$(curl -s -w "\n%{http_code}" "$APP_URL/health" 2>/dev/null)
    local end_time=$(date +%s%N)
    
    local http_code=$(echo "$response" | tail -n 1)
    local body=$(echo "$response" | head -n -1)
    local response_time=$(( (end_time - start_time) / 1000000 ))
    
    echo "$http_code|$response_time|$body"
}

# Get system metrics from health endpoint
get_metrics() {
    local health_response=$1
    
    # Try to parse JSON response
    if command -v jq > /dev/null 2>&1; then
        echo "$health_response" | jq -r '.uptime // 0' 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Format uptime
format_uptime() {
    local seconds=$1
    local days=$((seconds / 86400))
    local hours=$(( (seconds % 86400) / 3600 ))
    local minutes=$(( (seconds % 3600) / 60 ))
    local secs=$((seconds % 60))
    
    if [ $days -gt 0 ]; then
        printf "%dd %02dh %02dm %02ds" $days $hours $minutes $secs
    elif [ $hours -gt 0 ]; then
        printf "%02dh %02dm %02ds" $hours $minutes $secs
    else
        printf "%02dm %02ds" $minutes $secs
    fi
}

# Main dashboard loop
main() {
    local iteration=0
    local total_checks=0
    local successful_checks=0
    local min_response_time=999999
    local max_response_time=0
    local total_response_time=0
    local last_status=""
    local status_changes=0
    
    while true; do
        clear_screen
        iteration=$((iteration + 1))
        
        # Header
        echo -e "${CYAN}${BOLD}AWS App Runner Deployment Dashboard${NC}"
        echo -e "${CYAN}═══════════════════════════════════════${NC}"
        echo ""
        
        # Current time
        echo -e "${BLUE}Current Time:${NC} $(get_time)"
        echo -e "${BLUE}Target URL:${NC} $APP_URL"
        echo -e "${BLUE}Refresh Rate:${NC} ${REFRESH_RATE}s"
        echo ""
        
        # Test health
        health_result=$(test_health)
        http_code=$(echo "$health_result" | cut -d'|' -f1)
        response_time=$(echo "$health_result" | cut -d'|' -f2)
        health_body=$(echo "$health_result" | cut -d'|' -f3-)
        
        total_checks=$((total_checks + 1))
        
        # Status Box
        draw_box 60 "Service Status"
        
        if [ "$http_code" = "200" ]; then
            successful_checks=$((successful_checks + 1))
            status="${GREEN}● HEALTHY${NC}"
            
            # Update response time stats
            total_response_time=$((total_response_time + response_time))
            if [ $response_time -lt $min_response_time ]; then
                min_response_time=$response_time
            fi
            if [ $response_time -gt $max_response_time ]; then
                max_response_time=$response_time
            fi
        elif [ "$http_code" = "000" ]; then
            status="${RED}● UNREACHABLE${NC}"
        else
            status="${YELLOW}● UNHEALTHY (HTTP $http_code)${NC}"
        fi
        
        # Track status changes
        if [ "$status" != "$last_status" ] && [ -n "$last_status" ]; then
            status_changes=$((status_changes + 1))
        fi
        last_status="$status"
        
        echo -e "│ Status: $status$(printf '%*s' 41 '')│"
        echo -e "│ Response Time: ${CYAN}${response_time}ms${NC}$(printf '%*s' 35 '')│"
        echo -e "│ HTTP Code: ${http_code}$(printf '%*s' 44 '')│"
        echo "└$(printf '─%.0s' {1..58})┘"
        echo ""
        
        # Metrics Box
        draw_box 60 "Performance Metrics"
        
        if [ $successful_checks -gt 0 ]; then
            avg_response_time=$((total_response_time / successful_checks))
            uptime_seconds=$(get_metrics "$health_body")
            
            echo -e "│ Avg Response: ${CYAN}${avg_response_time}ms${NC}$(printf '%*s' 36 '')│"
            echo -e "│ Min Response: ${GREEN}${min_response_time}ms${NC}$(printf '%*s' 36 '')│"
            echo -e "│ Max Response: ${YELLOW}${max_response_time}ms${NC}$(printf '%*s' 36 '')│"
            
            if [ "$uptime_seconds" != "0" ]; then
                uptime_formatted=$(format_uptime "$uptime_seconds")
                echo -e "│ Uptime: ${GREEN}$uptime_formatted${NC}$(printf '%*s' $((49 - ${#uptime_formatted})) '')│"
            fi
        else
            echo -e "│ ${YELLOW}No successful checks yet${NC}$(printf '%*s' 32 '')│"
        fi
        echo "└$(printf '─%.0s' {1..58})┘"
        echo ""
        
        # Statistics Box
        draw_box 60 "Statistics"
        
        success_rate=0
        if [ $total_checks -gt 0 ]; then
            success_rate=$((successful_checks * 100 / total_checks))
        fi
        
        echo -e "│ Total Checks: $total_checks$(printf '%*s' $((43 - ${#total_checks})) '')│"
        echo -e "│ Successful: ${GREEN}$successful_checks${NC}$(printf '%*s' $((45 - ${#successful_checks})) '')│"
        echo -e "│ Failed: ${RED}$((total_checks - successful_checks))${NC}$(printf '%*s' $((50 - ${#total_checks} + ${#successful_checks})) '')│"
        echo -e "│ Success Rate: ${success_rate}%$(printf '%*s' $((41 - ${#success_rate})) '')│"
        echo -e "│ Status Changes: $status_changes$(printf '%*s' $((41 - ${#status_changes})) '')│"
        echo "└$(printf '─%.0s' {1..58})┘"
        echo ""
        
        # Recent Events (if any)
        if [ "$http_code" != "200" ] && [ "$http_code" != "000" ]; then
            draw_box 60 "Last Error Response"
            echo -e "│ ${RED}$health_body${NC}" | fold -w 56 | sed 's/^/│ /' | sed 's/$/  │/'
            echo "└$(printf '─%.0s' {1..58})┘"
            echo ""
        fi
        
        # Health Details (if available)
        if [ "$http_code" = "200" ] && command -v jq > /dev/null 2>&1; then
            # Try to parse JSON response
            if echo "$health_body" | jq . > /dev/null 2>&1; then
                draw_box 60 "Health Details"
                
                # Extract key fields
                environment=$(echo "$health_body" | jq -r '.environment // "unknown"' 2>/dev/null)
                version=$(echo "$health_body" | jq -r '.version // "unknown"' 2>/dev/null)
                timestamp=$(echo "$health_body" | jq -r '.timestamp // "unknown"' 2>/dev/null)
                
                echo -e "│ Environment: ${CYAN}$environment${NC}$(printf '%*s' $((43 - ${#environment})) '')│"
                echo -e "│ Version: ${CYAN}$version${NC}$(printf '%*s' $((47 - ${#version})) '')│"
                echo -e "│ Timestamp: $timestamp$(printf '%*s' $((45 - ${#timestamp})) '')│"
                echo "└$(printf '─%.0s' {1..58})┘"
                echo ""
            fi
        fi
        
        # Footer
        echo -e "${CYAN}═══════════════════════════════════════${NC}"
        echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
        echo -e "Next refresh in ${REFRESH_RATE}s... (Iteration #$iteration)"
        
        # Wait before refresh
        sleep "$REFRESH_RATE"
    done
}

# Trap Ctrl+C to clean exit
trap 'echo -e "\n${GREEN}Dashboard stopped.${NC}"; exit 0' INT

# Check if URL is set
if [ "$APP_URL" = "https://your-app-name.awsapprunner.com" ]; then
    echo -e "${YELLOW}Warning: Using default URL. Set APP_URL environment variable:${NC}"
    echo "export APP_URL=https://your-actual-app.awsapprunner.com"
    echo ""
    read -p "Press Enter to continue with default URL or Ctrl+C to exit..."
fi

# Start dashboard
main