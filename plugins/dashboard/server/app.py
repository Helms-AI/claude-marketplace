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
from .services.changeset_tracker import ChangesetTracker
from .services.event_store import EventStore
from .services.file_watcher import FileWatcher
from .services.changeset_watcher import ChangesetWatcher, ChangesetFileEvent
from .routes import agents_bp, skills_bp, changesets_bp, events_bp, stream_bp, capabilities_bp
from .services.transcript_reader import TranscriptReader
from .services.transcript_watcher import TranscriptWatcher


def get_changeset_snapshot(changeset) -> dict:
    """Extract comparable fields from a changeset for change detection.

    Args:
        changeset: ChangesetInfo object.

    Returns:
        Dictionary of snapshot fields for comparison.
    """
    return {
        'id': changeset.changeset_id,
        'phase': changeset.phase,
        'event_count': len(changeset.events),
        'handoff_count': changeset.handoff_count or len(changeset.handoffs),
        'domains_involved': tuple(sorted(changeset.domains_involved or [])),
        'current_domain': changeset.current_domain,
        'current_agent': changeset.current_agent,
        'artifacts': tuple(sorted(changeset.artifacts or []))
    }


def diff_changesets(old_snapshot: dict, new_snapshot: dict) -> dict:
    """Compare two changeset snapshots and return changed fields.

    Args:
        old_snapshot: Previous changeset state.
        new_snapshot: Current changeset state.

    Returns:
        Dictionary of fields that changed with their new values.
    """
    changes = {}
    for key in new_snapshot:
        if key == 'id':
            continue
        if old_snapshot.get(key) != new_snapshot.get(key):
            # Convert tuples back to lists for JSON serialization
            value = new_snapshot[key]
            if isinstance(value, tuple):
                value = list(value)
            changes[key] = value
    return changes


def start_changeset_scanner(changeset_tracker, sse_manager, changeset_watcher=None, interval: float = 3.0):
    """Background thread that scans for new changesets and broadcasts via SSE.

    Args:
        changeset_tracker: ChangesetTracker instance to scan.
        sse_manager: SSEManager instance for broadcasting.
        changeset_watcher: Optional ChangesetWatcher to update with new project paths.
        interval: Scan interval in seconds (default 3.0).

    Returns:
        The started background thread.
    """
    # Build initial snapshots for all changesets
    initial_changesets = changeset_tracker.get_all_changesets()
    last_changeset_snapshots = {c.changeset_id: get_changeset_snapshot(c) for c in initial_changesets}

    def scan_loop():
        nonlocal last_changeset_snapshots
        while not _shutdown_event.is_set():
            time.sleep(interval)
            if _shutdown_event.is_set():
                break

            # Re-discover project paths (new projects may have been created)
            new_project_paths = get_project_paths()
            for path in new_project_paths:
                if path not in changeset_tracker.project_paths:
                    changeset_tracker.project_paths.append(path)
                    if changeset_watcher:
                        changeset_watcher.add_project_path(path)

            changeset_tracker.scan()
            current_changesets = changeset_tracker.get_all_changesets()
            current_snapshots = {c.changeset_id: get_changeset_snapshot(c) for c in current_changesets}

            # Detect new changesets
            new_ids = set(current_snapshots.keys()) - set(last_changeset_snapshots.keys())
            for changeset_id in new_ids:
                changeset = next((c for c in current_changesets if c.changeset_id == changeset_id), None)
                if changeset:
                    sse_manager.broadcast({
                        'changeset_id': changeset.changeset_id,
                        'started_at': changeset.started_at.isoformat(),
                        'phase': changeset.phase,
                        'domains_involved': changeset.domains_involved
                    }, event_type='changeset_created')

            # Detect updated changesets (existing changesets with changed content)
            existing_ids = set(current_snapshots.keys()) & set(last_changeset_snapshots.keys())
            for changeset_id in existing_ids:
                old_snap = last_changeset_snapshots[changeset_id]
                new_snap = current_snapshots[changeset_id]
                changes = diff_changesets(old_snap, new_snap)

                if changes:
                    changeset = next((c for c in current_changesets if c.changeset_id == changeset_id), None)
                    if changeset:
                        # Build full changeset dict for reconciliation
                        full_changeset = changeset_tracker.to_dict(changeset)
                        sse_manager.broadcast({
                            'changeset_id': changeset_id,
                            'changes': changes,
                            'full_changeset': full_changeset
                        }, event_type='changeset_updated')

            # Update snapshots for next iteration
            last_changeset_snapshots = current_snapshots

    thread = threading.Thread(target=scan_loop, daemon=True)
    thread.start()
    return thread


