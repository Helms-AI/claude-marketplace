"""Command API routes for Passthrough Mode.

These routes allow the dashboard to submit commands to the queue,
check command status, and manage the passthrough state.
"""

from flask import Blueprint, request, jsonify, current_app


commands_bp = Blueprint('commands', __name__)


def get_command_service():
    """Get the CommandService instance from app config."""
    return current_app.config.get('command_service')


@commands_bp.route('/api/commands', methods=['POST'])
def submit_command():
    """Submit a new command to the queue.

    Request Body (JSON):
        {
            "prompt": "Create a button component",
            "metadata": {
                "context_id": "changeset:abc123",
                "source": "dashboard"
            }
        }

    Returns:
        JSON with command details including generated ID.
    """
    service = get_command_service()
    if not service:
        return jsonify({'error': 'Command service not initialized'}), 503

    data = request.get_json()
    if not data or not data.get('prompt'):
        return jsonify({'error': 'No prompt provided'}), 400

    prompt = data['prompt']
    metadata = data.get('metadata', {})

    # Add source if not provided
    if 'source' not in metadata:
        metadata['source'] = 'dashboard'

    try:
        command = service.submit_command(prompt, metadata)
        return jsonify({
            'success': True,
            'command': command
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@commands_bp.route('/api/commands/<command_id>', methods=['GET'])
def get_command_status(command_id):
    """Get the status of a specific command.

    Args:
        command_id: The command ID to look up.

    Returns:
        JSON with command details or 404 if not found.
    """
    service = get_command_service()
    if not service:
        return jsonify({'error': 'Command service not initialized'}), 503

    command = service.get_command(command_id)
    if command:
        return jsonify({'command': command})
    else:
        return jsonify({'error': 'Command not found'}), 404


@commands_bp.route('/api/commands', methods=['GET'])
def list_commands():
    """List commands with optional status filter.

    Query Parameters:
        status: Filter by status (pending, processing, completed, etc.)
        limit: Maximum number of commands to return (default 50)

    Returns:
        JSON list of commands.
    """
    service = get_command_service()
    if not service:
        return jsonify({'error': 'Command service not initialized'}), 503

    status = request.args.get('status')
    limit = request.args.get('limit', 50, type=int)

    commands = service.list_commands(status=status, limit=limit)
    return jsonify({
        'commands': commands,
        'count': len(commands)
    })


@commands_bp.route('/api/commands/<command_id>', methods=['DELETE'])
def cancel_command(command_id):
    """Cancel a pending command.

    Args:
        command_id: The command ID to cancel.

    Returns:
        JSON with cancellation status.
    """
    service = get_command_service()
    if not service:
        return jsonify({'error': 'Command service not initialized'}), 503

    success = service.cancel_command(command_id)
    if success:
        return jsonify({
            'success': True,
            'cancelled': command_id
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Command not found or not pending'
        }), 404


@commands_bp.route('/api/commands/status', methods=['GET'])
def passthrough_status():
    """Get passthrough mode status.

    Returns:
        JSON with active state and queue statistics.
    """
    service = get_command_service()
    if not service:
        return jsonify({
            'active': False,
            'error': 'Command service not initialized'
        }), 503

    pending_commands = service.list_commands(status='pending')
    processing_commands = service.list_commands(status='processing')

    return jsonify({
        'active': service.is_parent_active(),
        'queue_length': len(pending_commands),
        'processing_count': len(processing_commands),
        'pending_commands': pending_commands[:5]  # Preview of queue
    })


@commands_bp.route('/api/commands/heartbeat', methods=['POST'])
def update_heartbeat():
    """Update the parent session heartbeat.

    Called by the parent Claude Code session hook to indicate it's active.

    Returns:
        JSON with heartbeat update status.
    """
    service = get_command_service()
    if not service:
        return jsonify({'error': 'Command service not initialized'}), 503

    success = service.update_heartbeat()
    return jsonify({
        'success': success,
        'timestamp': 'updated' if success else 'failed'
    })


@commands_bp.route('/api/commands/cleanup', methods=['POST'])
def cleanup_commands():
    """Clean up old completed commands.

    Request Body (JSON):
        {
            "max_age_hours": 24  // Optional, default 24
        }

    Returns:
        JSON with cleanup statistics.
    """
    service = get_command_service()
    if not service:
        return jsonify({'error': 'Command service not initialized'}), 503

    data = request.get_json() or {}
    max_age_hours = data.get('max_age_hours', 24)

    removed = service.cleanup_old_commands(max_age_hours)
    return jsonify({
        'success': True,
        'removed': removed
    })
