#\!/bin/bash

echo "🚀 Monitoring aiglossary-production-exact deployment..."
echo "Service URL: https://hkntj2murq.us-east-1.awsapprunner.com"
echo "Deploying FULL APP (not tests) with production database"
echo ""

while true; do
    STATUS=$(aws apprunner describe-service \
        --service-arn "arn:aws:apprunner:us-east-1:927289246324:service/aiglossary-production-exact/4c18809fdc9c4628bff6d3cb83883cc2" \
        --query 'Service.Status' \
        --output text)
    
    echo "$(date): Status = $STATUS"
    
    if [ "$STATUS" = "RUNNING" ]; then
        echo "✅ Service is RUNNING\!"
        echo ""
        echo "Testing endpoints..."
        echo "Health check:"
        curl -s https://hkntj2murq.us-east-1.awsapprunner.com/health | jq . || curl -s https://hkntj2murq.us-east-1.awsapprunner.com/health
        echo ""
        echo "API root:"
        curl -s https://hkntj2murq.us-east-1.awsapprunner.com/ | head -200
        break
    elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "UPDATE_FAILED" ]; then
        echo "❌ Service deployment FAILED\!"
        break
    fi
    
    sleep 30
done
