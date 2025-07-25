# AI/ML Glossary Pro - Production Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build the application
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

# Copy drizzle directory (needed for migrations)
COPY --from=builder /app/drizzle ./drizzle

# Create necessary directories
RUN mkdir -p logs uploads
RUN chown -R appuser:nodejs /app

USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]