def get_project_paths() -> list[str]:
    """Discover project directories that have .claude/changesets/.

    Scans for projects in:
    1. Current working directory
    2. Parent directories (up to 3 levels)
    3. Common project locations (~/GitHub, ~/Projects, ~/code)

    Returns:
        List of project paths that have .claude/changesets/ directories.
    """
    paths = []
    checked = set()

    def check_and_add(path: str) -> None:
        """Check if path has .claude/changesets/ and add if so."""
        if path in checked:
            return
        checked.add(path)
        changesets_dir = os.path.join(path, '.claude', 'changesets')
        if os.path.isdir(changesets_dir):
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

    # Discover project paths for changesets
    # By default, only show changesets from the current working directory
    # This scopes the dashboard to the current Claude Code terminal session
    cwd = os.getcwd()
    cwd_changesets = os.path.join(cwd, '.claude', 'changesets')

    if os.path.isdir(cwd_changesets):
        # Primary: current working directory has changesets
        project_paths = [cwd]
    else:
        # Fallback: discover from common locations
        project_paths = get_project_paths()

    # Check for debug mode from environment
    debug_mode = os.environ.get('DASHBOARD_DEBUG', '').lower() in ('1', 'true', 'yes')

    # Initialize services with multiple plugin paths
    agent_registry = AgentRegistry(plugin_paths)
    skill_registry = SkillRegistry(plugin_paths)
    event_store = EventStore()
    changeset_tracker = ChangesetTracker(project_paths, event_store=event_store)
    sse_manager = SSEManager(debug=debug_mode)
    transcript_reader = TranscriptReader()

    # Initialize transcript watcher with SSE broadcast callback
    def transcript_broadcast(data: dict, event_type: str):
        sent = sse_manager.broadcast(data, event_type=event_type)
        if debug_mode:
            print(f"[Dashboard] Broadcast {event_type} to {sent} clients", flush=True)

    transcript_watcher = TranscriptWatcher(
        transcript_reader,
        broadcast_callback=transcript_broadcast,
        poll_interval=0.5,
        debug=debug_mode
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

    # Scan changesets
    print(f"Scanning project paths for changesets: {project_paths}")
    changeset_tracker.scan()
    print(f"Found {len(changeset_tracker.get_all_changesets())} changesets")

    # Start instant changeset watcher for real-time detection (create before scanner)
    def on_changeset_file_event(event: ChangesetFileEvent):
        """Handle changeset file events for instant SSE broadcast."""
        if debug_mode:
            print(f"[ChangesetWatcher] {event.event_type}: {event.changeset_id}", flush=True)

        if event.event_type == 'created':
            # Rescan to pick up the new changeset
            changeset_tracker.scan()
            changeset = changeset_tracker.get_changeset(event.changeset_id)
            if changeset:
                sse_manager.broadcast({
                    'changeset_id': changeset.changeset_id,
                    'started_at': changeset.started_at.isoformat(),
                    'phase': changeset.phase,
                    'domains_involved': changeset.domains_involved,
                    'full_changeset': changeset_tracker.to_dict(changeset)
                }, event_type='changeset_created')

        elif event.event_type == 'modified':
            # Rescan and get updated changeset
            changeset_tracker.scan()
            changeset = changeset_tracker.get_changeset(event.changeset_id)
            if changeset:
                full_changeset = changeset_tracker.to_dict(changeset)
                sse_manager.broadcast({
                    'changeset_id': event.changeset_id,
                    'changes': {'modified': True},
                    'full_changeset': full_changeset
                }, event_type='changeset_updated')

        elif event.event_type == 'deleted':
            # Remove from tracker
            with changeset_tracker.lock:
                if event.changeset_id in changeset_tracker.changesets:
                    del changeset_tracker.changesets[event.changeset_id]
            sse_manager.broadcast({
                'changeset_id': event.changeset_id
            }, event_type='changeset_deleted')

    changeset_watcher = ChangesetWatcher(
        project_paths=project_paths,
        on_changeset_event=on_changeset_file_event,
        poll_interval=0.5  # Fast polling for near-instant detection
    )
    changeset_watcher.start()
    print(f"Started instant changeset watcher (0.5s polling) for {project_paths}")

    # Start background changeset scanner for periodic reconciliation (fallback)
    # This also re-discovers new project paths that may have been created
    scanner_thread = start_changeset_scanner(
        changeset_tracker, sse_manager, changeset_watcher=changeset_watcher, interval=5.0
    )
    print("Started changeset scanner (5s interval for reconciliation)")

    # Initialize auth
    auth_manager.initialize(local_only=local_only)

    # Set up SSE event listener
    event_listener = sse_manager.create_event_listener(event_store)
    event_store.add_listener(event_listener)

    # Store services in app config
    app.config['agent_registry'] = agent_registry
    app.config['skill_registry'] = skill_registry
    app.config['changeset_tracker'] = changeset_tracker
    app.config['event_store'] = event_store
    app.config['sse_manager'] = sse_manager
    app.config['auth_manager'] = auth_manager
    app.config['changeset_watcher'] = changeset_watcher
    app.config['transcript_reader'] = transcript_reader
    app.config['transcript_watcher'] = transcript_watcher
    app.config['plugin_paths'] = plugin_paths
    app.config['project_paths'] = project_paths

    # Register blueprints
    app.register_blueprint(agents_bp)
    app.register_blueprint(skills_bp)
    app.register_blueprint(changesets_bp)
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

        response = Response(
            generate(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
                'Access-Control-Allow-Origin': '*'
            }
        )
        # Disable response buffering for streaming
        response.implicit_sequence_conversion = False
        return response

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
        changeset_tracker.scan()
        return {
            'status': 'ok',
            'agents': len(agent_registry.get_all()),
            'skills': len(skill_registry.get_all()),
            'domains': len(agent_registry.get_all_domains()),
            'changesets': len(changeset_tracker.get_all_changesets())
        }

    # Transcript watch endpoints for real-time updates
    @app.route('/api/changesets/<changeset_id>/watch', methods=['POST'])
    def watch_changeset_transcript(changeset_id):
        """Start watching a changeset's transcript for real-time updates."""
        changeset = changeset_tracker.get_changeset(changeset_id)
        if not changeset:
            if debug_mode:
                print(f"[Watch] Changeset not found: {changeset_id}", flush=True)
            return jsonify({'error': 'Changeset not found'}), 404

        project_path = changeset.project_path
        if not project_path:
            if debug_mode:
                print(f"[Watch] No project path for changeset: {changeset_id}", flush=True)
            return jsonify({'error': 'No project path for changeset'}), 400

        # Get Claude session ID (Claude Code's native session ID)
        session_id = getattr(changeset, 'session_id', None)
        if debug_mode:
            print(f"[Watch] Changeset {changeset_id}: session_id={session_id}", flush=True)

        if not session_id:
            # Try to find by timestamp
            transcript_path = transcript_reader.find_transcript_by_timestamp(
                project_path,
                changeset.started_at,
                tolerance_seconds=600
            )
            if transcript_path:
                import os
                filename = os.path.basename(transcript_path)
                session_id = filename[:-6] if filename.endswith('.jsonl') else filename
                if debug_mode:
                    print(f"[Watch] Found transcript by timestamp: {session_id}", flush=True)

        if not session_id:
            if debug_mode:
                print(f"[Watch] Could not find transcript for changeset: {changeset_id}", flush=True)
            return jsonify({'error': 'Could not find transcript'}), 404

        success = transcript_watcher.watch_changeset(
            changeset_id, project_path, session_id
        )

        if success:
            if debug_mode:
                print(f"[Watch] Now watching changeset {changeset_id} (transcript: {session_id})", flush=True)
            return jsonify({
                'status': 'watching',
                'changeset_id': changeset_id,
                'session_id': session_id,  # Claude Code's native session ID
                'sse_clients': sse_manager.get_client_count()
            })
        else:
            if debug_mode:
                print(f"[Watch] Failed to start watching changeset: {changeset_id}", flush=True)
            return jsonify({'error': 'Failed to start watching'}), 500

    @app.route('/api/changesets/<changeset_id>/unwatch', methods=['POST'])
    def unwatch_changeset_transcript(changeset_id):
        """Stop watching a changeset's transcript."""
        removed = transcript_watcher.unwatch_changeset(changeset_id)
        return jsonify({
            'status': 'unwatched' if removed else 'not_watching',
            'changeset_id': changeset_id
        })

    # Debug endpoint to check watcher and SSE status
    @app.route('/api/debug/sse-status')
    def sse_status():
        """Get SSE and transcript watcher status for debugging."""
        watched_changesets = transcript_watcher.get_watched_changesets()
        return jsonify({
            'sse_clients': sse_manager.get_client_count(),
            'watched_changesets': watched_changesets,
            'watched_count': len(watched_changesets),
            'watcher_running': transcript_watcher._running,
            'debug_mode': debug_mode
        })

    # Version endpoint - reads from plugin.json and checks for updates
    @app.route('/api/version')
    def get_version():
        """Return dashboard version and check for newer source version."""
        import json
        from pathlib import Path

        # Get running version (from where server is actually running)
        plugin_json_path = os.path.join(
            os.path.dirname(__file__), '..', '.claude-plugin', 'plugin.json'
        )
        running_version = 'unknown'
        running_path = os.path.dirname(os.path.dirname(__file__))

        try:
            with open(plugin_json_path, 'r') as f:
                plugin_data = json.load(f)
            running_version = plugin_data.get('version', 'unknown')
        except Exception:
            pass

        # Check if running from cache (contains /cache/ in path)
        is_cached = '/cache/' in running_path or '\\cache\\' in running_path

        # Try to find source version from marketplace
        source_version = None
        source_path = None

        # Look for marketplace source directories
        search_paths = [
            os.getcwd(),  # Current working directory
            os.path.expanduser('~/GitHub/claude-marketplace'),
            os.path.expanduser('~/Projects/claude-marketplace'),
            os.path.expanduser('~/code/claude-marketplace'),
        ]

        for base_path in search_paths:
            marketplace_json = os.path.join(base_path, '.claude-plugin', 'marketplace.json')
            if os.path.isfile(marketplace_json):
                try:
                    with open(marketplace_json, 'r') as f:
                        marketplace = json.load(f)
                    for plugin in marketplace.get('plugins', []):
                        if plugin.get('name') == 'dashboard':
                            source_version = plugin.get('version')
                            source_path = base_path
                            break
                    if source_version:
                        break
                except Exception:
                    pass

        # Determine if update is available
        update_available = False
        if source_version and running_version != 'unknown':
            try:
                from packaging.version import Version
                update_available = Version(source_version) > Version(running_version)
            except Exception:
                # Simple string comparison fallback
                update_available = source_version != running_version

        return {
            'name': 'dashboard',
            'version': running_version,
            'source_version': source_version,
            'update_available': update_available,
            'is_cached': is_cached,
            'running_path': running_path,
            'source_path': source_path
        }

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
        changesets_by_project = {}
        for p in paths:
            changesets_dir = os.path.join(p, '.claude', 'changesets')
            if os.path.isdir(changesets_dir):
                try:
                    changesets_by_project[p] = os.listdir(changesets_dir)
                except Exception as e:
                    changesets_by_project[p] = f"Error: {str(e)}"

        return jsonify({
            'project_paths': paths,
            'changesets_by_project': changesets_by_project,
            'total_changesets': len(changeset_tracker.get_all_changesets())
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

    @app.route('/api/server/update', methods=['POST'])
    def update_server():
        """Update and restart from source directory if newer version available."""
        import json
        import subprocess

        if not local_only:
            return {'error': 'Server control only available locally'}, 403

        # Find source directory
        search_paths = [
            os.getcwd(),
            os.path.expanduser('~/GitHub/claude-marketplace'),
            os.path.expanduser('~/Projects/claude-marketplace'),
            os.path.expanduser('~/code/claude-marketplace'),
        ]

        source_path = None
        source_version = None

        for base_path in search_paths:
            marketplace_json = os.path.join(base_path, '.claude-plugin', 'marketplace.json')
            if os.path.isfile(marketplace_json):
                try:
                    with open(marketplace_json, 'r') as f:
                        marketplace = json.load(f)
                    for plugin in marketplace.get('plugins', []):
                        if plugin.get('name') == 'dashboard':
                            source_version = plugin.get('version')
                            source_path = base_path
                            break
                    if source_version:
                        break
                except Exception:
                    pass

        if not source_path:
            return {'error': 'Could not find marketplace source directory'}, 404

        dashboard_source = os.path.join(source_path, 'plugins', 'dashboard')
        run_script = os.path.join(dashboard_source, 'run_dashboard.py')

        if not os.path.isfile(run_script):
            return {'error': f'run_dashboard.py not found at {run_script}'}, 404

        def restart_from_source():
            time.sleep(0.5)  # Give response time to send
            _shutdown_event.set()

            # Start new process from source directory
            env = os.environ.copy()
            env['PYTHONPATH'] = dashboard_source

            # Start new dashboard from source
            subprocess.Popen(
                [sys.executable, run_script, '--standalone', '--open-browser'],
                cwd=dashboard_source,
                env=env,
                start_new_session=True
            )

            # Kill current process
            os.kill(os.getpid(), signal.SIGTERM)

        threading.Thread(target=restart_from_source, daemon=True).start()
        return {
            'status': 'updating',
            'source_path': dashboard_source,
            'source_version': source_version
        }

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
