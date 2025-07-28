#!/bin/bash

# Test script to verify ESM build works locally before App Runner deployment

echo "🧪 Testing ESM Build Locally"
echo "============================="

# Step 1: Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Step 2: Check if dist/index.js exists
if [ ! -f "dist/index.js" ]; then
    echo "❌ dist/index.js not found"
    exit 1
fi

echo "✅ dist/index.js exists"

# Step 3: Set minimal environment variables for testing
export NODE_ENV=production
export PORT=8080
export DATABASE_URL="postgresql://test:test@localhost:5432/test"
export SESSION_SECRET="test-secret-for-local-testing"
export FIREBASE_PROJECT_ID="test"
export FIREBASE_CLIENT_EMAIL="test@test.com"
export FIREBASE_PRIVATE_KEY_BASE64="dGVzdA=="
export REDIS_ENABLED="false"

# Step 4: Try to start the server and test if it responds
echo "🚀 Starting server..."

# Start server in background
timeout 30s node dist/index.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 5

# Test health endpoint
echo "🏥 Testing health endpoint..."
curl -f http://localhost:8080/api/health &>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Health check passed - server is responding!"
    
    # Get full health check response
    echo "📊 Health check response:"
    curl -s http://localhost:8080/api/health | jq . 2>/dev/null || curl -s http://localhost:8080/api/health
    
    echo ""
    echo "🎉 ESM build appears to be working correctly!"
    
    # Kill the server
    kill $SERVER_PID 2>/dev/null
    
    exit 0
else
    echo "❌ Health check failed - server is not responding"
    
    # Show any error output
    echo "📜 Server output:"
    jobs -p | xargs -I {} ps -p {} -o pid,cmd
    
    # Kill the server if it's still running
    kill $SERVER_PID 2>/dev/null
    
    exit 1
fi