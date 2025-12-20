#!/bin/bash
set -e

# Define port
API_PORT=${PORT:-31111}

echo "Starting Local Notes MCP Server..." >&2
cd /app

# Ensure data directory is writable
if [ ! -w "/app/data" ]; then
  echo "WARNING: /app/data directory is not writable by current user ($(id -u))." >&2
  echo "Database operations may fail. If using Docker volumes, ensure the host directory has correct permissions." >&2
fi

echo "Launching Server on port $API_PORT..." >&2
echo "  Web UI: http://0.0.0.0:$API_PORT/" >&2
echo "  REST API: http://0.0.0.0:$API_PORT/api/notes" >&2
echo "  MCP Endpoint (SSE): http://0.0.0.0:$API_PORT/mcp" >&2

# Run the server directly (production mode, no watch)
# Using node directly instead of npm start to avoid --watch flag
export PORT=$API_PORT
exec node backend/server.js
