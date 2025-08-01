#!/bin/bash

PROJECT_DIR="/Users/pranay/Projects/AIMLGlossary/AIGlossaryPro"
cd "$PROJECT_DIR"

echo "=== DEPLOYMENT ROOT CAUSE ANALYSIS ==="
echo "Time: $(date)"
echo "Directory: $(pwd)"

echo -e "\n=== 1. BUILD OUTPUT CHECK ==="
if [ -f "apps/api/dist/index.js" ]; then
    echo "✅ Build exists: apps/api/dist/index.js"
    echo "Size: $(ls -lh apps/api/dist/index.js | awk '{print $5}')"
else
    echo "❌ Build missing: apps/api/dist/index.js"
    exit 1
fi

echo -e "\n=== 2. LOCAL PRODUCTION TEST ==="
echo "Testing: NODE_ENV=production PORT=8080 node apps/api/dist/index.js"

# Kill any existing process
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
sleep 1

# Start server
NODE_ENV=production PORT=8080 node apps/api/dist/index.js &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait and test
sleep 5
if curl -s --max-time 5 http://localhost:8080/health > /dev/null; then
    echo "✅ Local server starts and responds"
    curl -s http://localhost:8080/health | head -2
else
    echo "❌ Local server failed"
    ps -p $SERVER_PID > /dev/null && echo "Process running but not responding" || echo "Process died"
fi

# Cleanup
kill $SERVER_PID 2>/dev/null || true

echo -e "\n=== 3. AWS SERVICE STATUS ==="
if command -v aws &> /dev/null; then
    aws apprunner list-services --query 'ServiceSummaryList[*].{Name:ServiceName,Status:Status}' --output table 2>/dev/null || echo "AWS CLI error"
else
    echo "AWS CLI not available"
fi

echo -e "\n=== 4. CONFIGURATION CHECK ==="
echo "apprunner.yaml command:"
grep -A 1 "command:" apprunner.yaml || echo "Command not found"

echo -e "\nEnvironment variables:"
grep -A 10 "env:" apprunner.yaml | head -10

echo -e "\n=== ANALYSIS COMPLETE ==="
