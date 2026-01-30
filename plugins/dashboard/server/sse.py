"""Server-Sent Events manager."""

import json
import queue
import sys
import time
from threading import Lock
from typing import Callable, Optional


class SSEManager:
    """Manages Server-Sent Events connections and broadcasting."""

    def __init__(self, debug: bool = False):
        """Initialize the SSE manager.

        Args:
            debug: Enable debug logging.
        """
        self.clients: list[queue.Queue] = []
        self.lock = Lock()
        self.event_listener: Optional[Callable] = None
        self.debug = debug
        self._broadcast_count = 0

    def _log(self, msg: str) -> None:
        """Log a debug message if debug mode is enabled."""
        if self.debug:
            print(f"[SSE] {msg}", file=sys.stderr, flush=True)

    def register_client(self) -> queue.Queue:
        """Register a new SSE client.

        Returns:
            Queue for receiving events.
        """
        client_queue = queue.Queue(maxsize=100)
        with self.lock:
            self.clients.append(client_queue)
            client_count = len(self.clients)
        self._log(f"Client registered. Total clients: {client_count}")
        return client_queue

    def unregister_client(self, client_queue: queue.Queue) -> None:
        """Unregister an SSE client.

        Args:
            client_queue: The client's queue.
        """
        with self.lock:
            if client_queue in self.clients:
                self.clients.remove(client_queue)
                self._log(f"Client unregistered. Total clients: {len(self.clients)}")

    def broadcast(self, event_data: dict, event_type: str = 'message') -> int:
        """Broadcast an event to all connected clients.

        Args:
            event_data: The event data to broadcast.
            event_type: The event type.

        Returns:
            Number of clients the message was sent to.
        """
        message = {
            'type': event_type,
            'data': event_data,
            'timestamp': time.time()
        }

        sent_count = 0
        with self.lock:
            dead_clients = []
            for client_queue in self.clients:
                try:
                    client_queue.put_nowait(message)
                    sent_count += 1
                except queue.Full:
                    dead_clients.append(client_queue)

            for client in dead_clients:
                self.clients.remove(client)

            self._broadcast_count += 1

        self._log(f"Broadcast #{self._broadcast_count} type={event_type} to {sent_count} clients")
        return sent_count

    def get_client_count(self) -> int:
        """Get the number of connected clients.

        Returns:
            Number of connected clients.
        """
        with self.lock:
            return len(self.clients)

    def create_event_listener(self, event_store) -> Callable:
        """Create an event listener for the event store.

        Args:
            event_store: The EventStore instance.

        Returns:
            Listener callback function.
        """
        def listener(event):
            self.broadcast(
                event_store.to_dict(event),
                event_type='conversation_event'
            )

        self.event_listener = listener
        return listener

    def generate_stream(self, client_queue: queue.Queue):
        """Generate SSE stream for a client.

        Args:
            client_queue: The client's queue.

        Yields:
            SSE formatted messages.
        """
        try:
            # Send initial connection event
            yield self._format_sse({
                'type': 'connected',
                'client_count': self.get_client_count(),
                'timestamp': time.time()
            })

            while True:
                try:
                    # Wait for events with shorter timeout for more frequent heartbeats
                    # This helps keep the connection alive in browsers
                    message = client_queue.get(timeout=3.0)
                    yield self._format_sse(message)
                except queue.Empty:
                    # Send heartbeat to keep connection alive
                    yield self._format_sse({
                        'type': 'heartbeat',
                        'timestamp': time.time()
                    })

        except GeneratorExit:
            self._log("Stream generator exit")
        except Exception as e:
            self._log(f"Stream error: {e}")

    @staticmethod
    def _format_sse(data: dict) -> str:
        """Format data as SSE message.

        Args:
            data: The data to format.

        Returns:
            SSE formatted string.
        """
        return f"data: {json.dumps(data)}\n\n"
