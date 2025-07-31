#!/bin/bash

# Test deployment script for AIGlossaryPro on AWS App Runner

echo "🚀 Testing AIGlossaryPro Deployment"
echo "=================================="

# Set the App Runner URL - update this with your actual URL
APP_URL="${APP_URL:-https://your-app-name.awsapprunner.com}"

echo "Testing URL: $APP_URL"
echo ""

# Test 1: Health Check
echo "1. Testing Health Check Endpoint..."
echo "   GET $APP_URL/health"
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$APP_URL/health")
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ Health check passed (HTTP $HTTP_STATUS)"
    echo "   Response: $BODY"
else
    echo "   ❌ Health check failed (HTTP $HTTP_STATUS)"
    echo "   Response: $BODY"
fi
echo ""

# Test 2: API Documentation
echo "2. Testing API Documentation..."
echo "   GET $APP_URL/api/docs"
DOC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/docs")
if [ "$DOC_STATUS" = "200" ] || [ "$DOC_STATUS" = "301" ] || [ "$DOC_STATUS" = "302" ]; then
    echo "   ✅ API documentation accessible (HTTP $DOC_STATUS)"
else
    echo "   ❌ API documentation not accessible (HTTP $DOC_STATUS)"
fi
echo ""

# Test 3: Main API Endpoint
echo "3. Testing Main API Endpoint..."
echo "   GET $APP_URL/api/terms"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/terms")
if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "401" ]; then
    echo "   ✅ API endpoint responding (HTTP $API_STATUS)"
else
    echo "   ❌ API endpoint not responding properly (HTTP $API_STATUS)"
fi
echo ""

# Test 4: Static Assets (if applicable)
echo "4. Testing Static Assets..."
echo "   GET $APP_URL/"
ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/")
if [ "$ROOT_STATUS" = "200" ]; then
    echo "   ✅ Root page accessible (HTTP $ROOT_STATUS)"
else
    echo "   ⚠️  Root page status: HTTP $ROOT_STATUS"
fi
echo ""

# Summary
echo "=================================="
echo "Deployment Test Summary:"
echo ""
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Application is running and healthy!"
    echo ""
    echo "Next steps:"
    echo "1. Check AWS CloudWatch logs for any errors"
    echo "2. Test authentication endpoints"
    echo "3. Verify database connectivity"
    echo "4. Test core functionality"
else
    echo "❌ Application health check failed!"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check AWS App Runner logs"
    echo "2. Verify environment variables are set"
    echo "3. Check build logs for errors"
    echo "4. Ensure all dependencies are installed"
fi