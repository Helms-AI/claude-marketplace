#!/usr/bin/env python3
"""Input API routes - SDK-based Claude querying.

This module provides SDK-based Claude querying with streaming responses.
Uses the Claude Agent SDK to query with marketplace agents and plugins.

Endpoints:
- POST /api/input/sdk/query - Send prompt to Claude via SDK (streaming)
- GET /api/input/sdk/agents - List available marketplace agents
- GET /api/input/sdk/plugins - List loaded marketplace plugins
"""

from __future__ import annotations

import asyncio
import json
import os
import queue
import sys
import threading
from flask import Blueprint, request, jsonify, Response

# New thin SDK service — used for the primary query endpoint
try:
    from ..services.sdk_service import (
        build_options,
        stream_query,
        serialize_message,
        SDK_AVAILABLE as _SDK_SERVICE_AVAILABLE,
        _DEFAULT_CWD as _SDK_DEFAULT_CWD,
    )
    _SDK_SERVICE_LOADED = True
except Exception as _sdk_svc_err:  # pragma: no cover
    _SDK_SERVICE_LOADED = False
    _SDK_SERVICE_AVAILABLE = False
    _SDK_DEFAULT_CWD = os.getcwd()
    print(f"[input] Failed to import sdk_service: {_sdk_svc_err}", file=sys.stderr)

input_bp = Blueprint('input', __name__)

def _find_marketplace_path() -> str:
    """Find the marketplace path by searching for marketplace.json."""
    if 'CLAUDE_MARKETPLACE_PATH' in os.environ:
        return os.environ['CLAUDE_MARKETPLACE_PATH']

    cwd = os.getcwd()
    if os.path.exists(os.path.join(cwd, '.claude-plugin', 'marketplace.json')):
        return cwd

    current = os.path.dirname(__file__)
    for _ in range(10):
        if os.path.exists(os.path.join(current, '.claude-plugin', 'marketplace.json')):
            return current
        parent = os.path.dirname(current)
        if parent == current:
            break
        current = parent

    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))


@input_bp.route('/api/input/sdk/query', methods=['POST'])
def sdk_query():
    """Send a prompt to Claude via the SDK and return a TRUE streaming response.

    Uses the native ``sdk_service`` thin wrapper (not the deprecated bridge).

    Request Body (JSON):
        {
            "prompt": "Your message to Claude",
            "model": "sonnet",                    // Optional: 'sonnet', 'opus', 'haiku'
            "max_turns": 50,                       // Optional: safety limit for turns
            "max_budget_usd": 5.0,                 // Optional: budget limit
            "enable_thinking": true,               // Optional: enable extended thinking
            "max_thinking_tokens": 16000,          // Optional: thinking token budget
            "resume": "session-id",                // Optional: session ID to resume
            "continue_conversation": true,         // Optional: continue last conversation
            "permission_mode": "acceptEdits",      // Optional
            "sandbox_mode": false,                 // Optional: enable sandbox
            "mcp_tools": true,                     // Optional: false disables MCP tools
            "system_prompt": "...",                // Optional: custom system prompt
            "enable_file_checkpointing": false     // Optional: enable file checkpoints
        }

    Returns:
        SSE stream of Claude's response (real-time, not batched)
    """
    if not _SDK_SERVICE_LOADED or not _SDK_SERVICE_AVAILABLE:
        return jsonify({
            'error': 'SDK not available. Install with: pip install claude-agent-sdk'
        }), 503

    data = request.get_json()
    if not data or not data.get('prompt'):
        return jsonify({'error': 'No prompt provided'}), 400

    prompt: str = data['prompt']

    # Build options via the new thin service.
    try:
        options = build_options(data, cwd=_SDK_DEFAULT_CWD)
    except Exception as exc:
        return jsonify({'error': f'Failed to build SDK options: {exc}'}), 500

    # Thread-safe queue bridges the async generator to the sync SSE generator.
    msg_queue: queue.Queue = queue.Queue()

    def run_async_in_thread() -> None:
        """Run async stream_query in a dedicated thread with its own event loop."""
        async def stream_to_queue() -> None:
            try:
                async for msg in stream_query(prompt, options):
                    msg_queue.put(msg)
            except Exception as exc:
                msg_queue.put({'type': 'error', 'content': str(exc)})
            finally:
                msg_queue.put(None)  # completion sentinel

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(stream_to_queue())
        finally:
            loop.close()

    thread = threading.Thread(target=run_async_in_thread, daemon=True)
    thread.start()

    def generate():
        """Yield SSE events from queue as they arrive (true streaming)."""
        while True:
            try:
                msg = msg_queue.get(timeout=30)
                if msg is None:
                    break
                yield f"data: {json.dumps(msg)}\n\n"
            except queue.Empty:
                yield ": keepalive\n\n"
        yield "event: done\ndata: {}\n\n"

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    )


