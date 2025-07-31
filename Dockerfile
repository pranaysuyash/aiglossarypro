# Simple production Dockerfile using tsx
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Production runtime
FROM base AS runtime
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package files for dependency installation
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

# Install all dependencies (including dev dependencies for tsx)
RUN pnpm install --frozen-lockfile

# Clean up any existing node_modules in packages/apps to avoid conflicts
RUN find packages -name "node_modules" -type d -exec rm -rf {} +; true
RUN find apps -name "node_modules" -type d -exec rm -rf {} +; true

# Copy source code after cleaning
COPY packages ./packages
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Create production env file location
RUN mkdir -p packages/config/src/config/secrets

# Set up health check directory
RUN mkdir -p /app/health

# Change ownership
RUN chown -R appuser:nodejs /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start with tsx directly for production
CMD ["./node_modules/.bin/tsx", "apps/api/src/index.ts"]