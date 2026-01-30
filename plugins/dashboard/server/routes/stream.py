"""Server-Sent Events stream for real-time updates.

Note: The main /api/stream endpoint is defined in app.py using SSEManager.
This blueprint only provides the /api/heartbeat health check endpoint.
"""

import time
from flask import Blueprint

stream_bp = Blueprint('stream', __name__)


@stream_bp.route('/api/heartbeat', methods=['GET'])
def heartbeat():
    """Health check endpoint."""
    return {'status': 'ok', 'timestamp': time.time()}
