#!/bin/bash

echo "🔍 Checking AWS App Runner Deployment Status"
echo "============================================="

SERVICE_URL="https://ygwpjcgvxu.us-east-1.awsapprunner.com"

# Test basic connectivity
echo "1. Testing DNS resolution..."
nslookup ygwpjcgvxu.us-east-1.awsapprunner.com

echo -e "\n2. Testing HTTPS connectivity..."
timeout 10 curl -v "$SERVICE_URL/health" 2>&1 | head -20

echo -e "\n3. Quick status check..."
response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$SERVICE_URL/health" 2>/dev/null || echo "000")
echo "HTTP Response Code: $response"

if [ "$response" = "200" ]; then
    echo "✅ Service is working!"
elif [ "$response" = "000" ]; then
    echo "❌ Service not reachable - likely still deploying or failed"
else
    echo "⚠️ Service responding but with error code $response"
fi

echo -e "\n4. AWS CLI Status (if configured)..."
aws apprunner list-services --query 'ServiceSummaryList[?contains(ServiceName, `aiglossarypro`)].{Name:ServiceName,Status:Status,URL:ServiceUrl}' --output table 2>/dev/null || echo "AWS CLI not configured"

echo -e "\nNext steps:"
echo "- Check AWS App Runner console for detailed logs"
echo "- Look for build errors or application startup issues"
echo "- Consider fallback to apps/api source directory if this fails"
