#!/usr/bin/env python3
"""Conversation API routes - Simple browser-to-SDK messaging.

Clean event-driven flow:
1. Browser sends message event (POST)
2. Server processes with Claude SDK
3. Server streams response via SSE

No complex bridges - just direct SDK usage from project root.
"""

import asyncio
import json
import queue
import threading
from flask import Blueprint, request, jsonify, Response, current_app

from ..services.conversation_service import (
    get_conversation_service,
    ConversationSettings
)

conversation_bp = Blueprint('conversation', __name__)


@conversation_bp.route('/api/conversation/send', methods=['POST'])
def send_message():
    """Send a message and stream the response via SSE.

    Request Body:
        {
            "message": "Your message to Claude",
            "context_id": "optional-context-id",
            "settings": {
                "model": "sonnet",           // sonnet, opus, haiku
                "max_turns": 50,
                "enable_thinking": true,
                "permission_mode": "default"  // default, acceptEdits, bypassPermissions
            }
        }

    Returns:
        SSE stream of events:
        - {type: "start", context_id, timestamp}
        - {type: "text", content, context_id, timestamp}  // Streaming chunks
        - {type: "assistant", content, context_id, timestamp}  // Complete message
        - {type: "error", content, context_id, timestamp}
        - {type: "end", context_id, timestamp}
    """
    data = request.get_json()

    if not data or not data.get('message'):
        return jsonify({'error': 'No message provided'}), 400

    message = data['message']
    context_id = data.get('context_id')
    settings_data = data.get('settings', {})

    # Build settings
    settings = ConversationSettings(
        model=settings_data.get('model', 'sonnet'),
        max_turns=settings_data.get('max_turns', 50),
        enable_thinking=settings_data.get('enable_thinking', True),
        max_thinking_tokens=settings_data.get('max_thinking_tokens', 16000),
        permission_mode=settings_data.get('permission_mode', 'default'),
        system_prompt=settings_data.get('system_prompt')
    )

    # Get conversation service
    try:
        service = get_conversation_service()
    except ValueError as e:
        return jsonify({'error': str(e)}), 503

    # Use thread-safe queue to bridge async to sync Flask
    msg_queue = queue.Queue()

    def run_async():
        """Run async message sending in a thread."""
        async def stream_to_queue():
            try:
                async for event in service.send_message(message, settings, context_id):
                    msg_queue.put(event)
            except Exception as e:
                msg_queue.put({
                    'type': 'error',
                    'content': str(e),
                    'context_id': context_id
                })
            finally:
                msg_queue.put(None)  # Signal completion

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(stream_to_queue())
        finally:
            loop.close()

    # Start async in background thread
    thread = threading.Thread(target=run_async, daemon=True)
    thread.start()

    def generate():
        """Generate SSE events from queue."""
        while True:
            try:
                event = msg_queue.get(timeout=300)  # 5 min timeout
                if event is None:
                    break
                yield f"data: {json.dumps(event)}\n\n"
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


@conversation_bp.route('/api/conversation/cancel', methods=['POST'])
def cancel_message():
    """Cancel the current message processing.

    Returns:
        JSON with cancelled status
    """
    try:
        service = get_conversation_service()
        cancelled = service.cancel()
        return jsonify({'cancelled': cancelled})
    except ValueError:
        return jsonify({'cancelled': False, 'error': 'Service not initialized'}), 503


@conversation_bp.route('/api/conversation/status', methods=['GET'])
def get_status():
    """Get conversation service status.

    Returns:
        JSON with service status
    """
    try:
        service = get_conversation_service()
        return jsonify({
            'available': True,
            'project_root': str(service.project_root)
        })
    except ValueError:
        return jsonify({
            'available': False,
            'error': 'Service not initialized'
        })
