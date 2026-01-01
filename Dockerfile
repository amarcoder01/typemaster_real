# ============================================
# TypeMasterAI - Production Dockerfile
# Optimized for Google Cloud Run
# ============================================

# Stage 1: Build Stage
# Install all dependencies and build the frontend
FROM node:20-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the Vite frontend
RUN npm run build

# Remove devDependencies after build
RUN npm prune --production

# ============================================
# Stage 2: Production Stage
# Minimal runtime image
# ============================================
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling (important for graceful shutdown)
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built frontend assets
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy server files
COPY --from=builder --chown=nodejs:nodejs /app/server ./server
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared

# Copy configuration files needed at runtime
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.json ./

# Copy migrations for database schema updates
COPY --from=builder --chown=nodejs:nodejs /app/migrations ./migrations

# Switch to non-root user
USER nodejs

# Cloud Run uses PORT environment variable (default 8080)
ENV NODE_ENV=production
ENV PORT=8080

# Node.js production optimizations
# - Increase old space size for better GC behavior
# - Enable TLS optimization
# - Disable Node.js warnings in production
ENV NODE_OPTIONS="--max-old-space-size=460 --enable-source-maps"

# Expose the port
EXPOSE 8080

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://localhost:8080/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Use dumb-init to handle signals properly (SIGTERM from Cloud Run)
# This ensures graceful shutdown works correctly
ENTRYPOINT ["dumb-init", "--"]

# Start the production server
CMD ["npx", "tsx", "server/index-prod.ts"]

