#!/usr/bin/env python3
"""Dashboard server main application."""

import argparse
import atexit
import os
import signal
import sys
import threading
import time
import webbrowser
from pathlib import Path

from flask import Flask, send_from_directory, Response, jsonify


# Global flag for shutdown
_shutdown_event = threading.Event()

from .auth import AuthManager
from .sse import SSEManager
from .services.agent_registry import AgentRegistry
from .services.skill_registry import SkillRegistry
from .services.session_tracker import SessionTracker
from .services.event_store import EventStore
from .services.file_watcher import FileWatcher
from .routes import agents_bp, skills_bp, sessions_bp, events_bp, stream_bp, capabilities_bp
from .services.transcript_reader import TranscriptReader
from .services.transcript_watcher import TranscriptWatcher


def start_session_scanner(session_tracker, sse_manager, interval: float = 3.0):
    """Background thread that scans for new sessions and broadcasts via SSE.

    Args:
        session_tracker: SessionTracker instance to scan.
        sse_manager: SSEManager instance for broadcasting.
        interval: Scan interval in seconds (default 3.0).

    Returns:
        The started background thread.
    """
    last_session_ids = set(s.id for s in session_tracker.get_all_sessions())

    def scan_loop():
        nonlocal last_session_ids
        while not _shutdown_event.is_set():
            time.sleep(interval)
            if _shutdown_event.is_set():
                break

            session_tracker.scan()
            current_sessions = session_tracker.get_all_sessions()
            current_ids = set(s.id for s in current_sessions)

            # Detect new sessions
            new_ids = current_ids - last_session_ids
            if new_ids:
                for session_id in new_ids:
                    session = next((s for s in current_sessions if s.id == session_id), None)
                    if session:
                        sse_manager.broadcast({
                            'session_id': session.id,
                            'started_at': session.started_at.isoformat(),
                            'phase': session.phase,
                            'domains_involved': session.domains_involved
                        }, event_type='session_created')

                last_session_ids = current_ids

    thread = threading.Thread(target=scan_loop, daemon=True)
    thread.start()
    return thread


def get_project_paths() -> list[str]:
    """Discover project directories that have .claude/handoffs/.

    Scans for projects in:
    1. Current working directory
    2. Parent directories (up to 3 levels)
    3. Common project locations (~/GitHub, ~/Projects, ~/code)

    Returns:
        List of project paths that have .claude/handoffs/ directories.
    """
    paths = []
    checked = set()

    def check_and_add(path: str) -> None:
        """Check if path has .claude/handoffs/ and add if so."""
        if path in checked:
            return
        checked.add(path)
        handoffs_dir = os.path.join(path, '.claude', 'handoffs')
        if os.path.isdir(handoffs_dir):
            paths.append(path)

    # 1. Current working directory
    cwd = os.getcwd()
    check_and_add(cwd)

    # 2. Scan subdirectories of cwd (1 level)
    if os.path.isdir(cwd):
        for entry in os.listdir(cwd):
            subdir = os.path.join(cwd, entry)
            if os.path.isdir(subdir):
                check_and_add(subdir)

    # 3. Common project locations
    home = os.path.expanduser('~')
    common_dirs = ['GitHub', 'Projects', 'code', 'repos', 'workspace']
    for dirname in common_dirs:
        project_root = os.path.join(home, dirname)
        if os.path.isdir(project_root):
            for entry in os.listdir(project_root):
                project_path = os.path.join(project_root, entry)
                if os.path.isdir(project_path):
                    check_and_add(project_path)

    return paths


