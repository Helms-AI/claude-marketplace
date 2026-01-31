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

input_bp = Blueprint('input', __name__)

# SDK Bridge singleton (created on first use)
_sdk_bridge = None
_sdk_bridge_lock = threading.Lock()


def _find_marketplace_path() -> str:
    """Find the marketplace path by searching for marketplace.json."""
    # 1. Check environment variable first
    if 'CLAUDE_MARKETPLACE_PATH' in os.environ:
        return os.environ['CLAUDE_MARKETPLACE_PATH']

    # 2. Try cwd (if running from marketplace directory)
    cwd = os.getcwd()
    if os.path.exists(os.path.join(cwd, '.claude-plugin', 'marketplace.json')):
        return cwd

    # 3. Try walking up from this file's location
    current = os.path.dirname(__file__)
    for _ in range(10):  # Max 10 levels up
        if os.path.exists(os.path.join(current, '.claude-plugin', 'marketplace.json')):
            return current
        parent = os.path.dirname(current)
        if parent == current:  # Reached root
            break
        current = parent

    # 4. Check common locations
    common_paths = [
        os.path.expanduser('~/GitHub/claude-marketplace'),
        os.path.expanduser('~/Projects/claude-marketplace'),
    ]
    for path in common_paths:
        if os.path.exists(os.path.join(path, '.claude-plugin', 'marketplace.json')):
            return path

    # 5. Fallback to old behavior (4 dirs up from __file__)
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))


def get_sdk_bridge():
    """Get or create the SDK bridge singleton."""
    global _sdk_bridge
    with _sdk_bridge_lock:
        if _sdk_bridge is None:
            try:
                from ..services.marketplace_sdk_bridge import MarketplaceSDKBridge

                # Determine paths
                cwd = os.getcwd()
                marketplace_path = _find_marketplace_path()

                _sdk_bridge = MarketplaceSDKBridge(
                    cwd=cwd,
                    marketplace_path=marketplace_path
                )
                print(f"[SDK] Initialized bridge with cwd={cwd}, marketplace={marketplace_path}", file=sys.stderr)
            except ImportError as e:
                print(f"[SDK] Failed to import MarketplaceSDKBridge: {e}", file=sys.stderr)
                return None
            except Exception as e:
                print(f"[SDK] Failed to initialize bridge: {e}", file=sys.stderr)
                return None
        return _sdk_bridge


@input_bp.route('/api/input/sdk/query', methods=['POST'])
def sdk_query():
    """Send a prompt to Claude via the SDK and return a TRUE streaming response.

    Request Body (JSON):
        {
            "prompt": "Your message to Claude",
            "model": "sonnet",           // Optional: 'sonnet', 'opus', 'haiku'
            "max_turns": 50,              // Optional: safety limit for turns
            "max_budget_usd": 5.0,        // Optional: budget limit
            "enable_thinking": true,      // Optional: enable extended thinking
            "resume": "session-id"        // Optional: session ID to resume
        }

    Returns:
        SSE stream of Claude's response (real-time, not batched)
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available. Install with: pip install claude-agent-sdk'
        }), 503

    data = request.get_json()
    if not data or not data.get('prompt'):
        return jsonify({'error': 'No prompt provided'}), 400

    prompt = data['prompt']
    # Extract optional parameters (Phase 1.1, 1.2, 1.3, 1.4)
    model = data.get('model')  # 'sonnet', 'opus', 'haiku'
    max_turns = data.get('max_turns')  # int
    max_budget_usd = data.get('max_budget_usd')  # float
    enable_thinking = data.get('enable_thinking')  # bool
    # Phase 2.3 & 2.4
    output_format = data.get('output_format')  # dict with JSON schema
    enable_checkpointing = data.get('enable_checkpointing')  # bool
    # Session resumption for conversation continuity
    resume_session_id = data.get('resume')  # session ID to resume

    # Use a thread-safe queue to bridge async SDK to sync Flask SSE
    # This enables TRUE streaming - messages sent as they arrive!
    msg_queue = queue.Queue()

    def run_async_in_thread():
        """Run the async SDK query in a separate thread."""
        async def stream_to_queue():
            try:
                async for msg in bridge.stream_query(
                    prompt,
                    model=model,
                    max_turns=max_turns,
                    max_budget_usd=max_budget_usd,
                    enable_thinking=enable_thinking,
                    output_format=output_format,
                    enable_checkpointing=enable_checkpointing,
                    resume_session_id=resume_session_id,
                ):
                    msg_queue.put(msg)
            except Exception as e:
                msg_queue.put({'type': 'error', 'content': str(e)})
            finally:
                msg_queue.put(None)  # Signal completion

        # Create a new event loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(stream_to_queue())
        finally:
            loop.close()

    # Start async collection in background thread
    thread = threading.Thread(target=run_async_in_thread, daemon=True)
    thread.start()

    def generate():
        """Generate SSE events from queue AS THEY ARRIVE (true streaming)."""
        while True:
            try:
                # Block until a message arrives (with timeout for safety)
                msg = msg_queue.get(timeout=300)  # 5 minute timeout
                if msg is None:
                    # Completion signal
                    break
                sse_data = json.dumps(msg)
                yield f"data: {sse_data}\n\n"
            except queue.Empty:
                # Timeout - send keepalive and continue
                yield ": keepalive\n\n"
        yield "event: done\ndata: {}\n\n"

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )


@input_bp.route('/api/input/sdk/agents', methods=['GET'])
def list_sdk_agents():
    """List all available agents from the marketplace.

    Returns:
        JSON list of agents with name, description, and tools
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available',
            'agents': []
        }), 503

    return jsonify({
        'agents': bridge.list_agents(),
        'count': len(bridge.list_agents())
    })


