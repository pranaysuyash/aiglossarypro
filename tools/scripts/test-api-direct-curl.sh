#!/bin/bash

# Test the actual API endpoint directly with curl
# This tests how the app actually generates content

# Configuration
API_URL="http://localhost:3000"
TERM_ID="test-transformer-term"  # You'll need to replace with actual term ID

# Get Firebase token (you'll need to provide this)
echo "Please provide your Firebase auth token:"
read -s FIREBASE_TOKEN

# Test single section generation
echo "Testing single section generation..."
curl -X POST "$API_URL/api/admin/content/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{
    "termId": "'$TERM_ID'",
    "sectionName": "Definition and Overview",
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "maxTokens": 1000
  }'

echo -e "\n\nTesting bulk generation for multiple sections..."
curl -X POST "$API_URL/api/admin/content/generate-bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -d '{
    "termId": "'$TERM_ID'",
    "sectionNames": [
      "Definition and Overview",
      "Key Concepts and Principles",
      "Importance and Relevance in AI/ML"
    ],
    "model": "gpt-4o-mini"
  }'

echo -e "\n\nChecking generation status..."
curl -X GET "$API_URL/api/admin/content/status" \
  -H "Authorization: Bearer $FIREBASE_TOKEN"

echo -e "\n\nGetting generation stats..."
curl -X GET "$API_URL/api/admin/content/stats" \
  -H "Authorization: Bearer $FIREBASE_TOKEN"