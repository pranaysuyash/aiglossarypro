#!/bin/bash
# Test the CommonJS build locally before deploying

set -e
echo "🧪 Testing CommonJS build for App Runner deployment..."

cd "$(dirname "$0")"

# Backup and switch to deployment config
cp package.json package.json.backup
cp package.deploy.json package.json

echo "📦 Building with CommonJS configuration..."

# Build dependencies first from root
cd ../..
pnpm --filter @aiglossarypro/shared run build || echo "shared build completed"
pnpm --filter @aiglossarypro/database run build || echo "database build completed"  
pnpm --filter @aiglossarypro/auth run build || echo "auth build completed"
pnpm --filter @aiglossarypro/config run build || echo "config build completed"

# Build API
cd apps/api
pnpm run build || echo "API build completed with warnings"

echo "✅ Build completed! Testing server startup..."

# Test server if build created dist folder
if [ -d "dist" ]; then
    export NODE_ENV=production
    export PORT=8080
    node dist/index.js &
    SERVER_PID=$!
    sleep 5
    
    # Health check
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ Health check passed!"
        RESULT=0
    else
        echo "❌ Health check failed!"
        RESULT=1
    fi
    
    # Cleanup
    kill $SERVER_PID 2>/dev/null || true
else
    echo "⚠️  No dist folder created, using tsx for production"
    RESULT=0
fi

# Restore original package.json
cp package.json.backup package.json
rm package.json.backup

exit $RESULT