@input_bp.route('/api/input/sdk/plugins', methods=['GET'])
def list_sdk_plugins():
    """List all loaded marketplace plugins.

    Returns:
        JSON list of plugins
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available',
            'plugins': []
        }), 503

    return jsonify({
        'plugins': bridge.list_plugins(),
        'count': len(bridge.list_plugins())
    })


@input_bp.route('/api/input/sdk/config', methods=['GET'])
def get_sdk_config():
    """Get SDK configuration and available options.

    Returns:
        JSON with available models, current settings, etc.
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available',
            'config': None
        }), 503

    return jsonify({
        'config': {
            'available_models': bridge.AVAILABLE_MODELS,
            'default_model': bridge.DEFAULT_MODEL,
            'fallback_model': bridge.FALLBACK_MODEL,
            'current_model': bridge.model,
            'max_turns': bridge.max_turns,
            'max_budget_usd': bridge.max_budget_usd,
            'enable_thinking': bridge.enable_thinking,
            'enable_hooks': bridge.enable_hooks,
            'default_max_thinking_tokens': bridge.DEFAULT_MAX_THINKING_TOKENS,
        }
    })


@input_bp.route('/api/input/sdk/hooks/stats', methods=['GET'])
def get_hook_stats():
    """Get hook system statistics.

    Returns:
        JSON with blocked count, total calls, etc.
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available',
            'stats': None
        }), 503

    return jsonify({
        'stats': bridge.get_hook_stats()
    })


@input_bp.route('/api/input/sdk/hooks/logs', methods=['GET'])
def get_hook_logs():
    """Get recent hook logs.

    Query params:
        count: Number of logs to return (default 20)

    Returns:
        JSON list of log entries
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available',
            'logs': []
        }), 503

    count = request.args.get('count', 20, type=int)
    return jsonify({
        'logs': bridge.get_hook_logs(count)
    })


@input_bp.route('/api/input/sdk/interrupt', methods=['POST'])
def sdk_interrupt():
    """Interrupt the current query.

    Returns:
        JSON with interrupted status
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available',
            'interrupted': False
        }), 503

    async def do_interrupt():
        return await bridge.interrupt()

    loop = asyncio.new_event_loop()
    try:
        result = loop.run_until_complete(do_interrupt())
    finally:
        loop.close()

    return jsonify({
        'interrupted': result
    })


@input_bp.route('/api/input/sdk/session', methods=['GET'])
def get_session():
    """Get the current session ID.

    Returns:
        JSON with session_id
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available',
            'session_id': None
        }), 503

    return jsonify({
        'session_id': bridge.get_current_session_id()
    })


@input_bp.route('/api/input/sdk/rewind', methods=['POST'])
def sdk_rewind():
    """Rewind files to a previous checkpoint (Phase 2.4).

    Request Body (JSON):
        {
            "uuid": "checkpoint-uuid"
        }

    Returns:
        JSON with success status
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available',
            'success': False
        }), 503

    data = request.get_json()
    uuid = data.get('uuid') if data else None

    if not uuid:
        return jsonify({
            'error': 'No UUID provided',
            'success': False
        }), 400

    async def do_rewind():
        return await bridge.rewind_files(uuid)

    loop = asyncio.new_event_loop()
    try:
        result = loop.run_until_complete(do_rewind())
    finally:
        loop.close()

    return jsonify({
        'success': result,
        'rewound_to': uuid if result else None
    })


# ============================================================================
# Phase 3.2: Session Management API
# ============================================================================

@input_bp.route('/api/input/sdk/sessions', methods=['GET'])
def list_sessions():
    """List all active sessions.

    Returns:
        JSON list of sessions
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available',
            'sessions': []
        }), 503

    return jsonify({
        'sessions': bridge.list_sessions(),
        'count': len(bridge.list_sessions())
    })


