#!/bin/bash

# AWS App Runner Deployment Monitor
# Continuously monitors deployment status and provides real-time updates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="${SERVICE_NAME:-aiglossarypro}"
CHECK_INTERVAL="${CHECK_INTERVAL:-30}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-40}" # 20 minutes with 30s intervals

echo -e "${BLUE}🚀 AWS App Runner Deployment Monitor${NC}"
echo "====================================="
echo "Service: $SERVICE_NAME"
echo "Check interval: ${CHECK_INTERVAL}s"
echo ""

# Function to get service status
get_service_status() {
    aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$SERVICE_NAME'].{Status:Status,ServiceArn:ServiceArn}" --output json 2>/dev/null || echo "[]"
}

# Function to get detailed service info
get_service_details() {
    local service_arn=$1
    aws apprunner describe-service --service-arn "$service_arn" --query "Service.{Status:Status,HealthCheckConfiguration:HealthCheckConfiguration,ServiceUrl:ServiceUrl}" --output json 2>/dev/null
}

# Function to check health endpoint
check_health() {
    local url=$1
    if [ -n "$url" ]; then
        curl -s -o /dev/null -w "%{http_code}" "https://$url/health" 2>/dev/null || echo "000"
    else
        echo "000"
    fi
}

# Main monitoring loop
attempt=0
last_status=""
deployment_start=$(date +%s)

while [ $attempt -lt $MAX_ATTEMPTS ]; do
    attempt=$((attempt + 1))
    current_time=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Get service status
    service_info=$(get_service_status)
    
    if [ "$service_info" = "[]" ]; then
        echo -e "${RED}[$current_time] Service not found. Waiting for deployment to start...${NC}"
    else
        service_arn=$(echo "$service_info" | jq -r '.[0].ServiceArn')
        status=$(echo "$service_info" | jq -r '.[0].Status')
        
        # Get detailed info
        details=$(get_service_details "$service_arn")
        service_url=$(echo "$details" | jq -r '.ServiceUrl // empty')
        
        # Status change detection
        if [ "$status" != "$last_status" ]; then
            echo ""
            echo -e "${YELLOW}[$current_time] Status changed: $last_status → $status${NC}"
            last_status="$status"
        fi
        
        # Display status with appropriate color
        case $status in
            "RUNNING")
                health_status=$(check_health "$service_url")
                if [ "$health_status" = "200" ]; then
                    echo -e "${GREEN}[$current_time] ✅ RUNNING - Health check passed (HTTP $health_status)${NC}"
                    echo -e "${GREEN}Service URL: https://$service_url${NC}"
                    
                    # Calculate deployment time
                    deployment_end=$(date +%s)
                    deployment_time=$((deployment_end - deployment_start))
                    echo ""
                    echo -e "${GREEN}🎉 Deployment successful!${NC}"
                    echo "Total deployment time: $((deployment_time / 60)) minutes $((deployment_time % 60)) seconds"
                    echo ""
                    echo "Next steps:"
                    echo "1. Run test script: APP_URL=https://$service_url ./test-deployment.sh"
                    echo "2. Check CloudWatch logs for any warnings"
                    echo "3. Test API endpoints manually"
                    exit 0
                else
                    echo -e "${YELLOW}[$current_time] ⚠️  RUNNING - Health check returned: $health_status${NC}"
                fi
                ;;
            "CREATE_FAILED"|"UPDATE_FAILED"|"DELETE_FAILED")
                echo -e "${RED}[$current_time] ❌ Deployment FAILED - Status: $status${NC}"
                echo ""
                echo "Troubleshooting steps:"
                echo "1. Check CloudWatch logs:"
                echo "   aws logs tail /aws/apprunner/$SERVICE_NAME/application"
                echo "2. Review build logs in AWS Console"
                echo "3. See AWS_APPRUNNER_TROUBLESHOOTING.md"
                exit 1
                ;;
            "OPERATION_IN_PROGRESS")
                echo -e "${BLUE}[$current_time] 🔄 Deployment in progress...${NC}"
                ;;
            "PAUSED")
                echo -e "${YELLOW}[$current_time] ⏸️  Service is PAUSED${NC}"
                ;;
            *)
                echo -e "${YELLOW}[$current_time] Status: $status${NC}"
                ;;
        esac
    fi
    
    # Progress indicator
    printf "Waiting %ss before next check... (Attempt %d/%d)\r" "$CHECK_INTERVAL" "$attempt" "$MAX_ATTEMPTS"
    sleep $CHECK_INTERVAL
done

echo -e "\n${RED}❌ Deployment monitoring timed out after $MAX_ATTEMPTS attempts${NC}"
echo "The deployment might still be in progress. Check AWS Console for current status."
exit 1