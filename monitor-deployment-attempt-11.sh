#!/bin/bash

# Monitor Deployment Attempt #11
# Updated apprunner.yaml with proper monorepo build configuration

SERVICE_NAME="aiglossarypro-app-main-fixed"
SERVICE_URL="https://ygwpjcgvxu.us-east-1.awsapprunner.com"

echo "🚀 Monitoring Deployment Attempt #11"
echo "=================================="
echo "Service: $SERVICE_NAME"
echo "URL: $SERVICE_URL"
echo "Time: $(date)"
echo ""
echo "Key changes in this deployment:"
echo "- ✅ Build workspace packages individually"
echo "- ✅ Change to apps/api directory for API build"
echo "- ✅ Add build output verification"
echo "- ✅ Include SIMPLE_AUTH_ENABLED env var"
echo ""
echo "Checking deployment status..."
echo ""

# Check if service is responding
check_service() {
    echo -n "Testing service endpoint... "
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SERVICE_URL/health" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo "✅ Service is responding (HTTP $response)"
        return 0
    elif [ "$response" = "000" ]; then
        echo "❌ Service not reachable (timeout/DNS failure)"
        return 1
    else
        echo "⚠️  Service returned HTTP $response"
        return 1
    fi
}

# Monitor for 10 minutes
end_time=$(($(date +%s) + 600))

while [ $(date +%s) -lt $end_time ]; do
    if check_service; then
        echo ""
        echo "🎉 DEPLOYMENT SUCCESSFUL!"
        echo "Service is now running at: $SERVICE_URL"
        
        # Test API endpoints
        echo ""
        echo "Testing API endpoints:"
        echo -n "  /api/terms: "
        curl -s -o /dev/null -w "%{http_code}\n" --max-time 5 "$SERVICE_URL/api/terms" 2>/dev/null || echo "Failed"
        
        echo -n "  /api/categories: "
        curl -s -o /dev/null -w "%{http_code}\n" --max-time 5 "$SERVICE_URL/api/categories" 2>/dev/null || echo "Failed"
        
        echo ""
        echo "Check AWS App Runner console for detailed logs."
        exit 0
    fi
    
    echo "Waiting 30 seconds before next check..."
    sleep 30
done

echo ""
echo "❌ Deployment monitoring timed out after 10 minutes."
echo "Please check AWS App Runner console for deployment status."
echo ""
echo "Common issues to check:"
echo "1. Build logs in App Runner console"
echo "2. Application logs for startup errors"
echo "3. Health check configuration"
echo "4. DNS propagation delays"