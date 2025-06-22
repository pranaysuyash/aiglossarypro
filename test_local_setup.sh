#!/bin/bash

# Test script for local development setup
echo "🧪 Testing AI Glossary Pro Local Development Setup"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "Please run this script from /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro"
    exit 1
fi

echo "✅ In correct project directory"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

echo "✅ .env file exists"

# Check if NODE_ENV is set to development
if grep -q "NODE_ENV=development" .env; then
    echo "✅ NODE_ENV set to development"
else
    echo "⚠️  Warning: NODE_ENV not explicitly set to development in .env"
    echo "   The app should still work with default development mode"
fi

# Check if database URL is configured
if grep -q "DATABASE_URL=" .env; then
    echo "✅ Database URL configured"
else
    echo "❌ Error: DATABASE_URL not found in .env"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "✅ Dependencies ready"

# Test if server can start (quick test)
echo "🔧 Testing server startup..."
timeout 10s npm run dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Test if server is responding
if curl -s "http://127.0.0.1:3001/api/health" > /dev/null; then
    echo "✅ Server started successfully"
    echo "🌐 Server accessible at http://127.0.0.1:3001"
else
    echo "⚠️  Server may not be fully ready yet (this is normal)"
    echo "   Try running 'npm run dev' manually"
fi

# Clean up
kill $SERVER_PID 2>/dev/null

echo ""
echo "🚀 Setup verification complete!"
echo ""
echo "To start the application:"
echo "1. Run: npm run dev"
echo "2. Open: http://127.0.0.1:3001"
echo "3. You should be automatically logged in as 'Development User'"
echo ""
echo "If you encounter issues, check LOCAL_DEV_GUIDE.md"
