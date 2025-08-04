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
WORKDIR /repo

# Copy everything (monorepo)
COPY . .

# Install dependencies and build all packages
RUN pnpm install --frozen-lockfile && \
    pnpm -r run build

# Create a self-contained folder for the API using pnpm deploy
RUN pnpm deploy --filter=./apps/api --prod /tmp/api

# Production stage
FROM node:20-alpine

# Install debugging tools
RUN apk add --no-cache curl bash tini

WORKDIR /app

# Copy the deployed API (contains dist/ and node_modules/)
COPY --from=builder /tmp/api .

# Set environment
ENV NODE_ENV=production

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

# Start directly with node - using minimal server for production
CMD ["node", "dist/index-minimal.js"]