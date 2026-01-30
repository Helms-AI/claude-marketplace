#!/usr/bin/env python3
"""Launcher script for the dashboard server.

This script can run in two modes:
1. MCP mode (default): Runs as an MCP server, launching the web dashboard in a background thread
2. Standalone mode (--standalone): Runs the web server directly in the foreground

Process Management:
- Writes a PID file to track the running process
- On startup, cleans up any orphaned processes from previous runs
- Properly shuts down when MCP stdin closes or signals received
"""

import argparse
import atexit
import json
import os
import signal
import socket
import sys
import threading
import time
import urllib.request
import urllib.error
import webbrowser

# Add the dashboard plugin directory to Python path
plugin_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, plugin_root)

# Global shutdown event
_shutdown_event = threading.Event()


def get_plugin_version() -> str:
    """Read the version from plugin.json.

    Returns:
        Version string from plugin.json, or 'unknown' if not found.
    """
    plugin_json_path = os.path.join(plugin_root, '.claude-plugin', 'plugin.json')
    try:
        with open(plugin_json_path, 'r') as f:
            data = json.load(f)
            return data.get('version', 'unknown')
    except (IOError, json.JSONDecodeError) as e:
        print(f"Warning: Could not read plugin version: {e}", file=sys.stderr)
        return 'unknown'

# PID file location
def get_pid_file_path(port: int) -> str:
    """Get the path to the PID file for the given port."""
    # Use a consistent location in /tmp or user's home
    pid_dir = os.path.expanduser('~/.claude/dashboard')
    os.makedirs(pid_dir, exist_ok=True)
    return os.path.join(pid_dir, f'dashboard-{port}.pid')


