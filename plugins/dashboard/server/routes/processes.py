"""Process management routes for the dashboard server."""

import os
import signal
import subprocess
from datetime import datetime
from flask import Blueprint, jsonify

processes_bp = Blueprint('processes', __name__)


def get_dashboard_processes() -> list[dict]:
    """Get list of running dashboard server processes.

    Returns:
        List of process info dictionaries with:
        - pid: Process ID
        - ppid: Parent process ID
        - started: Start time string
        - command: Command line
        - current: Whether this is the current process
    """
    current_pid = os.getpid()
    processes = []

    try:
        # Use ps to find Python processes, then filter for dashboard patterns
        result = subprocess.run(
            ['ps', '-eo', 'pid,ppid,lstart,command'],
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode != 0:
            return []

        lines = result.stdout.strip().split('\n')
        if len(lines) < 2:
            return []

        # Skip header line
        for line in lines[1:]:
            # Parse the line - lstart has fixed format with spaces
            # Format: "  PID  PPID                          STARTED COMMAND"
            # STARTED is like "Wed Jan 29 14:30:52 2025"
            parts = line.split()
            if len(parts) < 7:  # Need at least pid, ppid, 5 lstart parts, command
                continue

            try:
                pid = int(parts[0])
                ppid = int(parts[1])
            except ValueError:
                continue

            # lstart is 5 parts: Day Mon DD HH:MM:SS YYYY
            # Command starts after that
            started = ' '.join(parts[2:7])
            command = ' '.join(parts[7:])

            # Filter for dashboard-related Python processes
            is_dashboard = (
                'python' in command.lower() and
                ('dashboard' in command.lower() or
                 'server.app' in command or
                 'server/app.py' in command or
                 'run_dashboard' in command)
            )

            if is_dashboard:
                processes.append({
                    'pid': pid,
                    'ppid': ppid,
                    'started': started,
                    'command': command[:100] + ('...' if len(command) > 100 else ''),
                    'current': pid == current_pid
                })

    except subprocess.TimeoutExpired:
        return []
    except Exception:
        return []

    # Sort by PID (oldest first typically)
    processes.sort(key=lambda p: p['pid'])

    return processes


@processes_bp.route('/api/processes', methods=['GET'])
def list_processes():
    """List all running dashboard server processes."""
    processes = get_dashboard_processes()
    current_pid = os.getpid()

    return jsonify({
        'processes': processes,
        'current_pid': current_pid,
        'count': len(processes)
    })


@processes_bp.route('/api/processes/<int:pid>/kill', methods=['POST'])
def kill_process(pid: int):
    """Kill a specific dashboard server process.

    Args:
        pid: Process ID to kill

    Returns:
        JSON response with status or error
    """
    current_pid = os.getpid()
    processes = get_dashboard_processes()

    # Find the target process
    target = next((p for p in processes if p['pid'] == pid), None)

    if not target:
        return jsonify({
            'error': 'Process not found or not a dashboard process',
            'pid': pid
        }), 404

    # Safety check: don't kill the only running process
    if len(processes) == 1 and pid == current_pid:
        return jsonify({
            'error': 'Cannot kill the only running dashboard process',
            'pid': pid
        }), 400

    try:
        is_current = pid == current_pid

        # Send SIGTERM for graceful shutdown
        os.kill(pid, signal.SIGTERM)

        # Wait briefly for process to terminate
        import time
        for _ in range(5):  # Wait up to 0.5 seconds
            time.sleep(0.1)
            try:
                os.kill(pid, 0)  # Check if process exists
            except ProcessLookupError:
                # Process terminated successfully with SIGTERM
                return jsonify({
                    'status': 'killed',
                    'pid': pid,
                    'signal': 'SIGTERM',
                    'was_current': is_current
                })

        # Process didn't respond to SIGTERM, use SIGKILL
        os.kill(pid, signal.SIGKILL)

        return jsonify({
            'status': 'killed',
            'pid': pid,
            'signal': 'SIGKILL',
            'was_current': is_current
        })

    except ProcessLookupError:
        return jsonify({
            'error': 'Process no longer exists',
            'pid': pid
        }), 404

    except PermissionError:
        return jsonify({
            'error': 'Permission denied to kill process',
            'pid': pid
        }), 403

    except Exception as e:
        return jsonify({
            'error': f'Failed to kill process: {str(e)}',
            'pid': pid
        }), 500
