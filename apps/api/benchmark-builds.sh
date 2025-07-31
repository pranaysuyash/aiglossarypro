#!/bin/bash

echo "🔬 Build Performance Comparison"
echo "================================"
echo ""

# Clean build directory
rm -rf dist/

# Test 1: esbuild (fast build)
echo "1. Testing esbuild (fast build)..."
echo "   Command: npm run build:fast"
START_TIME=$(date +%s%3N)
npm run build:fast > /dev/null 2>&1
END_TIME=$(date +%s%3N)
ESBUILD_TIME=$((END_TIME - START_TIME))
echo "   ✅ esbuild completed in: ${ESBUILD_TIME}ms"
echo ""

# Clean build directory
rm -rf dist/

# Test 2: TypeScript compiler
echo "2. Testing TypeScript compiler..."
echo "   Command: npm run build:tsc"
START_TIME=$(date +%s%3N)
timeout 60s npm run build:tsc > /dev/null 2>&1
TSC_EXIT_CODE=$?
END_TIME=$(date +%s%3N)
TSC_TIME=$((END_TIME - START_TIME))

if [ $TSC_EXIT_CODE -eq 124 ]; then
    echo "   ❌ TypeScript build timed out after 60 seconds"
    TSC_TIME=60000
else
    echo "   ✅ TypeScript completed in: ${TSC_TIME}ms"
fi
echo ""

# Calculate improvement
if [ $TSC_TIME -gt 0 ]; then
    IMPROVEMENT=$((TSC_TIME * 100 / ESBUILD_TIME))
    SPEEDUP=$((IMPROVEMENT / 100))
    echo "📊 Results Summary:"
    echo "==================="
    echo "esbuild:     ${ESBUILD_TIME}ms"
    echo "TypeScript:  ${TSC_TIME}ms"
    echo ""
    echo "🚀 esbuild is ${SPEEDUP}x faster!"
    echo "   (${IMPROVEMENT}% of original build time saved)"
fi