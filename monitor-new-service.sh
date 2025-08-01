#!/bin/bash

# Monitor new App Runner service deployment
SERVICE_NAME="aiglossarypro-main-branch"
SERVICE_URL="https://a37tkzhuca.us-east-1.awsapprunner.com"
SERVICE_ID="7e2fc28c87de43968b604fd002899676"

echo "🚀 Monitoring New App Runner Service Deployment"
echo "=============================================="
echo "Service: $SERVICE_NAME"
echo "URL: $SERVICE_URL"
echo "Started: $(date)"
echo ""

# Check deployment status
check_status() {
    echo -n "Checking service status... "
    status=$(aws apprunner describe-service \
        --service-arn "arn:aws:apprunner:us-east-1:927289246324:service/$SERVICE_NAME/$SERVICE_ID" \
        --region us-east-1 \
        --query 'Service.Status' \
        --output text 2>/dev/null)
    
    echo "Status: $status"
    
    if [ "$status" = "RUNNING" ]; then
        return 0
    elif [ "$status" = "CREATE_FAILED" ] || [ "$status" = "DELETE_FAILED" ]; then
        return 2
    else
        return 1
    fi
}

# Check if service is responding
check_health() {
    echo -n "Testing service health... "
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SERVICE_URL/health" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo "✅ Healthy (HTTP $response)"
        return 0
    elif [ "$response" = "000" ]; then
        echo "⏳ Not reachable yet"
        return 1
    else
        echo "⚠️  HTTP $response"
        return 1
    fi
}

# Monitor deployment
while true; do
    status_result=$(check_status)
    status_code=$?
    
    if [ $status_code -eq 0 ]; then
        echo "✅ Service is RUNNING!"
        
        # Wait a bit for DNS propagation
        echo "Waiting 30s for DNS propagation..."
        sleep 30
        
        if check_health; then
            echo ""
            echo "🎉 DEPLOYMENT SUCCESSFUL!"
            echo "Service is running at: $SERVICE_URL"
            
            # Test endpoints
            echo ""
            echo "Testing API endpoints:"
            echo -n "  /api/health: "
            curl -s "$SERVICE_URL/api/health" | jq -r '.status' 2>/dev/null || echo "Failed"
            
            echo -n "  /api/terms (sample): "
            curl -s "$SERVICE_URL/api/terms?limit=1" | jq -r 'if length > 0 then "OK" else "Empty" end' 2>/dev/null || echo "Failed"
            
            exit 0
        fi
    elif [ $status_code -eq 2 ]; then
        echo ""
        echo "❌ DEPLOYMENT FAILED!"
        echo "Fetching recent logs..."
        
        aws apprunner list-operations \
            --service-arn "arn:aws:apprunner:us-east-1:927289246324:service/$SERVICE_NAME/$SERVICE_ID" \
            --region us-east-1 \
            --max-results 1 \
            --query 'OperationSummaryList[0]' 2>/dev/null || echo "Could not fetch operation details"
        
        exit 1
    fi
    
    echo "Waiting 30 seconds..."
    sleep 30
done