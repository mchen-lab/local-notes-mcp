#!/bin/bash

# Get the absolute path of the local-notes-mcp project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if node_modules exists (dependencies installed)
if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
    echo "❌ Error: node_modules not found. Please run 'npm install' from the root directory first."
    exit 1
fi

# Function to backup existing log file
backup_log() {
    local log_file=$1
    local log_name=$2

    if [ -f "$log_file" ]; then
        if [ -f "${log_file}.bak" ]; then
            echo "Overwriting existing $log_name backup and creating new backup: ${log_file}.bak"
        else
            echo "Backing up existing $log_name log to ${log_file}.bak"
        fi
        mv "$log_file" "${log_file}.bak"
    fi
}

# Function to kill process on a specific port
kill_port() {
    local port=$1
    local process_name=$2

    echo "Checking for existing $process_name processes on port $port..."
    # Find processes using the port (lsof is most reliable)
    local pids=$(lsof -ti :$port 2>/dev/null)
    
    # Also check for npm workspace processes that might be running
    if [ -z "$pids" ]; then
        pids=$(pgrep -f "workspace=$process_name" 2>/dev/null || true)
    fi
    
    # Also kill any node processes that might be related (server.js or the port)
    if [ -z "$pids" ]; then
        pids=$(pgrep -f "node.*server.js" 2>/dev/null || true)
    fi
    
    # Also check for node --watch processes
    if [ -z "$pids" ]; then
        pids=$(pgrep -f "node --watch" 2>/dev/null || true)
    fi

    if [ ! -z "$pids" ]; then
        echo "Found existing $process_name process(es) (PIDs: $pids). Killing..."
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 2 # Give processes time to shut down
        # Verify they are killed
        local remaining_pids=$(lsof -ti :$port 2>/dev/null)
        if [ ! -z "$remaining_pids" ]; then
            echo "⚠️  Warning: Some processes on port $port may still be running. Trying again..."
            echo "$remaining_pids" | xargs kill -9 2>/dev/null || true
            sleep 2
        fi
        # Final check
        remaining_pids=$(lsof -ti :$port 2>/dev/null)
        if [ -z "$remaining_pids" ]; then
            echo "✅ Successfully killed processes on port $port."
        else
            echo "⚠️  Warning: Port $port may still be in use (PIDs: $remaining_pids)"
        fi
    else
        echo "No $process_name processes found on port $port."
    fi
    
    # Additional wait to ensure port is fully released
    sleep 1
}

start_server() {
    echo "🚀 Starting local-notes-mcp on port 31111..."

    # Ensure logs/servers directory exists
    mkdir -p "$PROJECT_ROOT/logs/servers"

    # Backup existing server log
    backup_log "$PROJECT_ROOT/logs/servers/server.log" "server"

    # Start server with watch mode enabled ONLY for the backend directory
    # This prevents restarts when Vite/frontend files change
    cd "$PROJECT_ROOT"
    node --watch --watch-path=backend backend/server.js >> "$PROJECT_ROOT/logs/servers/server.log" 2>&1 &
    SERVER_PID=$!
    echo "✅ Server started with PID: $SERVER_PID"
    echo "📝 Server logs: $PROJECT_ROOT/logs/servers/server.log"
}

# Trap function to kill processes
cleanup() {
    echo ""
    echo "Cleaning up..."
    if [ ! -z "$TAIL_PID" ]; then
        kill $TAIL_PID 2>/dev/null
    fi
    if [ ! -z "$SERVER_PID" ]; then
        echo "Killing server process $SERVER_PID"
        kill $SERVER_PID 2>/dev/null
    fi
    # Also attempt to kill by port as a fallback
    kill_port 31111 "server"
    exit 0
}

trap cleanup INT TERM EXIT

echo "🛑 Stopping any existing local-notes-mcp server..."
kill_port 31111 "server"

echo ""
echo "🧹 Cleaning previous build artifacts..."
if [ -d "$PROJECT_ROOT/frontend/dist" ]; then
    echo "   Removing frontend/dist directory to force dev mode..."
    rm -rf "$PROJECT_ROOT/frontend/dist"
    echo "   ✅ Cleaned frontend/dist"
fi

echo "🎯 Starting local-notes-mcp..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
start_server

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ local-notes-mcp is running!"
echo ""
echo "📍 Services:"
echo "   • Web UI & API: http://localhost:31111"
echo ""
echo "Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Tail the logs to keep the script running and show output
echo "📋 Tailing logs (Ctrl+C to stop)..."
tail -f "$PROJECT_ROOT/logs/servers/server.log" &
TAIL_PID=$!

wait $TAIL_PID
