#!/bin/bash

SERVICE_URL="https://hkntj2murq.us-east-1.awsapprunner.com"

echo "🚀 Monitoring App Runner deployment fix..."
echo "Service URL: $SERVICE_URL"
echo "Expected: Full application with health endpoint, not minimal test"
echo ""

while true; do
    echo "⏰ $(date): Checking deployment status..."
    
    # Check AWS service status
    STATUS=$(aws apprunner describe-service --service-arn $(aws apprunner list-services --query 'ServiceSummaryList[0].ServiceArn' --output text) --query 'Service.Status' --output text 2>/dev/null)
    echo "📊 AWS Status: $STATUS"
    
    # Test the health endpoint
    echo "🔍 Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s -w "HTTP_%{http_code}" "$SERVICE_URL/health" 2>/dev/null)
    
    if [[ $HEALTH_RESPONSE == *"HTTP_200"* ]]; then
        echo "✅ Health endpoint responded successfully!"
        echo "📝 Response: $(echo $HEALTH_RESPONSE | sed 's/HTTP_200$//')"
        
        # Check if it's the full app or minimal test
        if [[ $HEALTH_RESPONSE == *"healthy"* ]] && [[ $HEALTH_RESPONSE == *"timestamp"* ]]; then
            echo "🎉 SUCCESS: Full application is deployed and running!"
            echo "🔗 Service URL: $SERVICE_URL"
            echo "🏥 Health check: $SERVICE_URL/health"
            break
        else
            echo "⚠️  Got response but might still be minimal test version"
        fi
    else
        echo "❌ Health endpoint not responding properly"
        echo "📝 Response: $HEALTH_RESPONSE"
    fi
    
    # Test root endpoint too
    echo "🔍 Testing root endpoint..."
    ROOT_RESPONSE=$(curl -s -w "HTTP_%{http_code}" "$SERVICE_URL/" 2>/dev/null)
    
    if [[ $ROOT_RESPONSE == *"minimal test"* ]]; then
        echo "⚠️ WARNING: Still serving minimal test content!"
        echo "📝 Root response: $(echo $ROOT_RESPONSE | sed 's/HTTP_[0-9]*$//')"
    elif [[ $ROOT_RESPONSE == *"HTTP_200"* ]] || [[ $ROOT_RESPONSE == *"HTTP_404"* ]]; then
        echo "✅ Root endpoint responding (expected 404 for API-only service)"
    else
        echo "❌ Root endpoint issues: $ROOT_RESPONSE"
    fi
    
    if [[ $STATUS == "RUNNING" ]]; then
        echo "🔄 Service is running but may still be starting up..."
    elif [[ $STATUS == "OPERATION_IN_PROGRESS" ]]; then
        echo "🔄 Deployment still in progress..."
    else
        echo "⚠️ Unexpected status: $STATUS"
    fi
    
    echo "----------------------------------------"
    sleep 30
done

echo ""
echo "🎊 Deployment verification complete!"
echo "📋 Next steps:"
echo "   1. Test your API endpoints"
echo "   2. Verify authentication is working"
echo "   3. Check application logs if needed"