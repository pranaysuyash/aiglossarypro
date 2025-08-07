#!/bin/bash

echo "🧪 Testing if full-api-20250807-131943 can start the server..."

# Start container with minimal required env vars
docker run -d --name test-api \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e DATABASE_URL="postgresql://test:test@localhost/test" \
  -e JWT_SECRET="test-secret" \
  -e SESSION_SECRET="test-session" \
  -e REDIS_ENABLED=false \
  -e LOG_LEVEL=info \
  -p 8080:8080 \
  full-api-20250807-131943

echo "⏳ Waiting 10 seconds for container to start..."
sleep 10

echo "📊 Container status:"
docker ps -a | grep test-api

echo -e "\n📋 Container logs:"
docker logs test-api 2>&1 | tail -20

echo -e "\n🧹 Cleaning up..."
docker stop test-api >/dev/null 2>&1
docker rm test-api >/dev/null 2>&1

echo "✅ Test complete"