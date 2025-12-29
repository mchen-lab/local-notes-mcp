# syntax=docker/dockerfile:1

# ============================================================================
# Unified Build Stage
# ============================================================================
ARG BASE_IMAGE=ghcr.io/mchen-lab/local-notes-mcp:base
FROM ${BASE_IMAGE} AS builder
WORKDIR /app

# Note: Dependencies and system tools are already installed in the base image.


# Copy source code
COPY . .

# Accept build metadata
ARG BUILD_METADATA
ENV BUILD_METADATA=${BUILD_METADATA}

# Accept commit hash
ARG GIT_COMMIT
ENV GIT_COMMIT=${GIT_COMMIT}

# Build Frontend
RUN npm run build --workspace=frontend

# Prune dev dependencies to prepare for production
# This keeps only production dependencies for backend
RUN npm prune --production --no-audit --no-fund

# ============================================================================
# Final Runtime Image
# ============================================================================
FROM node:20-slim AS runner

# Labels
LABEL org.opencontainers.image.title="Local Notes MCP"
LABEL org.opencontainers.image.description="A simple note-taking application with MCP (Model Context Protocol) integration"
LABEL org.opencontainers.image.source="https://github.com/mchen-lab/local-notes-mcp"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.authors="Michael Chen (@mchen-lab)"

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy processed node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy source code and artifacts
COPY backend ./backend
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY docker-entrypoint.sh ./

# Setup permissions
RUN mkdir -p /app/data && \
    chmod +x /app/docker-entrypoint.sh && \
    chown -R node:node /app

USER node

ENV PORT=31111
ENV NODE_ENV=production
EXPOSE 31111

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/notes || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]

