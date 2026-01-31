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
    """Send a prompt to Claude via the SDK and return a streaming response.

    Request Body (JSON):
        {
            "prompt": "Your message to Claude"
        }

    Returns:
        SSE stream of Claude's response
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

    # Collect all messages first to avoid asyncio cancel scope issues
    async def collect_messages():
        messages = []
        try:
            async for msg in bridge.stream_query(prompt):
                messages.append(msg)
        except Exception as e:
            messages.append({'type': 'error', 'content': str(e)})
        return messages

    # Run async collection
    try:
        messages = asyncio.run(collect_messages())
    except Exception as e:
        return jsonify({'error': f'SDK error: {str(e)}'}), 500

    def generate():
        """Generate SSE events from collected messages."""
        for msg in messages:
            sse_data = json.dumps(msg)
            yield f"event: message\ndata: {sse_data}\n\n"
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
