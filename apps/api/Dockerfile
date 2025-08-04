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

# Production stage - Full workspace approach (most reliable)
FROM node:20-alpine

# Install pnpm and debugging tools
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    apk add --no-cache curl bash tini

WORKDIR /repo

# Copy everything the workspace links rely on (this is the key!)
COPY --from=builder /repo/pnpm-workspace.yaml .
COPY --from=builder /repo/pnpm-lock.yaml .
COPY --from=builder /repo/package.json .
COPY --from=builder /repo/.npmrc .
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/api ./apps/api

# Install only production dependencies with workspace links intact
RUN pnpm install --prod --frozen-lockfile

# Debug: Verify the workspace structure works
RUN echo "=== PACKAGES STRUCTURE ===" && \
    ls -la /repo/packages/database/dist/ && \
    echo "=== API node_modules workspace links ===" && \
    ls -la /repo/apps/api/node_modules/@aiglossarypro/ && \
    echo "=== Database package link verification ===" && \
    ls -la /repo/apps/api/node_modules/@aiglossarypro/database/dist/

# Set working directory to API
WORKDIR /repo/apps/api

# Set environment
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the entire repo
RUN chown -R nodejs:nodejs /repo

USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:8080/health || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application from the API directory
CMD ["node", "dist/index-minimal.js"]