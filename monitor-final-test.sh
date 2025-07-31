#\!/bin/bash

echo "🚀 Monitoring aiglossary-final-test deployment..."
echo "Service URL: https://ffxtu58ak2.us-east-1.awsapprunner.com"
echo ""

while true; do
    STATUS=$(aws apprunner describe-service \
        --service-arn "arn:aws:apprunner:us-east-1:927289246324:service/aiglossary-final-test/8077ca4d02214f499f9a88a79ce7004e" \
        --query 'Service.Status' \
        --output text)
    
    echo "$(date): Status = $STATUS"
    
    if [ "$STATUS" = "RUNNING" ]; then
        echo "✅ Service is RUNNING\!"
        echo "Testing health endpoint..."
        curl -s https://ffxtu58ak2.us-east-1.awsapprunner.com/health
        echo ""
        break
    elif [ "$STATUS" = "CREATE_FAILED" ]; then
        echo "❌ Service creation FAILED\!"
        break
    fi
    
    sleep 30
done
