#!/usr/bin/env python3
"""Launcher script for the dashboard server.

This script can run in two modes:
1. MCP mode (default): Runs as an MCP server, launching the web dashboard in a background thread
2. Standalone mode (--standalone): Runs the web server directly in the foreground
"""

import argparse
import json
import os
import sys
import threading
import webbrowser

# Add the dashboard plugin directory to Python path
plugin_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, plugin_root)


def run_web_server(port: int, host: str, open_browser: bool):
    """Run the Flask web server in a thread."""
    from server.app import create_app

    app = create_app(local_only=(host == '127.0.0.1'))

    if open_browser:
        url = f"http://127.0.0.1:{port}"
        print(f"Opening browser to {url}", file=sys.stderr)
        webbrowser.open(url)

    print(f"Starting dashboard server on {host}:{port}", file=sys.stderr)

    # Run Flask with threading but without reloader (which causes issues in threads)
    app.run(
        host=host,
        port=port,
        debug=False,
        threaded=True,
        use_reloader=False
    )


def run_mcp_mode(port: int, host: str, open_browser: bool):
    """Run as an MCP server with web dashboard in background."""

    # Start web server in background thread
    web_thread = threading.Thread(
        target=run_web_server,
        args=(port, host, open_browser),
        daemon=True
    )
    web_thread.start()

    # MCP server info
    server_info = {
        "name": "dashboard",
        "version": "1.1.0",
        "description": "Claude Marketplace Dashboard - Web UI running at http://127.0.0.1:{port}"
    }

    # Simple MCP protocol handler
    # We just need to respond to initialize and stay alive
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                # EOF - parent closed stdin, exit gracefully
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
            break
        except Exception as e:
            print(f"MCP error: {e}", file=sys.stderr)
            continue


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

    args = parser.parse_args()

    host = '0.0.0.0' if args.remote else args.host

    if args.standalone:
        # Run web server directly (blocking)
        run_web_server(args.port, host, args.open_browser)
    else:
        # Run as MCP server with web dashboard in background
        run_mcp_mode(args.port, host, args.open_browser)


if __name__ == '__main__':
    main()
