# AI/ML Glossary Pro - Production Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++ autoconf automake libtool nasm zlib-dev
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
# Install all dependencies (including devDependencies for build)
# Skip optional dependencies that cause issues in Alpine
RUN npm ci --omit=optional && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build the application
# Fix rollup issue
RUN npm install @rollup/rollup-linux-arm64-musl --save-dev --force
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Install curl for health check
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
# Copy only production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy migrations directory (needed for Drizzle ORM)
COPY --from=builder /app/migrations ./migrations

# Copy shared directory (needed for module resolution)
COPY --from=builder /app/shared ./shared

# Create necessary directories
RUN mkdir -p logs uploads
RUN chown -R appuser:nodejs /app

USER appuser

# Expose port (App Runner will override with its own PORT)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/api/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]