def get_plugin_paths() -> list[str]:
    """Discover plugin directories from all Claude Code scopes.

    Scans for plugins in:
    1. User scope: ~/.claude/plugins/cache/
    2. Project scope: .claude/plugins/cache/ (relative to cwd)
    3. Environment override: MARKETPLACE_ROOT/plugins/
    4. Development fallback: relative to this file

    Returns:
        List of paths to scan for plugins.
    """
    paths = []

    # 1. User scope: ~/.claude/plugins/cache/
    user_cache = os.path.expanduser('~/.claude/plugins/cache')
    if os.path.isdir(user_cache):
        paths.append(user_cache)

    # 2. Project scope: .claude/plugins/cache/ (relative to cwd)
    project_cache = os.path.join(os.getcwd(), '.claude/plugins/cache')
    if os.path.isdir(project_cache) and project_cache not in paths:
        paths.append(project_cache)

    # 3. Environment override (for development/testing)
    env_root = os.environ.get('MARKETPLACE_ROOT')
    if env_root:
        plugins_dir = os.path.join(env_root, 'plugins')
        if os.path.isdir(plugins_dir) and plugins_dir not in paths:
            paths.append(plugins_dir)

    # 4. Development fallback: relative to this file
    # Structure: dashboard/server/app.py -> marketplace/plugins/
    current_dir = Path(__file__).parent.parent
    dev_plugins = current_dir.parent.parent / 'plugins'
    if dev_plugins.is_dir() and str(dev_plugins) not in paths:
        paths.append(str(dev_plugins))

    return paths


