#!/bin/bash

echo "🔄 Rebuilding packages with fixes..."

# Build database package first (removed dotenv loading)
echo "📦 Building database package..."
cd packages/database
pnpm build
cd ../..

# Build API package (added dotenv loading)
echo "📦 Building API package..."
cd apps/api  
npm run build
cd ../..

echo "✅ Rebuild complete!"
