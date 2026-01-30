"""Token-based authentication for dashboard."""

import os
import secrets
from functools import wraps
from flask import request, jsonify


class AuthManager:
    """Manages authentication tokens."""

    def __init__(self, token_file: str = None):
        """Initialize the auth manager.

        Args:
            token_file: Path to store the auth token.
        """
        self.token_file = token_file
        self.token = None
        self.local_mode = True

    def initialize(self, local_only: bool = True) -> None:
        """Initialize authentication.

        Args:
            local_only: If True, bind to localhost only (no auth required).
        """
        self.local_mode = local_only

        if not local_only:
            self._load_or_create_token()

    def _load_or_create_token(self) -> None:
        """Load existing token or create new one."""
        if self.token_file and os.path.isfile(self.token_file):
            try:
                with open(self.token_file, 'r') as f:
                    self.token = f.read().strip()
                return
            except Exception:
                pass

        # Generate new token
        self.token = secrets.token_urlsafe(32)

        # Save token
        if self.token_file:
            try:
                os.makedirs(os.path.dirname(self.token_file), exist_ok=True)
                with open(self.token_file, 'w') as f:
                    f.write(self.token)
            except Exception as e:
                print(f"Warning: Could not save auth token: {e}")

    def get_token(self) -> str:
        """Get the current auth token.

        Returns:
            The auth token or empty string in local mode.
        """
        return self.token or ''

    def validate_request(self, req) -> bool:
        """Validate an incoming request.

        Args:
            req: Flask request object.

        Returns:
            True if request is authorized.
        """
        if self.local_mode:
            return True

        # Check Authorization header
        auth_header = req.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            return token == self.token

        # Check query parameter
        token = req.args.get('token', '')
        return token == self.token


def require_auth(auth_manager: 'AuthManager'):
    """Decorator to require authentication.

    Args:
        auth_manager: The AuthManager instance.

    Returns:
        Decorator function.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not auth_manager.validate_request(request):
                return jsonify({'error': 'Unauthorized'}), 401
            return f(*args, **kwargs)
        return decorated_function
    return decorator
