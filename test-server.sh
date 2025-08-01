#!/bin/bash

echo "🔍 Testing API server startup..."

cd apps/api

echo "📦 Building API..."
npm run build

echo "🚀 Starting API server..."
PORT=3001 SEPARATE_FRONTEND_SERVER=true NODE_ENV=development node dist/index.js &

SERVER_PID=$!
sleep 5

echo "🏥 Testing health check..."
curl -s http://localhost:3001/health || echo "❌ Health check failed"

echo "🛑 Stopping test server..."
kill $SERVER_PID 2>/dev/null

echo "✅ Test complete"
