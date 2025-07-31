#!/bin/bash

echo "🚀 Testing AIGlossaryPro Container Locally"
echo "=========================================="

# Test environment variables
echo "Testing with minimal environment variables..."

# Run container in background
docker run --platform linux/amd64 -d -p 8080:8080 \
  --name aiglossary-test \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e DATABASE_URL="postgresql://test:test@localhost:5432/test" \
  -e JWT_SECRET="supersecretjwtkeythatismorethan32chars" \
  -e SESSION_SECRET="supersecretSessionkeythatismorethan32chars" \
  -e FIREBASE_PROJECT_ID="test-project" \
  -e FIREBASE_CLIENT_EMAIL="test@test.iam.gserviceaccount.com" \
  -e FIREBASE_PRIVATE_KEY_BASE64="dGVzdA==" \
  aiglossary-local

# Wait for container to start
echo "Waiting for container to start..."
sleep 10

# Check if container is running
if docker ps | grep -q aiglossary-test; then
    echo "✅ Container is running!"
    
    # Test health endpoint
    echo "Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
    
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        echo "✅ Health check passed! HTTP $HEALTH_RESPONSE"
        
        # Get actual health response
        echo "Health endpoint response:"
        curl -s http://localhost:8080/health | jq . || curl -s http://localhost:8080/health
        
    else
        echo "❌ Health check failed! HTTP $HEALTH_RESPONSE"
        echo "Container logs:"
        docker logs aiglossary-test
    fi
    
else
    echo "❌ Container failed to start!"
    echo "Container logs:"
    docker logs aiglossary-test
fi

# Cleanup
echo "Cleaning up test container..."
docker stop aiglossary-test 2>/dev/null || true
docker rm aiglossary-test 2>/dev/null || true

echo "Test completed!"
