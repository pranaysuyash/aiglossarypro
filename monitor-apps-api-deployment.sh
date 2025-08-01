#!/bin/bash

# Monitor the apps/api deployment - this should work!
SERVICE_NAME="aiglossarypro-main-apps-api"
SERVICE_URL="https://5p86x4kcu5.us-east-1.awsapprunner.com"

echo "🚀 Monitoring Apps/API Deployment (Proven Configuration)"
echo "======================================================="
echo "Service: $SERVICE_NAME"
echo "URL: $SERVICE_URL"
echo "Source Directory: /apps/api (SAME AS WORKING DEPLOYMENT)"
echo "Started: $(date)"
echo ""
echo "This uses the EXACT same configuration that worked yesterday!"
echo ""

# Function to check service status
check_service() {
    echo -n "$(date '+%H:%M:%S') - Testing service... "
    
    # Try the health endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$SERVICE_URL/health" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo "✅ SUCCESS! Service is responding (HTTP $response)"
        return 0
    elif [ "$response" = "000" ]; then
        echo "⏳ Still deploying (no response yet)"
        return 1
    else
        echo "⚠️  Got HTTP $response (may still be starting up)"
        return 1
    fi
}

# Function to test API endpoints once service is up
test_api_endpoints() {
    echo ""
    echo "🧪 Testing API Endpoints:"
    
    endpoints=("/health" "/api/terms" "/api/categories" "/api/status")
    
    for endpoint in "${endpoints[@]}"; do
        echo -n "  $endpoint: "
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SERVICE_URL$endpoint" 2>/dev/null || echo "000")
        
        if [ "$response" = "200" ]; then
            echo "✅ $response"
        elif [ "$response" = "000" ]; then
            echo "❌ No response"
        else
            echo "⚠️  $response"
        fi
    done
}

echo "Monitoring for 15 minutes (this usually takes 10-12 minutes)..."
echo ""

# Monitor for 15 minutes
end_time=$(($(date +%s) + 900))
check_count=0

while [ $(date +%s) -lt $end_time ]; do
    check_count=$((check_count + 1))
    
    if check_service; then
        echo ""
        echo "🎉 DEPLOYMENT SUCCESSFUL!"
        echo "================================"
        
        test_api_endpoints
        
        echo ""
        echo "✅ Service is now running at: $SERVICE_URL"
        echo "✅ This proves the apps/api source directory approach works!"
        echo ""
        echo "Next steps:"
        echo "1. Update deployment log with success"
        echo "2. Test the application functionality"
        echo "3. Consider this the new production deployment"
        exit 0
    fi
    
    # Show progress every 5 checks
    if [ $((check_count % 5)) -eq 0 ]; then
        echo "  📊 Check #$check_count - Still waiting..."
    fi
    
    sleep 30
done

echo ""
echo "❌ Deployment monitoring timed out after 15 minutes."
echo ""
echo "Check AWS App Runner console for detailed status:"
echo "1. Build logs - see if the build succeeded"
echo "2. Application logs - check for startup errors"
echo "3. Service events - look for any error messages"
echo ""
echo "The apps/api approach should work - it's the same as yesterday's success!"
