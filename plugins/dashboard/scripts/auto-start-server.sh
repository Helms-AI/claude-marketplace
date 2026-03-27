#!/bin/bash
# Dashboard Plugin - Auto-start Server on Session Start
# Checks if dashboard server is running and starts it if needed
#
# Exit codes:
#   0 = Success (server running or started)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract session info
SOURCE=$(echo "$INPUT" | jq -r '.source // "startup"')

# Dashboard configuration
PLUGIN_DIR="${CLAUDE_PLUGIN_ROOT}"
SERVER_DIR="${PLUGIN_DIR}/server"
PID_FILE="${PLUGIN_DIR}/.dashboard.pid"
PORT_FILE="${PLUGIN_DIR}/.dashboard.port"
LOG_FILE="${PLUGIN_DIR}/.dashboard.log"
CONFIG_FILE="${PLUGIN_DIR}/dashboard.config.json"

# Read port from config file (default 0 = auto-assign)
if [[ -f "$CONFIG_FILE" ]]; then
    CONFIG_PORT=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE')).get('port', 0))" 2>/dev/null || echo 0)
else
    CONFIG_PORT=0
fi

# Override from env var
PORT="${DASHBOARD_PORT:-$CONFIG_PORT}"

# Function to get the actual running port
get_running_port() {
    if [[ -f "$PORT_FILE" ]]; then
        cat "$PORT_FILE"
        return 0
    fi
    return 1
}

# Function to check if server is running
is_server_running() {
    if [[ -f "$PORT_FILE" ]]; then
        local port=$(cat "$PORT_FILE")
        if lsof -ti:"$port" >/dev/null 2>&1; then
            return 0
        fi
    fi
    # Also check PID file
    if is_pid_alive; then
        return 0
    fi
    return 1
}

# Function to check if PID file exists and process is alive
is_pid_alive() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" >/dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Clean up stale files
cleanup_stale() {
    if [[ -f "$PID_FILE" ]] && ! is_pid_alive; then
        rm -f "$PID_FILE" "$PORT_FILE"
    fi
}

# Start the server
start_server() {
    cd "$PLUGIN_DIR"

    # Build command args — open browser only on first start
    local cmd_args="--no-parent-monitor"
    if [[ "$PORT" != "0" ]]; then
        cmd_args="$cmd_args --port $PORT"
    fi

    # Start server in background with output redirect
    nohup python3 -m server.app $cmd_args >"$LOG_FILE" 2>&1 &
    local pid=$!

    # Save PID
    echo "$pid" > "$PID_FILE"

    # Wait for server to start and write port file
    local max_attempts=10
    local attempt=0
    while [[ $attempt -lt $max_attempts ]]; do
        if [[ -f "$PORT_FILE" ]]; then
            return 0
        fi
        sleep 0.5
        attempt=$((attempt + 1))
    done

    # If we get here, server failed to start
    rm -f "$PID_FILE"
    return 1
}

# Main logic
cleanup_stale

if is_server_running; then
    # Server already running
    RUNNING_PORT=$(get_running_port || echo "unknown")
    echo "{\"additionalContext\": \"Dashboard server is running at http://localhost:${RUNNING_PORT}\"}"
    exit 0
fi

# Try to start the server
if start_server; then
    RUNNING_PORT=$(get_running_port || echo "unknown")
    echo "{\"additionalContext\": \"Dashboard server started at http://localhost:${RUNNING_PORT}\"}"
    exit 0
else
    # Server failed to start, but don't block session startup
    echo "{\"systemMessage\": \"Dashboard server failed to start. You can launch it manually with /dashboard\"}"
    exit 0
fi
