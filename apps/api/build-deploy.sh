#!/bin/bash

echo "Building API for deployment..."

# Clean dist directory
rm -rf dist

# Copy source files
cp -r src dist

# Rename all .ts files to .js
find dist -name "*.ts" -type f | while read -r file; do
    mv "$file" "${file%.ts}.js"
done

# Remove test files
find dist -name "*.test.js" -delete
find dist -name "*.spec.js" -delete

echo "Build completed successfully!"