def is_port_in_use(port: int) -> bool:
    """Check if a port is currently in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('127.0.0.1', port))
            return False
        except socket.error:
            return True


def is_dashboard_running(port: int) -> bool:
    """Check if a healthy dashboard instance is already running on the port.

    Returns True if the dashboard is responding to health checks.
    """
    try:
        url = f"http://127.0.0.1:{port}/api/heartbeat"
        req = urllib.request.Request(url, method='GET')
        req.add_header('Accept', 'application/json')
        with urllib.request.urlopen(req, timeout=2) as response:
            if response.status == 200:
                return True
    except (urllib.error.URLError, urllib.error.HTTPError, socket.timeout, OSError):
        pass
    return False


def is_process_alive(pid: int) -> bool:
    """Check if a process with the given PID is still running."""
    try:
        os.kill(pid, 0)  # Signal 0 just checks if process exists
        return True
    except OSError:
        return False


def cleanup_orphaned_process(port: int) -> bool:
    """Check for and clean up any orphaned dashboard process.

    Returns True if cleanup was performed or no cleanup needed.
    Returns False if cleanup failed.
    """
    pid_file = get_pid_file_path(port)

    # Check if PID file exists
    if os.path.exists(pid_file):
        try:
            with open(pid_file, 'r') as f:
                old_pid = int(f.read().strip())

            if is_process_alive(old_pid):
                print(f"Found existing dashboard process (PID: {old_pid}), terminating...", file=sys.stderr)
                try:
                    os.kill(old_pid, signal.SIGTERM)
                    # Wait a bit for graceful shutdown
                    for _ in range(10):  # Wait up to 1 second
                        time.sleep(0.1)
                        if not is_process_alive(old_pid):
                            break
                    else:
                        # Force kill if still alive
                        print(f"Force killing old process (PID: {old_pid})...", file=sys.stderr)
                        os.kill(old_pid, signal.SIGKILL)
                        time.sleep(0.1)
                except ProcessLookupError:
                    pass  # Already dead
                except PermissionError:
                    print(f"Cannot kill process {old_pid} - permission denied", file=sys.stderr)
                    return False

            # Remove stale PID file
            os.remove(pid_file)

        except (ValueError, IOError) as e:
            print(f"Error reading PID file: {e}", file=sys.stderr)
            try:
                os.remove(pid_file)
            except:
                pass

    # Also check if port is in use even without PID file
    if is_port_in_use(port):
        print(f"Port {port} is in use but no PID file found. Attempting to find process...", file=sys.stderr)
        # Try to find the process using the port (platform-specific)
        try:
            import subprocess
            if sys.platform == 'darwin':
                # macOS: use lsof
                result = subprocess.run(
                    ['lsof', '-ti', f':{port}'],
                    capture_output=True, text=True
                )
                if result.stdout.strip():
                    for pid_str in result.stdout.strip().split('\n'):
                        try:
                            pid = int(pid_str)
                            print(f"Killing process {pid} using port {port}...", file=sys.stderr)
                            os.kill(pid, signal.SIGTERM)
                            time.sleep(0.2)
                        except (ValueError, ProcessLookupError):
                            pass
            elif sys.platform == 'linux':
                # Linux: use fuser
                result = subprocess.run(
                    ['fuser', f'{port}/tcp'],
                    capture_output=True, text=True
                )
                if result.stdout.strip():
                    for pid_str in result.stdout.strip().split():
                        try:
                            pid = int(pid_str)
                            print(f"Killing process {pid} using port {port}...", file=sys.stderr)
                            os.kill(pid, signal.SIGTERM)
                            time.sleep(0.2)
                        except (ValueError, ProcessLookupError):
                            pass
        except Exception as e:
            print(f"Could not find/kill process using port {port}: {e}", file=sys.stderr)

        # Wait a bit and check again
        time.sleep(0.5)
        if is_port_in_use(port):
            print(f"Warning: Port {port} is still in use", file=sys.stderr)
            return False

    return True


def write_pid_file(port: int):
    """Write the current PID to the PID file."""
    pid_file = get_pid_file_path(port)
    with open(pid_file, 'w') as f:
        f.write(str(os.getpid()))
    print(f"PID file written: {pid_file}", file=sys.stderr)


def remove_pid_file(port: int):
    """Remove the PID file on shutdown."""
    pid_file = get_pid_file_path(port)
    try:
        if os.path.exists(pid_file):
            os.remove(pid_file)
            print(f"PID file removed: {pid_file}", file=sys.stderr)
    except Exception as e:
        print(f"Error removing PID file: {e}", file=sys.stderr)


def run_web_server(port: int, host: str, open_browser: bool, standalone: bool = False):
    """Run the Flask web server.

    Args:
        port: Port to listen on
        host: Host to bind to
        open_browser: Whether to open browser on startup
        standalone: If True, run in foreground with full signal handling
    """
    from server.app import create_app

    app = create_app(local_only=(host == '127.0.0.1'))

    if open_browser:
        url = f"http://127.0.0.1:{port}"
        print(f"Opening browser to {url}", file=sys.stderr)
        webbrowser.open(url)

    print(f"Starting dashboard server on {host}:{port}", file=sys.stderr)

    # Use werkzeug's server with shutdown capability
    from werkzeug.serving import make_server

    server = make_server(host, port, app, threaded=True)

    if standalone:
        # In standalone mode, run blocking and respond to shutdown event
        def check_shutdown():
            while not _shutdown_event.is_set():
                time.sleep(0.5)
            print("Shutdown event received, stopping server...", file=sys.stderr)
            server.shutdown()

        shutdown_thread = threading.Thread(target=check_shutdown, daemon=True)
        shutdown_thread.start()

    try:
        server.serve_forever()
    except Exception as e:
        print(f"Server error: {e}", file=sys.stderr)
    finally:
        print("Web server stopped", file=sys.stderr)


def run_mcp_mode(port: int, host: str, open_browser: bool):
    """Run as an MCP server with web dashboard in background.

    The web server runs in a background thread. When MCP stdin closes
    (indicating the parent Claude process exited), we trigger a clean shutdown.
    """
    from werkzeug.serving import make_server
    from server.app import create_app

    # Create the Flask app
    app = create_app(local_only=(host == '127.0.0.1'))

    # Create server instance so we can shut it down
    server = make_server(host, port, app, threaded=True)

    def run_server():
        """Run the web server until shutdown."""
        try:
            server.serve_forever()
        except Exception as e:
            if not _shutdown_event.is_set():
                print(f"Server error: {e}", file=sys.stderr)
        finally:
            print("Web server stopped", file=sys.stderr)

    # Start web server in background thread (not daemon so it can cleanup)
    web_thread = threading.Thread(target=run_server, daemon=False)
    web_thread.start()

    if open_browser:
        # Wait a moment for server to start, then open browser
        time.sleep(0.5)
        url = f"http://127.0.0.1:{port}"
        print(f"Opening browser to {url}", file=sys.stderr)
        webbrowser.open(url)

    print(f"Dashboard server running on {host}:{port}", file=sys.stderr)

    # MCP server info
    server_info = {
        "name": "dashboard",
        "version": get_plugin_version(),
        "description": f"Claude Marketplace Dashboard - Web UI running at http://127.0.0.1:{port}"
    }

    # Simple MCP protocol handler
    # We just need to respond to initialize and stay alive
    try:
        while not _shutdown_event.is_set():
            try:
                line = sys.stdin.readline()
                if not line:
                    # EOF - parent closed stdin, exit gracefully
                    print("MCP stdin closed, initiating shutdown...", file=sys.stderr)
                    break

                line = line.strip()
                if not line:
                    continue

                try:
                    request = json.loads(line)
                except json.JSONDecodeError:
                    continue

                request_id = request.get('id')
                method = request.get('method', '')

                response = None

                if method == 'initialize':
                    response = {
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "result": {
                            "protocolVersion": "2024-11-05",
                            "capabilities": {
                                "tools": {}
                            },
                            "serverInfo": server_info
                        }
                    }
                elif method == 'notifications/initialized':
                    # No response needed for notifications
                    continue
                elif method == 'tools/list':
                    response = {
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "result": {
                            "tools": [
                                {
                                    "name": "dashboard_status",
                                    "description": f"Get dashboard status. Web UI at http://127.0.0.1:{port}",
                                    "inputSchema": {
                                        "type": "object",
                                        "properties": {}
                                    }
                                }
                            ]
                        }
                    }
                elif method == 'tools/call':
                    tool_name = request.get('params', {}).get('name', '')
                    if tool_name == 'dashboard_status':
                        response = {
                            "jsonrpc": "2.0",
                            "id": request_id,
                            "result": {
                                "content": [
                                    {
                                        "type": "text",
                                        "text": f"Dashboard running at http://127.0.0.1:{port}"
                                    }
                                ]
                            }
                        }
                    else:
                        response = {
                            "jsonrpc": "2.0",
                            "id": request_id,
                            "error": {
                                "code": -32601,
                                "message": f"Unknown tool: {tool_name}"
                            }
                        }
                elif request_id is not None:
                    # Unknown method with ID - send error
                    response = {
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "error": {
                            "code": -32601,
                            "message": f"Method not found: {method}"
                        }
                    }

                if response:
                    print(json.dumps(response), flush=True)

            except KeyboardInterrupt:
                print("Keyboard interrupt received", file=sys.stderr)
                break
            except Exception as e:
                print(f"MCP error: {e}", file=sys.stderr)
                continue

    finally:
        # Cleanup: signal shutdown and stop the web server
        print("MCP loop ended, shutting down web server...", file=sys.stderr)
        _shutdown_event.set()
        server.shutdown()

        # Wait for web thread to finish (with timeout)
        web_thread.join(timeout=5.0)
        if web_thread.is_alive():
            print("Warning: Web server thread did not stop cleanly", file=sys.stderr)


def run_mcp_proxy_mode(port: int):
    """Run as an MCP server that proxies to an existing dashboard.

    This mode doesn't start a new web server - it just responds to MCP
    commands and points to the already-running dashboard.
    """
    # MCP server info
    server_info = {
        "name": "dashboard",
        "version": get_plugin_version(),
        "description": f"Claude Marketplace Dashboard - Web UI running at http://127.0.0.1:{port} (existing instance)"
    }

    try:
        while not _shutdown_event.is_set():
            try:
                line = sys.stdin.readline()
                if not line:
                    # EOF - parent closed stdin, exit gracefully
                    print("MCP stdin closed, exiting proxy mode...", file=sys.stderr)
                    break

                line = line.strip()
                if not line:
                    continue

                try:
                    request = json.loads(line)
                except json.JSONDecodeError:
                    continue

                request_id = request.get('id')
                method = request.get('method', '')

                response = None

                if method == 'initialize':
                    response = {
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "result": {
                            "protocolVersion": "2024-11-05",
                            "capabilities": {
                                "tools": {}
                            },
                            "serverInfo": server_info
                        }
                    }
                elif method == 'notifications/initialized':
                    # No response needed for notifications
                    continue
                elif method == 'tools/list':
                    response = {
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "result": {
                            "tools": [
                                {
                                    "name": "dashboard_status",
                                    "description": f"Get dashboard status. Web UI at http://127.0.0.1:{port}",
                                    "inputSchema": {
                                        "type": "object",
                                        "properties": {}
                                    }
                                }
                            ]
                        }
                    }
                elif method == 'tools/call':
                    tool_name = request.get('params', {}).get('name', '')
                    if tool_name == 'dashboard_status':
                        # Check if dashboard is still healthy
                        status = "running" if is_dashboard_running(port) else "not responding"
                        response = {
                            "jsonrpc": "2.0",
                            "id": request_id,
                            "result": {
                                "content": [
                                    {
                                        "type": "text",
                                        "text": f"Dashboard {status} at http://127.0.0.1:{port}"
                                    }
                                ]
                            }
                        }
                    else:
                        response = {
                            "jsonrpc": "2.0",
                            "id": request_id,
                            "error": {
                                "code": -32601,
                                "message": f"Unknown tool: {tool_name}"
                            }
                        }
                elif request_id is not None:
                    # Unknown method with ID - send error
                    response = {
                        "jsonrpc": "2.0",
                        "id": request_id,
                        "error": {
                            "code": -32601,
                            "message": f"Method not found: {method}"
                        }
                    }

                if response:
                    print(json.dumps(response), flush=True)

            except KeyboardInterrupt:
                print("Keyboard interrupt received", file=sys.stderr)
                break
            except Exception as e:
                print(f"MCP proxy error: {e}", file=sys.stderr)
                continue

    finally:
        print("MCP proxy mode ended", file=sys.stderr)


def _signal_handler(signum, frame):
    """Handle termination signals gracefully."""
    sig_name = signal.Signals(signum).name if hasattr(signal, 'Signals') else str(signum)
    print(f"Received signal {sig_name}, shutting down...", file=sys.stderr)
    _shutdown_event.set()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Claude Marketplace Dashboard')
    parser.add_argument(
        '--port',
        type=int,
        default=int(os.environ.get('DASHBOARD_PORT', 24282)),
        help='Port to listen on (default: 24282)'
    )
    parser.add_argument(
        '--host',
        default='127.0.0.1',
        help='Host to bind to (default: 127.0.0.1)'
    )
    parser.add_argument(
        '--open-browser',
        action='store_true',
        help='Open browser on startup'
    )
    parser.add_argument(
        '--standalone',
        action='store_true',
        help='Run in standalone mode (no MCP, just web server)'
    )
    parser.add_argument(
        '--remote',
        action='store_true',
        help='Allow remote connections'
    )
    parser.add_argument(
        '--no-cleanup',
        action='store_true',
        help='Skip cleanup of orphaned processes on startup'
    )

    args = parser.parse_args()

    host = '0.0.0.0' if args.remote else args.host
    port = args.port

    # Register signal handlers
    signal.signal(signal.SIGTERM, _signal_handler)
    signal.signal(signal.SIGINT, _signal_handler)

    # Check if dashboard is already running and healthy
    if is_dashboard_running(port):
        url = f"http://127.0.0.1:{port}"
        print(f"Dashboard is already running at {url}", file=sys.stderr)
        if args.open_browser:
            print(f"Opening browser to existing dashboard", file=sys.stderr)
            webbrowser.open(url)
        if args.standalone:
            # In standalone mode, just exit after opening browser
            print("Existing dashboard instance is healthy. Exiting.", file=sys.stderr)
            return
        else:
            # In MCP mode, run as a thin proxy that just reports the existing dashboard
            print("Running in MCP proxy mode for existing dashboard", file=sys.stderr)
            run_mcp_proxy_mode(port)
            return

    # Cleanup any orphaned processes from previous runs
    # (only if no healthy dashboard is running)
    if not args.no_cleanup:
        if not cleanup_orphaned_process(port):
            print(f"Warning: Could not clean up existing process on port {port}", file=sys.stderr)
            print("You may need to manually kill the process or use a different port", file=sys.stderr)
            # Continue anyway - the server will fail to bind if port is in use

    # Write PID file
    write_pid_file(port)

    # Register cleanup to remove PID file on exit
    atexit.register(remove_pid_file, port)

    try:
        if args.standalone:
            # Run web server directly (blocking)
            print("Running in standalone mode", file=sys.stderr)
            run_web_server(port, host, args.open_browser, standalone=True)
        else:
            # Run as MCP server with web dashboard in background
            run_mcp_mode(port, host, args.open_browser)
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        raise
    finally:
        print("Dashboard shutdown complete", file=sys.stderr)


if __name__ == '__main__':
    main()