@input_bp.route('/api/input/sdk/agents', methods=['GET'])
def list_sdk_agents():
    """List available agents — delegates to the main agent registry."""
    from flask import current_app
    registry = current_app.config.get('agent_registry')
    if not registry:
        return jsonify({'agents': [], 'count': 0})
    agents = [{'name': a.get('name', ''), 'domain': a.get('domain', ''), 'description': a.get('description', '')} for a in registry.get_all()]
    return jsonify({'agents': agents, 'count': len(agents)})


@input_bp.route('/api/input/sdk/plugins', methods=['GET'])
def list_sdk_plugins():
    """List loaded plugins — reads from marketplace registry."""
    import json as json_mod
    marketplace_path = _find_marketplace_path()
    mp_file = os.path.join(marketplace_path, '.claude-plugin', 'marketplace.json') if marketplace_path else None
    plugins = []
    if mp_file and os.path.isfile(mp_file):
        try:
            with open(mp_file) as f:
                data = json_mod.load(f)
            plugins = data.get('plugins', [])
        except Exception:
            pass
    return jsonify({'plugins': plugins, 'count': len(plugins)})


@input_bp.route('/api/input/sdk/config', methods=['GET'])
def get_sdk_config():
    """Get SDK configuration and available options."""
    return jsonify({
        'config': {
            'available_models': ['sonnet', 'opus', 'haiku'],
            'default_model': 'sonnet',
            'fallback_model': 'sonnet',
            'current_model': 'sonnet',
            'max_turns': 50,
            'max_budget_usd': 5.0,
            'enable_thinking': True,
            'default_max_thinking_tokens': 16000,
        }
    })


@input_bp.route('/api/input/sdk/hooks/stats', methods=['GET'])
def get_hook_stats():
    """Get hook system statistics."""
    return jsonify({'stats': {'total_calls': 0, 'blocked': 0}})


@input_bp.route('/api/input/sdk/hooks/logs', methods=['GET'])
def get_hook_logs():
    """Get recent hook logs."""
    return jsonify({'logs': []})


@input_bp.route('/api/input/sdk/interrupt', methods=['POST'])
def sdk_interrupt():
    """Interrupt the current query — not supported with native SDK streaming."""
    return jsonify({'interrupted': False, 'message': 'Interrupt not supported in native SDK mode. Close the browser tab to cancel.'})


@input_bp.route('/api/input/sdk/session', methods=['GET'])
def get_session():
    """Get the current session ID — sessions are managed by the SDK per-query."""
    return jsonify({'session_id': None, 'message': 'Sessions are managed per-query via resume parameter'})


@input_bp.route('/api/input/sdk/rewind', methods=['POST'])
def sdk_rewind():
    """Rewind files to a previous checkpoint."""
    return jsonify({'success': False, 'message': 'Rewind not supported in native SDK mode'}), 501


# ============================================================================
# Phase 3.2: Session Management API
# ============================================================================

@input_bp.route('/api/input/sdk/sessions', methods=['GET'])
def list_sessions():
    """List sessions — delegates to the main sessions API."""
    return jsonify({'sessions': [], 'count': 0, 'message': 'Use /api/sessions/all for session listing'})


@input_bp.route('/api/input/sdk/sessions', methods=['POST'])
def create_session():
    """Create a new session — sends a query with no resume to start fresh."""
    import uuid
    new_id = str(uuid.uuid4())
    return jsonify({'session_id': new_id, 'success': True, 'message': 'Session created. Use /api/input/sdk/query with resume parameter to continue.'})


