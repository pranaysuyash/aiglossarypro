#!/bin/bash
# Test script for deployed API endpoints

set -e

API_URL="https://wkrc9gtwwm.us-east-1.awsapprunner.com"

echo "🧪 Testing AIGlossaryPro API at: $API_URL"
echo "================================================"

# Test 1: Health Check
echo -e "\n1️⃣ Testing Health Endpoint..."
echo "GET $API_URL/health"
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$API_URL/health")
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Response: $BODY"
echo "Status: $HTTP_STATUS"

if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed with status $HTTP_STATUS"
fi

# Test 2: API Info
echo -e "\n2️⃣ Testing API Info Endpoint..."
echo "GET $API_URL/api"
curl -s "$API_URL/api" | jq '.' || echo "Failed to parse JSON"

# Test 3: Terms Endpoint (without auth)
echo -e "\n3️⃣ Testing Terms Endpoint (no auth)..."
echo "GET $API_URL/api/terms?limit=5"
TERMS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$API_URL/api/terms?limit=5")
HTTP_STATUS=$(echo "$TERMS_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
BODY=$(echo "$TERMS_RESPONSE" | sed '/HTTP_STATUS:/d')

if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ Terms endpoint accessible"
    echo "$BODY" | jq '.terms[0:2]' 2>/dev/null || echo "$BODY"
else
    echo "Status: $HTTP_STATUS"
    echo "Response: $BODY"
fi

# Test 4: Random Term
echo -e "\n4️⃣ Testing Random Term Endpoint..."
echo "GET $API_URL/api/terms/random"
curl -s "$API_URL/api/terms/random" | jq '.' || echo "Failed to get random term"

# Test 5: Search Terms
echo -e "\n5️⃣ Testing Search Endpoint..."
echo "GET $API_URL/api/terms/search?q=machine"
curl -s "$API_URL/api/terms/search?q=machine&limit=3" | jq '.terms[0:2]' 2>/dev/null || echo "Search failed"

# Test 6: Categories
echo -e "\n6️⃣ Testing Categories Endpoint..."
echo "GET $API_URL/api/categories"
curl -s "$API_URL/api/categories" | jq '.categories[0:3]' 2>/dev/null || echo "Categories failed"

# Test 7: CORS Headers
echo -e "\n7️⃣ Testing CORS Headers..."
echo "OPTIONS $API_URL/api/terms"
CORS_RESPONSE=$(curl -s -I -X OPTIONS "$API_URL/api/terms" -H "Origin: https://aiglossarypro.com")
echo "$CORS_RESPONSE" | grep -i "access-control" || echo "No CORS headers found"

echo -e "\n================================================"
echo "🏁 API testing complete!"
echo ""
echo "Note: Some endpoints may require authentication."
echo "To test authenticated endpoints, you'll need a valid Firebase ID token."