def create_app(local_only: bool = True) -> Flask:
    """Create and configure the Flask application.

    Args:
        local_only: If True, bind to localhost only.

    Returns:
        Configured Flask application.
    """
    # Discover plugin paths from all scopes
    plugin_paths = get_plugin_paths()

    web_dir = os.path.join(os.path.dirname(__file__), '..', 'web')

    # Create Flask app
    app = Flask(__name__, static_folder=web_dir)

    # Discover project paths for sessions
    project_paths = get_project_paths()

    # Initialize services with multiple plugin paths
    agent_registry = AgentRegistry(plugin_paths)
    skill_registry = SkillRegistry(plugin_paths)
    event_store = EventStore()
    session_tracker = SessionTracker(project_paths, event_store=event_store)
    sse_manager = SSEManager()
    transcript_reader = TranscriptReader()

    # Initialize transcript watcher with SSE broadcast callback
    def transcript_broadcast(data: dict, event_type: str):
        sse_manager.broadcast(data, event_type=event_type)

    transcript_watcher = TranscriptWatcher(
        transcript_reader,
        broadcast_callback=transcript_broadcast,
        poll_interval=1.0
    )
    transcript_watcher.start()

    # Determine a root for auth token (use first available path or home)
    auth_root = plugin_paths[0] if plugin_paths else os.path.expanduser('~/.claude')
    auth_manager = AuthManager(
        token_file=os.path.join(auth_root, '.dashboard-token')
    )

    # Scan plugins
    print(f"Scanning plugin paths: {plugin_paths}")
    agent_registry.scan()
    skill_registry.scan()

    print(f"Found {len(agent_registry.get_all())} agents across {len(agent_registry.get_all_domains())} domains")
    print(f"Found {len(skill_registry.get_all())} skills")

    # Scan sessions
    print(f"Scanning project paths for sessions: {project_paths}")
    session_tracker.scan()
    print(f"Found {len(session_tracker.get_all_sessions())} sessions")

    # Start background session scanner for real-time discovery
    scanner_thread = start_session_scanner(session_tracker, sse_manager, interval=3.0)
    print("Started session scanner (3s interval)")

    # Initialize auth
    auth_manager.initialize(local_only=local_only)

    # Set up SSE event listener
    event_listener = sse_manager.create_event_listener(event_store)
    event_store.add_listener(event_listener)

    # Store services in app config
    app.config['agent_registry'] = agent_registry
    app.config['skill_registry'] = skill_registry
    app.config['session_tracker'] = session_tracker
    app.config['event_store'] = event_store
    app.config['sse_manager'] = sse_manager
    app.config['auth_manager'] = auth_manager
    app.config['transcript_reader'] = transcript_reader
    app.config['transcript_watcher'] = transcript_watcher
    app.config['plugin_paths'] = plugin_paths
    app.config['project_paths'] = project_paths

    # Register blueprints
    app.register_blueprint(agents_bp)
    app.register_blueprint(skills_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(stream_bp)
    app.register_blueprint(capabilities_bp)

    # Static file routes
    @app.route('/')
    def serve_index():
        return send_from_directory(web_dir, 'index.html')

    @app.route('/<path:path>')
    def serve_static(path):
        return send_from_directory(web_dir, path)

    # SSE stream with manager
    @app.route('/api/stream')
    def event_stream():
        client_queue = sse_manager.register_client()

        def generate():
            try:
                for message in sse_manager.generate_stream(client_queue):
                    yield message
            finally:
                sse_manager.unregister_client(client_queue)

        return Response(
            generate(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )

    # Auth token endpoint (local only)
    @app.route('/api/auth/token')
    def get_auth_token():
        if not local_only:
            return {'error': 'Token only available locally'}, 403
        return {'token': auth_manager.get_token()}

    # Rescan endpoint
    @app.route('/api/rescan', methods=['POST'])
    def rescan_plugins():
        agent_registry.scan()
        skill_registry.scan()
        session_tracker.scan()
        return {
            'status': 'ok',
            'agents': len(agent_registry.get_all()),
            'skills': len(skill_registry.get_all()),
            'domains': len(agent_registry.get_all_domains()),
            'sessions': len(session_tracker.get_all_sessions())
        }

    # Transcript watch endpoints for real-time updates
    @app.route('/api/sessions/<session_id>/watch', methods=['POST'])
    def watch_session_transcript(session_id):
        """Start watching a session's transcript for real-time updates."""
        session = session_tracker.get_session(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        project_path = session.project_path
        if not project_path:
            return jsonify({'error': 'No project path for session'}), 400

        # Get Claude session ID
        claude_session_id = getattr(session, 'claude_session_id', None)
        if not claude_session_id:
            # Try to find by timestamp
            transcript_path = transcript_reader.find_transcript_by_timestamp(
                project_path,
                session.started_at,
                tolerance_seconds=600
            )
            if transcript_path:
                import os
                filename = os.path.basename(transcript_path)
                claude_session_id = filename[:-6] if filename.endswith('.jsonl') else filename

        if not claude_session_id:
            return jsonify({'error': 'Could not find transcript'}), 404

        success = transcript_watcher.watch_session(
            session_id, project_path, claude_session_id
        )

        if success:
            return jsonify({
                'status': 'watching',
                'session_id': session_id,
                'claude_session_id': claude_session_id
            })
        else:
            return jsonify({'error': 'Failed to start watching'}), 500

    @app.route('/api/sessions/<session_id>/unwatch', methods=['POST'])
    def unwatch_session_transcript(session_id):
        """Stop watching a session's transcript."""
        removed = transcript_watcher.unwatch_session(session_id)
        return jsonify({
            'status': 'unwatched' if removed else 'not_watching',
            'session_id': session_id
        })

    # Version endpoint - reads from plugin.json
    @app.route('/api/version')
    def get_version():
        """Return dashboard version from plugin.json."""
        import json
        plugin_json_path = os.path.join(
            os.path.dirname(__file__), '..', '.claude-plugin', 'plugin.json'
        )
        try:
            with open(plugin_json_path, 'r') as f:
                plugin_data = json.load(f)
            return {
                'name': plugin_data.get('name', 'dashboard'),
                'version': plugin_data.get('version', 'unknown'),
                'description': plugin_data.get('description', '')
            }
        except Exception as e:
            return {'name': 'dashboard', 'version': 'unknown', 'error': str(e)}

    # Plugin paths debugging endpoint
    @app.route('/api/plugin-paths')
    def get_discovered_paths():
        """Return information about discovered plugin paths for debugging."""
        paths = app.config.get('plugin_paths', [])
        existing = [p for p in paths if os.path.isdir(p)]

        # Get plugins found in each path
        plugins_found = {}
        for p in existing:
            try:
                # Check if it's a cache directory
                if 'cache' in p:
                    # List sources and their plugins
                    sources = {}
                    for source in os.listdir(p):
                        source_path = os.path.join(p, source)
                        if os.path.isdir(source_path):
                            sources[source] = os.listdir(source_path)
                    plugins_found[p] = sources
                else:
                    # List plugin directories directly
                    plugins_found[p] = [
                        d for d in os.listdir(p)
                        if os.path.isdir(os.path.join(p, d))
                    ]
            except Exception as e:
                plugins_found[p] = f"Error: {str(e)}"

        return jsonify({
            'paths': paths,
            'existing': existing,
            'plugins_found': plugins_found
        })

    # Project paths debugging endpoint
    @app.route('/api/project-paths')
    def get_discovered_projects():
        """Return information about discovered project paths for debugging."""
        paths = app.config.get('project_paths', [])
        sessions_by_project = {}
        for p in paths:
            handoffs_dir = os.path.join(p, '.claude', 'handoffs')
            if os.path.isdir(handoffs_dir):
                try:
                    sessions_by_project[p] = os.listdir(handoffs_dir)
                except Exception as e:
                    sessions_by_project[p] = f"Error: {str(e)}"

        return jsonify({
            'project_paths': paths,
            'sessions_by_project': sessions_by_project,
            'total_sessions': len(session_tracker.get_all_sessions())
        })

    # Server control endpoints
    @app.route('/api/server/kill', methods=['POST'])
    def kill_server():
        """Kill the server process."""
        if not local_only:
            return {'error': 'Server control only available locally'}, 403

        def shutdown():
            time.sleep(0.5)  # Give response time to send
            _shutdown_event.set()
            os.kill(os.getpid(), signal.SIGTERM)

        threading.Thread(target=shutdown, daemon=True).start()
        return {'status': 'shutting_down'}

    @app.route('/api/server/restart', methods=['POST'])
    def restart_server():
        """Restart the server process."""
        if not local_only:
            return {'error': 'Server control only available locally'}, 403

        def restart():
            time.sleep(0.5)  # Give response time to send
            _shutdown_event.set()
            # Re-exec the current process
            os.execv(sys.executable, [sys.executable] + sys.argv)

        threading.Thread(target=restart, daemon=True).start()
        return {'status': 'restarting'}

    return app


def _monitor_parent_process():
    """Monitor parent process and trigger shutdown when it exits.

    Only checks if the process is orphaned (parent PID becomes 1 on Linux
    or changes to launchd on macOS). This is a conservative check that
    only triggers when the parent truly exits.
    """
    import time

    parent_pid = os.getppid()
    print(f"Monitoring parent process (PID: {parent_pid})")

    while not _shutdown_event.is_set():
        # Check if parent process changed (adopted by init/launchd)
        # On macOS, launchd is PID 1. On Linux, init/systemd is PID 1.
        current_parent = os.getppid()
        if current_parent == 1:
            # Process was orphaned - parent exited
            print(f"Parent process exited (was PID {parent_pid}), shutting down...")
            _shutdown_event.set()
            os.kill(os.getpid(), signal.SIGTERM)
            break

        # Sleep longer to reduce CPU usage
        time.sleep(5)


def _cleanup():
    """Cleanup function called on exit."""
    print("Dashboard server shutting down...")
    _shutdown_event.set()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Claude Marketplace Dashboard Server')
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
        '--remote',
        action='store_true',
        help='Allow remote connections (requires auth token)'
    )
    parser.add_argument(
        '--no-parent-monitor',
        action='store_true',
        help='Disable parent process monitoring (for standalone use)'
    )

    args = parser.parse_args()

    # Register cleanup handlers
    atexit.register(_cleanup)
    signal.signal(signal.SIGTERM, lambda sig, frame: sys.exit(0))
    signal.signal(signal.SIGINT, lambda sig, frame: sys.exit(0))

    # Start parent process monitor (unless disabled or running interactively)
    if not args.no_parent_monitor and not sys.stdin.isatty():
        monitor_thread = threading.Thread(target=_monitor_parent_process, daemon=True)
        monitor_thread.start()
        print("Parent process monitor started")

    # Determine host
    host = '0.0.0.0' if args.remote else args.host
    local_only = not args.remote

    # Create app
    app = create_app(local_only=local_only)

    # Open browser if requested
    if args.open_browser:
        url = f"http://127.0.0.1:{args.port}"
        print(f"Opening browser to {url}")
        webbrowser.open(url)

    # Run server
    print(f"Starting dashboard server on {host}:{args.port}")
    if not local_only:
        print(f"Remote access enabled - use auth token from /api/auth/token")

    try:
        app.run(
            host=host,
            port=args.port,
            debug=False,
            threaded=True
        )
    except KeyboardInterrupt:
        pass
    finally:
        _cleanup()


if __name__ == '__main__':
    main()
