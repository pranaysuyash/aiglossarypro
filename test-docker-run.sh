#!/bin/bash

# Simple script to test what we actually built
echo "Building new image with correct esbuild..."

# Build with esbuild.simple.js like we tested locally
cd /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro/apps/api
node esbuild.simple.js

# Build Docker image from project root with a temporary Dockerfile
cd /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro

cat > Dockerfile.debug << 'EOF'
FROM node:20-alpine

# Install debugging tools
RUN apk add --no-cache curl bash

WORKDIR /app

# Copy the entire project structure
COPY . .

# Set working directory to API
WORKDIR /app/apps/api

# Debug: Show what files we have
RUN ls -la dist/ || echo "No dist directory"

# Create startup script that shows debug info
RUN cat > /app/debug-start.sh << 'STARTUP'
#!/bin/bash
echo "=== DEBUG INFO ==="
echo "Working directory: $(pwd)"
echo "Files in current dir:"
ls -la
echo "Files in dist/:"
ls -la dist/ || echo "No dist/"
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "Starting application..."
exec node dist/index.js
STARTUP

RUN chmod +x /app/debug-start.sh

CMD ["/app/debug-start.sh"]
EOF

echo "Building debug image..."
docker build -f Dockerfile.debug -t aiglossarypro-debug .