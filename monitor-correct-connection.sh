#!/bin/bash

# Monitor the CORRECT deployment with proper GitHub connection
SERVICE_NAME="aiglossarypro-main-fixed-connection"
SERVICE_URL="https://i3tqcmfvpi.us-east-1.awsapprunner.com"
SERVICE_ID="762020876a254890b7573d0bd7aeb9bc"

echo "🚀 Monitoring Deployment with CORRECT GitHub Connection"
echo "====================================================="
echo "Service: $SERVICE_NAME"
echo "URL: $SERVICE_URL"
echo "Started: $(date)"
echo ""
echo "This should ACTUALLY work now - using the right GitHub connection!"
echo ""

# Check deployment status
check_status() {
    status=$(aws apprunner describe-service \
        --service-arn "arn:aws:apprunner:us-east-1:927289246324:service/$SERVICE_NAME/$SERVICE_ID" \
        --region us-east-1 \
        --query 'Service.Status' \
        --output text 2>/dev/null)
    
    echo "[$(date +%H:%M:%S)] Status: $status"
    
    if [ "$status" = "RUNNING" ]; then
        return 0
    elif [ "$status" = "CREATE_FAILED" ]; then
        return 2
    else
        return 1
    fi
}

# Monitor for success
echo "Monitoring deployment..."
while true; do
    status_result=$(check_status)
    status_code=$?
    
    if [ $status_code -eq 0 ]; then
        echo ""
        echo "✅ Service is RUNNING! Waiting for DNS..."
        sleep 30
        
        # Test service
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SERVICE_URL/health" 2>/dev/null || echo "000")
        
        if [ "$response" = "200" ]; then
            echo "🎉 DEPLOYMENT SUCCESSFUL!"
            echo "Service URL: $SERVICE_URL"
            echo ""
            echo "The issue was the GitHub connection ARN all along!"
        else
            echo "Service is running, health check returned: $response"
            echo "Check: $SERVICE_URL"
        fi
        
        exit 0
    elif [ $status_code -eq 2 ]; then
        echo ""
        echo "❌ Deployment failed again!"
        echo "This is unexpected with the correct connection."
        exit 1
    fi
    
    sleep 20
done