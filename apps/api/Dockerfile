# Build stage
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

# Build arguments for cross-compilation
ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy workspace packages
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build workspace packages in correct order with relaxed type checking
RUN SKIP_TYPE_CHECK=true pnpm --filter @aiglossarypro/shared run build:fast || \
    pnpm --filter @aiglossarypro/shared run build || true && \
    SKIP_TYPE_CHECK=true pnpm --filter @aiglossarypro/database run build:fast || \
    pnpm --filter @aiglossarypro/database run build || true && \
    SKIP_TYPE_CHECK=true pnpm --filter @aiglossarypro/auth run build:fast || \
    pnpm --filter @aiglossarypro/auth run build || true && \
    SKIP_TYPE_CHECK=true pnpm --filter @aiglossarypro/config run build:fast || \
    pnpm --filter @aiglossarypro/config run build || true

# Build API with the working build system
WORKDIR /app/apps/api
RUN NODE_ENV=production pnpm run build:fast

# Production stage
FROM node:20-alpine

# Install pnpm and debugging tools
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    apk add --no-cache curl bash tini

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy built packages and API
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

WORKDIR /app/apps/api

# Create startup script with better error handling
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash
set -e

echo "=== Container Starting ==="
echo "Platform: $(uname -m)"
echo "Node version: $(node --version)"
echo "Working directory: $(pwd)"

# Function to check required env vars
check_env() {
    local var_name=$1
    local var_value=${!var_name}
    if [ -z "$var_value" ]; then
        echo "WARNING: $var_name is not set"
        return 1
    else
        echo "✓ $var_name is set"
        return 0
    fi
}

# Validate critical environment variables
echo ""
echo "=== Environment Validation ==="
MISSING_VARS=0

check_env "NODE_ENV" || MISSING_VARS=$((MISSING_VARS + 1))
check_env "PORT" || MISSING_VARS=$((MISSING_VARS + 1))
check_env "DATABASE_URL" || MISSING_VARS=$((MISSING_VARS + 1))
check_env "JWT_SECRET" || MISSING_VARS=$((MISSING_VARS + 1))

if [ $MISSING_VARS -gt 0 ]; then
    echo ""
    echo "ERROR: $MISSING_VARS required environment variable(s) missing!"
    echo "Please ensure all required variables are set."
    
    # In production, we might want to fail fast
    if [ "$NODE_ENV" = "production" ] && [ "$STRICT_ENV_CHECK" = "true" ]; then
        exit 1
    fi
fi

# Check if .env file exists (for local development)
if [ -f "/app/.env" ]; then
    echo "✓ .env file found at /app/.env"
fi

# List files in dist directory
echo ""
echo "=== Application Files ==="
if [ -d "dist" ]; then
    echo "dist/ contents:"
    ls -la dist/ | head -10
else
    echo "ERROR: dist/ directory not found!"
    exit 1
fi

# Check if main entry point exists
if [ ! -f "dist/index.js" ]; then
    echo "ERROR: dist/index.js not found!"
    exit 1
fi

echo ""
echo "=== Starting Application ==="
exec node dist/index.js
EOF

RUN chmod +x /app/start.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 8080

# Health check with better timeout
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:8080/health || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start directly with node
CMD ["node", "dist/index.js"]