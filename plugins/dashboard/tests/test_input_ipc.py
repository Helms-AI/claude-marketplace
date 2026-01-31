#!/usr/bin/env python3
"""Tests for the input IPC module.

Tests cover:
- Command serialization/deserialization
- Socket server start/stop lifecycle
- Client connection/disconnection
- Authentication rejection for invalid tokens
- Rate limiting behavior
- Input validation (allowed/blocked commands)
"""

import json
import os
import sys
import tempfile
import threading
import time
import unittest

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.services.input_ipc import (
    InputCommand,
    InputResponse,
    InputIPCServer,
    InputIPCClient,
    RateLimiter,
    validate_command,
    generate_auth_token,
    ALLOWED_ACTIONS,
    MAX_PAYLOAD_SIZE,
)


class TestInputCommand(unittest.TestCase):
    """Tests for InputCommand serialization/deserialization."""

    def test_to_dict(self):
        """Test converting command to dictionary."""
        cmd = InputCommand(
            command_type='action',
            action='status',
            payload='test'
        )
        d = cmd.to_dict()

        self.assertEqual(d['type'], 'action')
        self.assertEqual(d['action'], 'status')
        self.assertEqual(d['payload'], 'test')
        self.assertIn('id', d)
        self.assertIn('timestamp', d)

    def test_to_json(self):
        """Test JSON serialization."""
        cmd = InputCommand(
            command_type='action',
            action='interrupt'
        )
        json_str = cmd.to_json()
        data = json.loads(json_str)

        self.assertEqual(data['type'], 'action')
        self.assertEqual(data['action'], 'interrupt')

    def test_from_dict(self):
        """Test creating command from dictionary."""
        d = {
            'id': 'test-123',
            'type': 'text',
            'action': 'input',
            'payload': 'hello world',
            'timestamp': '2026-01-30T00:00:00Z'
        }
        cmd = InputCommand.from_dict(d)

        self.assertEqual(cmd.command_id, 'test-123')
        self.assertEqual(cmd.command_type, 'text')
        self.assertEqual(cmd.action, 'input')
        self.assertEqual(cmd.payload, 'hello world')

    def test_from_json(self):
        """Test JSON deserialization."""
        json_str = '{"type": "action", "action": "cancel"}'
        cmd = InputCommand.from_json(json_str)

        self.assertEqual(cmd.command_type, 'action')
        self.assertEqual(cmd.action, 'cancel')

    def test_round_trip(self):
        """Test serialization round-trip."""
        original = InputCommand(
            command_type='action',
            action='status',
            payload='test payload'
        )
        json_str = original.to_json()
        restored = InputCommand.from_json(json_str)

        self.assertEqual(original.command_type, restored.command_type)
        self.assertEqual(original.action, restored.action)
        self.assertEqual(original.payload, restored.payload)


class TestInputResponse(unittest.TestCase):
    """Tests for InputResponse serialization."""

    def test_success_response(self):
        """Test creating success response."""
        resp = InputResponse.success('cmd-123', {'status': 'ok'})

        self.assertEqual(resp.command_id, 'cmd-123')
        self.assertEqual(resp.status, 'success')
        self.assertEqual(resp.data, {'status': 'ok'})
        self.assertIsNone(resp.error_message)

    def test_error_response(self):
        """Test creating error response."""
        resp = InputResponse.error('cmd-456', 'Something went wrong')

        self.assertEqual(resp.command_id, 'cmd-456')
        self.assertEqual(resp.status, 'error')
        self.assertEqual(resp.error_message, 'Something went wrong')
        self.assertIsNone(resp.data)

    def test_to_json(self):
        """Test JSON serialization of response."""
        resp = InputResponse.success('test', {'count': 42})
        data = json.loads(resp.to_json())

        self.assertEqual(data['id'], 'test')
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['data']['count'], 42)


class TestValidateCommand(unittest.TestCase):
    """Tests for command validation."""

    def test_valid_action_command(self):
        """Test validating allowed action commands."""
        for action in ALLOWED_ACTIONS:
            cmd = InputCommand(command_type='action', action=action)
            is_valid, error = validate_command(cmd)
            self.assertTrue(is_valid, f"Action {action} should be valid")
            self.assertIsNone(error)

    def test_invalid_action_command(self):
        """Test rejecting invalid action commands."""
        cmd = InputCommand(command_type='action', action='delete_all_files')
        is_valid, error = validate_command(cmd)

        self.assertFalse(is_valid)
        self.assertIn('Unknown action', error)

    def test_valid_text_command(self):
        """Test validating text commands."""
        cmd = InputCommand(
            command_type='text',
            action='input',
            payload='Hello world'
        )
        is_valid, error = validate_command(cmd)

        self.assertTrue(is_valid)
        self.assertIsNone(error)

    def test_text_command_too_large(self):
        """Test rejecting oversized text payload."""
        cmd = InputCommand(
            command_type='text',
            action='input',
            payload='x' * (MAX_PAYLOAD_SIZE + 1)
        )
        is_valid, error = validate_command(cmd)

        self.assertFalse(is_valid)
        self.assertIn('too large', error)

    def test_unknown_command_type(self):
        """Test rejecting unknown command types."""
        cmd = InputCommand(command_type='unknown', action='test')
        is_valid, error = validate_command(cmd)

        self.assertFalse(is_valid)
        self.assertIn('Unknown command type', error)


