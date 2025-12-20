# ============================================================================
# Stage 1: Frontend Build
# ============================================================================
FROM node:20-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/
RUN npm ci --no-audit --no-fund --quiet
COPY frontend ./frontend
RUN npm run build --workspace=frontend

# ============================================================================
# Stage 2: Backend Build (with build tools for native modules)
# ============================================================================
FROM node:20-slim AS backend-build
WORKDIR /app

# Install build dependencies for better-sqlite3 (native module compilation)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install dependencies (this compiles better-sqlite3)
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
RUN npm ci --no-audit --no-fund --quiet

# ============================================================================
# Stage 3: Final Runtime Image (no build tools)
# ============================================================================
FROM node:20-slim AS backend

# Labels for metadata
LABEL org.opencontainers.image.title="Local Notes MCP"
LABEL org.opencontainers.image.description="A simple note-taking application with MCP (Model Context Protocol) integration"
LABEL org.opencontainers.image.source="https://github.com/mchen-lab/local-notes-mcp"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.authors="Michael Chen (@mchen-lab)"

WORKDIR /app

# Install only runtime dependencies (curl for health checks)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled node_modules from build stage
COPY --from=backend-build /app/node_modules ./node_modules

# Copy source code and build artifacts
COPY backend ./backend
COPY --from=frontend /app/frontend/dist ./frontend/dist
COPY docker-entrypoint.sh ./

# Set up data directory and permissions
RUN mkdir -p /app/data && \
    chmod +x /app/docker-entrypoint.sh && \
    chown -R node:node /app

# Use non-root user 'node'
USER node

ENV PORT=31111
ENV NODE_ENV=production
EXPOSE 31111

# Healthcheck to verify the server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/notes || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]

