#!/bin/bash
#
# Dashboard Development Server
# Launches both the Flask API server and serves the web UI
#
# Usage:
#   ./run.sh              # Start the dashboard (default port 24282)
#   ./run.sh --port 8080  # Start on custom port
#   ./run.sh --open       # Start and open browser
#   ./run.sh --hmr        # Start with Hot Module Replacement (browser-sync)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-24282}"
HMR_PORT="${HMR_PORT:-3000}"
OPEN_BROWSER=false
HMR_MODE=false
DEV_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --port|-p)
            PORT="$2"
            shift 2
            ;;
        --hmr-port)
            HMR_PORT="$2"
            shift 2
            ;;
        --open|-o)
            OPEN_BROWSER=true
            shift
            ;;
        --hmr|-w)
            HMR_MODE=true
            shift
            ;;
        --dev|-d)
            DEV_MODE=true
            shift
            ;;
        --help|-h)
            echo "Dashboard Development Server"
            echo ""
            echo "Usage: ./run.sh [options]"
            echo ""
            echo "Options:"
            echo "  --port, -p <port>     Set server port (default: 24282)"
            echo "  --hmr-port <port>     Set HMR proxy port (default: 3000)"
            echo "  --open, -o            Open browser after starting"
            echo "  --hmr, -w             Enable Hot Module Replacement (browser-sync)"
            echo "  --dev, -d             Dev mode: ports -100 + auto-enables HMR"
            echo "  --help, -h            Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./run.sh --port 24800 --hmr --open"
            echo "  ./run.sh -p 8080 -w -o"
            echo "  ./run.sh --dev --open             # Runs on alternate ports with HMR"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Apply dev mode settings
if [ "$DEV_MODE" = true ]; then
    PORT=$((PORT - 100))
    HMR_PORT=$((HMR_PORT - 100))
    HMR_MODE=true  # Dev mode always enables HMR
    echo "[Dev Mode] Using alternate ports: Flask=$PORT, HMR=$HMR_PORT"
    echo ""
fi

echo "╔══════════════════════════════════════════╗"
echo "║     Claude Marketplace Dashboard         ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is required but not installed."
    exit 1
fi

# Check if Flask is installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo "Installing Flask..."
    pip3 install flask flask-cors
fi

# Install npm dependencies for web frontend (HMR support)
if [ -f "$SCRIPT_DIR/web/package.json" ]; then
    if command -v npm &> /dev/null; then
        if [ ! -d "$SCRIPT_DIR/web/node_modules" ]; then
            echo "Installing npm dependencies..."
            (cd "$SCRIPT_DIR/web" && npm install)
        fi
    else
        if [ "$HMR_MODE" = true ]; then
            echo "Error: npm not found. HMR mode requires Node.js."
            echo "Install Node.js or run without --hmr flag."
            exit 1
        fi
    fi
fi

# Export environment variables for the server
export DASHBOARD_PORT="$PORT"
export DASHBOARD_WEB_DIR="$SCRIPT_DIR/web"

# Track background processes for cleanup
FLASK_PID=""
BROWSER_SYNC_PID=""

cleanup() {
    echo ""
    echo "Shutting down..."
    if [ -n "$BROWSER_SYNC_PID" ]; then
        kill $BROWSER_SYNC_PID 2>/dev/null || true
    fi
    if [ -n "$FLASK_PID" ]; then
        kill $FLASK_PID 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# Function to wait for server to be ready
wait_for_server() {
    local port=$1
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            return 0
        fi
        sleep 0.5
        attempt=$((attempt + 1))
    done
    return 1
}

# Function to open browser
open_url() {
    local url=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open "$url" 2>/dev/null || sensible-browser "$url" 2>/dev/null
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        start "$url"
    fi
}

echo "Starting Flask server on port $PORT..."

# Start Flask server in background
cd "$SCRIPT_DIR"
python3 -m server.app --port "$PORT" &
FLASK_PID=$!

# Wait for Flask to be ready
echo "Waiting for server to be ready..."
if ! wait_for_server $PORT; then
    echo "Error: Flask server failed to start"
    exit 1
fi

echo "✓ Flask server running at: http://localhost:$PORT"

# Start browser-sync for HMR if requested
if [ "$HMR_MODE" = true ]; then
    echo ""
    echo "Starting browser-sync HMR proxy on port $HMR_PORT..."

    (cd "$SCRIPT_DIR/web" && npx browser-sync start \
        --proxy "localhost:$PORT" \
        --files 'js/**/*.js,css/**/*.css,index.html' \
        --port $HMR_PORT \
        --no-open \
        --no-notify \
        --logLevel "silent" \
    ) &
    BROWSER_SYNC_PID=$!

    # Wait a moment for browser-sync to start
    sleep 2

    echo "✓ HMR proxy running at: http://localhost:$HMR_PORT"
fi

echo ""
echo "════════════════════════════════════════════"
if [ "$HMR_MODE" = true ]; then
    echo "  Dashboard:  http://localhost:$PORT"
    echo "  HMR Proxy:  http://localhost:$HMR_PORT  ← Use this for development"
    echo ""
    echo "  Edit files in web/ and see changes instantly!"
else
    echo "  Dashboard:  http://localhost:$PORT"
fi
echo "════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Open browser if requested
if [ "$OPEN_BROWSER" = true ]; then
    if [ "$HMR_MODE" = true ]; then
        open_url "http://localhost:$HMR_PORT"
    else
        open_url "http://localhost:$PORT"
    fi
fi

# Wait for Flask process (keeps script running)
wait $FLASK_PID