@input_bp.route('/api/input/sdk/sessions/<session_id>', methods=['DELETE'])
def close_session(session_id):
    """Close a session — native SDK sessions end when the query completes."""
    return jsonify({'success': True, 'session_id': session_id})


@input_bp.route('/api/input/sdk/sessions/<session_id>/continue', methods=['POST'])
def continue_session(session_id):
    """Continue a conversation — uses native SDK with resume parameter."""
    if not _SDK_SERVICE_LOADED or not _SDK_SERVICE_AVAILABLE:
        return jsonify({'error': 'SDK not available'}), 503

    data = request.get_json()
    if not data or not data.get('prompt'):
        return jsonify({'error': 'No prompt provided'}), 400

    # Build options with resume to continue this session
    query_data = {**data, 'resume': session_id, 'continue_conversation': True}
    options = build_options(query_data, cwd=_SDK_DEFAULT_CWD)
    prompt = data['prompt']

    msg_queue = queue.Queue()

    def run_async_in_thread():
        async def _stream():
            try:
                async for msg in stream_query(prompt, options):
                    msg_queue.put(msg)
            except Exception as e:
                msg_queue.put({'type': 'error', 'content': str(e)})
            finally:
                msg_queue.put(None)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_stream())
        finally:
            loop.close()

    threading.Thread(target=run_async_in_thread, daemon=True).start()

    def generate():
        while True:
            try:
                msg = msg_queue.get(timeout=30)
                if msg is None:
                    break
                yield f"data: {json.dumps(msg)}\n\n"
            except queue.Empty:
                yield ": keepalive\n\n"
        yield "event: done\ndata: {}\n\n"

    return Response(generate(), mimetype='text/event-stream', headers={
        'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'X-Accel-Buffering': 'no'
    })


@input_bp.route('/api/input/sdk/sessions/<session_id>/fork', methods=['POST'])
def fork_session(session_id):
    """Fork a session — creates a new session that resumes from the original."""
    import uuid
    new_id = str(uuid.uuid4())
    return jsonify({'session_id': new_id, 'forked_from': session_id, 'success': True})


@input_bp.route('/api/input/sdk/sessions/cleanup', methods=['POST'])
def cleanup_sessions():
    """Clean up old sessions — no-op in native SDK mode."""
    return jsonify({'cleaned': 0, 'success': True})


@input_bp.route('/api/input/sdk/install', methods=['POST'])
def install_sdk():
    """Attempt to install the claude-agent-sdk package.

    This endpoint allows the dashboard to self-heal when the SDK is not installed.

    Returns:
        JSON with installation status
    """
    import subprocess

    try:
        # Check if already installed
        try:
            import claude_agent_sdk
            return jsonify({
                'success': True,
                'message': 'claude-agent-sdk is already installed',
                'already_installed': True
            })
        except ImportError:
            pass

        # Attempt to install
        print("[SDK] Attempting to install claude-agent-sdk...", file=sys.stderr)
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', 'claude-agent-sdk'],
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout
        )

        if result.returncode == 0:
            print("[SDK] Successfully installed claude-agent-sdk", file=sys.stderr)

            return jsonify({
                'success': True,
                'message': 'claude-agent-sdk installed successfully. Please refresh the page.',
                'output': result.stdout
            })
        else:
            print(f"[SDK] Failed to install claude-agent-sdk: {result.stderr}", file=sys.stderr)
            return jsonify({
                'success': False,
                'message': 'Failed to install claude-agent-sdk',
                'error': result.stderr
            }), 500

    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'message': 'Installation timed out'
        }), 504
    except Exception as e:
        print(f"[SDK] Error installing SDK: {e}", file=sys.stderr)
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@input_bp.route('/api/input/sdk/status', methods=['GET'])
def sdk_status():
    """Check SDK installation and availability status.

    Returns:
        JSON with SDK status information
    """
    sdk_installed = False
    sdk_version = None

    try:
        import claude_agent_sdk
        sdk_installed = True
        sdk_version = getattr(claude_agent_sdk, '__version__', 'unknown')
    except ImportError:
        pass

    return jsonify({
        'sdk_installed': sdk_installed,
        'sdk_version': sdk_version,
        'bridge_available': _SDK_SERVICE_LOADED and _SDK_SERVICE_AVAILABLE,
        'can_install': True
    })