@input_bp.route('/api/input/sdk/sessions', methods=['POST'])
def create_session():
    """Create a new conversation session.

    Request Body (JSON):
        {
            "model": "sonnet",           // Optional
            "max_turns": 50,             // Optional
            "max_budget_usd": 5.0        // Optional
        }

    Returns:
        JSON with session_id
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available',
            'session_id': None
        }), 503

    data = request.get_json() or {}

    async def do_create():
        return await bridge.create_session(
            model=data.get('model'),
            max_turns=data.get('max_turns'),
            max_budget_usd=data.get('max_budget_usd'),
        )

    loop = asyncio.new_event_loop()
    try:
        session_id = loop.run_until_complete(do_create())
        return jsonify({
            'session_id': session_id,
            'success': True
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500
    finally:
        loop.close()


@input_bp.route('/api/input/sdk/sessions/<session_id>', methods=['DELETE'])
def close_session(session_id):
    """Close a specific session.

    Returns:
        JSON with success status
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available',
            'success': False
        }), 503

    async def do_close():
        return await bridge.close_session(session_id)

    loop = asyncio.new_event_loop()
    try:
        result = loop.run_until_complete(do_close())
        if result:
            return jsonify({'success': True, 'session_id': session_id})
        else:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
    finally:
        loop.close()


@input_bp.route('/api/input/sdk/sessions/<session_id>/continue', methods=['POST'])
def continue_session(session_id):
    """Continue a conversation in an existing session (streaming).

    Request Body (JSON):
        {
            "prompt": "Your message"
        }

    Returns:
        SSE stream of Claude's response
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available'
        }), 503

    data = request.get_json()
    if not data or not data.get('prompt'):
        return jsonify({'error': 'No prompt provided'}), 400

    prompt = data['prompt']

    # Use a thread-safe queue for streaming
    msg_queue = queue.Queue()

    def run_async_in_thread():
        async def stream_to_queue():
            try:
                async for msg in bridge.continue_session(session_id, prompt):
                    msg_queue.put(msg)
            except Exception as e:
                msg_queue.put({'type': 'error', 'content': str(e)})
            finally:
                msg_queue.put(None)

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(stream_to_queue())
        finally:
            loop.close()

    thread = threading.Thread(target=run_async_in_thread, daemon=True)
    thread.start()

    def generate():
        while True:
            try:
                msg = msg_queue.get(timeout=300)
                if msg is None:
                    break
                sse_data = json.dumps(msg)
                yield f"data: {sse_data}\n\n"
            except queue.Empty:
                yield ": keepalive\n\n"
        yield "event: done\ndata: {}\n\n"

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )


@input_bp.route('/api/input/sdk/sessions/<session_id>/fork', methods=['POST'])
def fork_session(session_id):
    """Fork an existing session to create a new branch.

    Returns:
        JSON with new session_id
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available',
            'session_id': None
        }), 503

    async def do_fork():
        return await bridge.fork_session(session_id)

    loop = asyncio.new_event_loop()
    try:
        new_session_id = loop.run_until_complete(do_fork())
        return jsonify({
            'session_id': new_session_id,
            'forked_from': session_id,
            'success': True
        })
    except ValueError as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 404
    except Exception as e:
        return jsonify({
            'error': str(e),
            'success': False
        }), 500
    finally:
        loop.close()


@input_bp.route('/api/input/sdk/sessions/cleanup', methods=['POST'])
def cleanup_sessions():
    """Clean up old sessions.

    Request Body (JSON):
        {
            "max_age_hours": 24    // Optional, default 24
        }

    Returns:
        JSON with count of cleaned sessions
    """
    bridge = get_sdk_bridge()
    if not bridge:
        return jsonify({
            'error': 'SDK not available',
            'cleaned': 0
        }), 503

    data = request.get_json() or {}
    max_age_hours = data.get('max_age_hours', 24)

    async def do_cleanup():
        return await bridge.cleanup_sessions(max_age_hours)

    loop = asyncio.new_event_loop()
    try:
        count = loop.run_until_complete(do_cleanup())
        return jsonify({
            'cleaned': count,
            'success': True
        })
    finally:
        loop.close()
