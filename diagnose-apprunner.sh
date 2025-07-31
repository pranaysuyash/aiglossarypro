#!/bin/bash

# Diagnose AWS App Runner Issues
# This script helps identify why App Runner deployment failed

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔍 AWS App Runner Diagnostics${NC}"
echo "=============================="
echo ""

# Check AWS CLI
if ! command -v aws > /dev/null 2>&1; then
    echo -e "${RED}Error: AWS CLI not installed${NC}"
    exit 1
fi

# Get all App Runner services
echo -e "${BLUE}1. App Runner Services:${NC}"
services=$(aws apprunner list-services --query "ServiceSummaryList[*].[ServiceName,Status,ServiceUrl]" --output table)
echo "$services"
echo ""

# Get failed service details
failed_services=$(aws apprunner list-services --query "ServiceSummaryList[?Status=='CREATE_FAILED' || Status=='UPDATE_FAILED']" --output json)

if [ "$failed_services" != "[]" ]; then
    echo -e "${RED}Found failed services:${NC}"
    
    # Process each failed service
    echo "$failed_services" | jq -r '.[] | .ServiceArn' | while read -r service_arn; do
        echo ""
        echo -e "${YELLOW}Service ARN: $service_arn${NC}"
        
        # Get service details
        service_details=$(aws apprunner describe-service --service-arn "$service_arn" --output json)
        
        # Extract key information
        service_name=$(echo "$service_details" | jq -r '.Service.ServiceName')
        status=$(echo "$service_details" | jq -r '.Service.Status')
        
        echo "Name: $service_name"
        echo "Status: $status"
        
        # Check build logs
        echo ""
        echo -e "${BLUE}Build Logs:${NC}"
        log_group="/aws/apprunner/$service_name/service"
        
        # Try different log streams
        for stream_type in "build" "application" "service"; do
            echo "Checking $stream_type logs..."
            
            logs=$(aws logs tail "$log_group" --log-stream-name-prefix "$stream_type" --since 1h 2>/dev/null | head -50)
            
            if [ -n "$logs" ]; then
                echo "$logs"
                echo "---"
            fi
        done
        
        # Get events
        echo ""
        echo -e "${BLUE}Recent Events:${NC}"
        aws logs filter-log-events --log-group-name "$log_group" --start-time $(($(date +%s)*1000-3600000)) --filter-pattern "ERROR" 2>/dev/null | jq -r '.events[].message' | head -20
    done
fi

# Check repository configuration
echo ""
echo -e "${BLUE}2. Repository Check:${NC}"
echo "Current branch: $(git branch --show-current)"
echo "Last commit: $(git log -1 --oneline)"

# Check apprunner.yaml
if [ -f "apps/api/apprunner.yaml" ]; then
    echo ""
    echo -e "${BLUE}3. apprunner.yaml validation:${NC}"
    
    # Check runtime
    runtime=$(grep "runtime:" apps/api/apprunner.yaml | awk '{print $2}')
    echo "Runtime: $runtime"
    
    if [ "$runtime" != "nodejs18" ] && [ "$runtime" != "nodejs16" ]; then
        echo -e "${RED}⚠️  Invalid runtime. Use nodejs16 or nodejs18${NC}"
    fi
    
    # Check build commands
    echo ""
    echo "Build commands:"
    grep -A 20 "build:" apps/api/apprunner.yaml | grep -E "^\s+-" | head -10
else
    echo -e "${RED}apprunner.yaml not found!${NC}"
fi

# Check package.json
echo ""
echo -e "${BLUE}4. Package Configuration:${NC}"
if [ -f "apps/api/package.json" ]; then
    echo "Main: $(jq -r '.main' apps/api/package.json)"
    echo "Scripts:"
    jq -r '.scripts | to_entries[] | "  \(.key): \(.value)"' apps/api/package.json
fi

# Common issues and solutions
echo ""
echo -e "${CYAN}5. Common Issues & Solutions:${NC}"
echo ""

echo -e "${YELLOW}Issue: Build timeout${NC}"
echo "Solution: Already fixed with esbuild (build time <1 minute)"
echo ""

echo -e "${YELLOW}Issue: Module not found${NC}"
echo "Solution: Check that all workspace dependencies are built"
echo "Current workspace packages:"
ls -la packages/*/package.json 2>/dev/null | awk '{print "  - " $9}'
echo ""

echo -e "${YELLOW}Issue: Port binding${NC}"
echo "Solution: Ensure PORT=8080 in environment variables"
echo ""

echo -e "${YELLOW}Issue: Memory exhausted${NC}"
echo "Solution: Already using esbuild which uses minimal memory"
echo ""

# Next steps
echo -e "${CYAN}6. Next Steps:${NC}"
echo "1. Check CloudWatch logs in AWS Console for detailed error"
echo "2. Try creating a new App Runner service with correct configuration"
echo "3. Ensure all environment variables are set"
echo "4. Verify GitHub connection has access to the repository"
echo ""

# Generate report
report_file="apprunner-diagnostic-$(date +%Y%m%d-%H%M%S).txt"
{
    echo "App Runner Diagnostic Report"
    echo "=========================="
    echo "Date: $(date)"
    echo ""
    echo "Failed Services:"
    echo "$failed_services" | jq -r '.[] | "- \(.ServiceName): \(.Status)"'
    echo ""
    echo "Repository: $(git remote -v | head -1)"
    echo "Branch: $(git branch --show-current)"
    echo "Last Commit: $(git log -1 --oneline)"
    echo ""
    echo "Build Configuration:"
    grep -E "runtime:|commands:" apps/api/apprunner.yaml
} > "$report_file"

echo -e "${GREEN}Diagnostic report saved to: $report_file${NC}"