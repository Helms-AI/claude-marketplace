"""Server-Sent Events stream for real-time updates."""

import json
import queue
import time
from flask import Blueprint, Response, current_app
from threading import Lock

stream_bp = Blueprint('stream', __name__)

# Global client registry
clients: list[queue.Queue] = []
clients_lock = Lock()


def register_client() -> queue.Queue:
    """Register a new SSE client.

    Returns:
        Queue for receiving events.
    """
    client_queue = queue.Queue()
    with clients_lock:
        clients.append(client_queue)
    return client_queue


def unregister_client(client_queue: queue.Queue) -> None:
    """Unregister an SSE client.

    Args:
        client_queue: The client's queue.
    """
    with clients_lock:
        if client_queue in clients:
            clients.remove(client_queue)


def broadcast_event(event_data: dict) -> None:
    """Broadcast an event to all connected clients.

    Args:
        event_data: The event data to broadcast.
    """
    with clients_lock:
        dead_clients = []
        for client_queue in clients:
            try:
                client_queue.put_nowait(event_data)
            except queue.Full:
                dead_clients.append(client_queue)

        for client in dead_clients:
            clients.remove(client)


def event_listener(event) -> None:
    """Listener callback for event store.

    Args:
        event: The conversation event.
    """
    event_store = current_app.config.get('event_store')
    if event_store:
        broadcast_event(event_store.to_dict(event))


@stream_bp.route('/api/stream', methods=['GET'])
def event_stream():
    """Server-Sent Events endpoint for real-time updates."""

    def generate():
        client_queue = register_client()

        try:
            # Send initial connection event
            yield f"data: {json.dumps({'type': 'connected', 'timestamp': time.time()})}\n\n"

            while True:
                try:
                    # Wait for events with timeout for heartbeat
                    event_data = client_queue.get(timeout=15.0)
                    yield f"data: {json.dumps(event_data)}\n\n"
                except queue.Empty:
                    # Send heartbeat
                    yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': time.time()})}\n\n"

        except GeneratorExit:
            pass
        finally:
            unregister_client(client_queue)

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )


@stream_bp.route('/api/heartbeat', methods=['GET'])
def heartbeat():
    """Health check endpoint."""
    return {'status': 'ok', 'timestamp': time.time()}