class TestRateLimiter(unittest.TestCase):
    """Tests for rate limiting."""

    def test_allows_under_limit(self):
        """Test that commands under the limit are allowed."""
        limiter = RateLimiter(max_rate=10, window=1.0)

        for _ in range(10):
            self.assertTrue(limiter.check())

    def test_blocks_over_limit(self):
        """Test that commands over the limit are blocked."""
        limiter = RateLimiter(max_rate=5, window=1.0)

        # Use up the limit
        for _ in range(5):
            limiter.check()

        # Next should be blocked
        self.assertFalse(limiter.check())

    def test_resets_after_window(self):
        """Test that rate limit resets after time window."""
        limiter = RateLimiter(max_rate=2, window=0.1)

        # Use up the limit
        limiter.check()
        limiter.check()
        self.assertFalse(limiter.check())

        # Wait for window to expire
        time.sleep(0.15)

        # Should be allowed again
        self.assertTrue(limiter.check())

    def test_reset_method(self):
        """Test manual reset of rate limiter."""
        limiter = RateLimiter(max_rate=2, window=1.0)

        limiter.check()
        limiter.check()
        self.assertFalse(limiter.check())

        limiter.reset()

        self.assertTrue(limiter.check())


class TestInputIPCServerClient(unittest.TestCase):
    """Integration tests for IPC server and client."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.socket_path = os.path.join(self.temp_dir, 'test.sock')
        self.auth_token = generate_auth_token()
        self.server = None

    def tearDown(self):
        """Clean up test fixtures."""
        if self.server:
            self.server.stop()

        # Clean up temp directory
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_server_start_stop(self):
        """Test server lifecycle."""
        server = InputIPCServer(self.socket_path, self.auth_token)

        # Start server
        server.start()
        self.assertTrue(os.path.exists(self.socket_path))

        # Stop server
        server.stop()

        # Socket should be cleaned up
        # (may take a moment on some systems)
        time.sleep(0.1)

    def test_client_connect_disconnect(self):
        """Test client connection lifecycle."""
        self.server = InputIPCServer(self.socket_path, self.auth_token)
        self.server.start()
        time.sleep(0.1)  # Give server time to start

        client = InputIPCClient()

        # Connect
        connected = client.connect(self.socket_path, self.auth_token)
        self.assertTrue(connected)
        self.assertTrue(client.is_connected)

        # Disconnect
        client.disconnect()
        self.assertFalse(client.is_connected)

    def test_authentication_failure(self):
        """Test client with wrong auth token."""
        self.server = InputIPCServer(self.socket_path, self.auth_token)
        self.server.start()
        time.sleep(0.1)

        client = InputIPCClient()

        # Try to connect with wrong token
        connected = client.connect(self.socket_path, 'wrong-token')
        self.assertFalse(connected)
        self.assertFalse(client.is_connected)

    def test_send_command(self):
        """Test sending a command and receiving response."""
        self.server = InputIPCServer(self.socket_path, self.auth_token)

        # Register a handler
        self.server.register_handler('status', lambda cmd: {
            'status': 'ok',
            'received_action': cmd.action
        })

        self.server.start()
        time.sleep(0.1)

        client = InputIPCClient()
        connected = client.connect(self.socket_path, self.auth_token)
        self.assertTrue(connected)

        # Send command
        cmd = InputCommand(command_type='action', action='status')
        response = client.send(cmd)

        self.assertEqual(response['status'], 'success')
        self.assertEqual(response['data']['status'], 'ok')
        self.assertEqual(response['data']['received_action'], 'status')

        client.disconnect()

    def test_handler_not_found(self):
        """Test command with no registered handler."""
        self.server = InputIPCServer(self.socket_path, self.auth_token)
        self.server.start()
        time.sleep(0.1)

        client = InputIPCClient()
        client.connect(self.socket_path, self.auth_token)

        # Send command with no handler
        cmd = InputCommand(command_type='action', action='status')
        response = client.send(cmd)

        self.assertEqual(response['status'], 'error')
        self.assertIn('No handler', response['error'])

        client.disconnect()

    def test_invalid_action_rejected(self):
        """Test that invalid actions are rejected."""
        self.server = InputIPCServer(self.socket_path, self.auth_token)
        self.server.start()
        time.sleep(0.1)

        client = InputIPCClient()
        client.connect(self.socket_path, self.auth_token)

        # Send command with invalid action
        cmd = InputCommand(command_type='action', action='evil_action')
        response = client.send(cmd)

        self.assertEqual(response['status'], 'error')
        self.assertIn('Unknown action', response['error'])

        client.disconnect()

    def test_multiple_clients(self):
        """Test multiple clients connecting simultaneously."""
        self.server = InputIPCServer(self.socket_path, self.auth_token)
        self.server.register_handler('status', lambda cmd: {'client': 'ok'})
        self.server.start()
        time.sleep(0.1)

        clients = []
        results = []

        def client_worker(client_id):
            client = InputIPCClient()
            if client.connect(self.socket_path, self.auth_token):
                clients.append(client)
                cmd = InputCommand(command_type='action', action='status')
                resp = client.send(cmd)
                results.append((client_id, resp['status']))
                client.disconnect()

        threads = [
            threading.Thread(target=client_worker, args=(i,))
            for i in range(3)
        ]

        for t in threads:
            t.start()
        for t in threads:
            t.join()

        # All clients should have succeeded
        self.assertEqual(len(results), 3)
        for client_id, status in results:
            self.assertEqual(status, 'success')


class TestGenerateAuthToken(unittest.TestCase):
    """Tests for auth token generation."""

    def test_generates_unique_tokens(self):
        """Test that tokens are unique."""
        tokens = [generate_auth_token() for _ in range(100)]
        self.assertEqual(len(set(tokens)), 100)

    def test_token_length(self):
        """Test token is reasonable length."""
        token = generate_auth_token()
        # URL-safe base64 of 32 bytes is 43 characters
        self.assertGreater(len(token), 30)


if __name__ == '__main__':
    unittest.main()
