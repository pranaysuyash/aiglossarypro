#!/bin/bash

echo "🔍 Docker Image Analysis & Verification"
echo "========================================"

# List all available images with timestamps
echo "📦 Available Images:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | grep -E "(full-api|api-2025)" | head -10

echo -e "\n🧪 Testing Image Functionality:"
echo "================================"

# Test each image type
IMAGES=("full-api-20250807-131943" "api-20250807-183441" "full-api-20250807-124537")

for image in "${IMAGES[@]}"; do
    echo -e "\n--- Testing: $image ---"
    
    # Check if image exists
    if ! docker images | grep -q "$image"; then
        echo "❌ Image $image not found"
        continue
    fi
    
    # Get image size
    SIZE=$(docker images --format "{{.Size}}" "$image" | head -1)
    echo "📏 Image size: $SIZE"
    
    echo -e "\n🧪 Container functionality test:"
    # Test if container starts and packages load
    timeout 30 docker run --rm -e NODE_ENV=production -e REDIS_ENABLED=false -e DATABASE_URL="postgresql://test" "$image" node -e "
    console.log('Testing image: $image');
    console.log('Node version:', process.version);
    console.log('Current directory:', process.cwd());
    
    // Test critical package imports
    try {
        console.log('Testing package imports...');
        const packages = ['@aiglossarypro/database', '@aiglossarypro/config', '@aiglossarypro/shared', '@aiglossarypro/auth'];
        let allPass = true;
        
        for (const pkg of packages) {
            try {
                require(pkg);
                console.log('✅', pkg, '- OK');
            } catch (e) {
                console.log('❌', pkg, '- FAILED:', e.message);
                allPass = false;
            }
        }
        
        // Test if main application file exists and loads
        const fs = require('fs');
        const paths = ['dist/index.js', '/app/apps/api/dist/index.js', 'index.js', '/app/dist/index.js'];
        let foundMain = false;
        
        for (const path of paths) {
            if (fs.existsSync(path)) {
                console.log('✅ Main app found at:', path);
                foundMain = true;
                break;
            }
        }
        
        if (!foundMain) {
            console.log('❌ Main app file not found in any expected location');
            allPass = false;
        }
        
        // Check for critical dependencies
        const criticalDeps = ['express', 'bullmq', 'ioredis'];
        console.log('\\nChecking critical dependencies:');
        for (const dep of criticalDeps) {
            try {
                require(dep);
                console.log('✅', dep, '- available');
            } catch (e) {
                console.log('❌', dep, '- missing');
                allPass = false;
            }
        }
        
        if (allPass) {
            console.log('\\n✅ Image $image appears fully functional');
            process.exit(0);
        } else {
            console.log('\\n❌ Image $image has missing components');
            process.exit(1);
        }
    } catch (e) {
        console.error('❌ Image $image failed critically:', e.message);
        process.exit(1);
    }
    " && echo "✅ $image - PASSED ALL TESTS" || echo "❌ $image - FAILED TESTS"
    
    echo -e "\n📁 Container file structure check:"
    timeout 10 docker run --rm "$image" sh -c "
    echo 'Working directory:'; 
    pwd;
    echo '';
    echo 'Directory contents:'; 
    ls -la 2>/dev/null | head -10;
    echo '';
    echo 'Looking for dist/index.js:'; 
    find / -name 'index.js' -path '*/dist/*' 2>/dev/null | head -5;
    echo '';
    echo 'Package directories:';
    ls -la /app/packages/*/dist/ 2>/dev/null | head -20;
    echo '';
    echo 'Node modules check:';
    if [ -d node_modules ]; then
        echo 'node_modules exists in:' \$(pwd);
        echo 'Size:' \$(du -sh node_modules 2>/dev/null | cut -f1);
        echo 'Package count:' \$(ls node_modules | wc -l);
    else
        echo 'No node_modules in current directory';
        if [ -d /app/node_modules ]; then
            echo 'Found node_modules in /app';
            echo 'Size:' \$(du -sh /app/node_modules 2>/dev/null | cut -f1);
        fi
    fi
    " 2>/dev/null || echo "Failed to inspect container structure"
    
    echo "----------------------------------------"
done

echo -e "\n📊 ANALYSIS SUMMARY:"
echo "===================="
echo "✅ Images that PASSED: Check which ones completed all tests"
echo "❌ Images that FAILED: Note what components were missing"
echo ""
echo "🎯 RECOMMENDATION:"
echo "1. Use ONLY images that pass ALL tests"
echo "2. If 844MB image passes all tests → it's properly optimized, use it"
echo "3. If only 4.74GB images pass → they have all dependencies, use them"
echo "4. If ALL fail → we need to fix the build process"
echo ""
echo "⚠️  Size doesn't matter if functionality is missing!"