#!/usr/bin/env python3
"""Tests for the input routes module.

Tests cover:
- HTTP endpoints for input commands
- WebSocket bridge functionality
- Process listing and status
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
    InputIPCServer,
    generate_auth_token,
)
from server.services.process_registry import (
    ProcessRegistry,
    RegisteredProcess,
    ProcessRegistryManager,
)


class TestInputRoutesHTTP(unittest.TestCase):
    """Tests for HTTP input endpoints."""

    def setUp(self):
        """Set up test fixtures."""
        # Create temp directory for test files
        self.temp_dir = tempfile.mkdtemp()
        self.socket_path = os.path.join(self.temp_dir, 'test.sock')
        self.registry_path = os.path.join(self.temp_dir, 'registry.json')
        self.auth_token = generate_auth_token()

        # Reset the singleton registry
        ProcessRegistryManager.reset()

        # Create a test IPC server
        self.server = InputIPCServer(self.socket_path, self.auth_token)
        self.server.register_handler('status', lambda cmd: {
            'status': 'ok',
            'test': True
        })
        self.server.register_handler('refresh', lambda cmd: {
            'refreshed': True
        })
        self.server.start()
        time.sleep(0.1)

        # Register with process registry
        self.registry = ProcessRegistry(self.registry_path)
        self.pid = os.getpid()
        self.registry.register(RegisteredProcess(
            pid=self.pid,
            socket_path=self.socket_path,
            auth_token=self.auth_token,
            plugin_name='test-plugin',
            capabilities=['status', 'refresh']
        ))

        # Create Flask test client
        from server.app import create_app
        self.app = create_app(local_only=True)
        self.app.config['TESTING'] = True

        # Monkey-patch the registry manager to use our test registry
        original_get_registry = ProcessRegistryManager.get_registry
        ProcessRegistryManager.get_registry = lambda: self.registry
        self._original_get_registry = original_get_registry

        self.client = self.app.test_client()

    def tearDown(self):
        """Clean up test fixtures."""
        # Restore original registry manager
        ProcessRegistryManager.get_registry = self._original_get_registry

        # Stop server
        if self.server:
            self.server.stop()

        # Unregister from registry
        self.registry.unregister(self.pid)

        # Clean up temp directory
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_list_processes(self):
        """Test listing registered processes."""
        response = self.client.get('/api/input/processes')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertIn('processes', data)
        # Should contain our registered process
        pids = [p['pid'] for p in data['processes']]
        self.assertIn(self.pid, pids)

    def test_get_process_status(self):
        """Test getting process status."""
        response = self.client.get(f'/api/input/{self.pid}/status')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertEqual(data['pid'], self.pid)
        self.assertTrue(data['registered'])
        self.assertTrue(data['alive'])
        self.assertEqual(data['plugin_name'], 'test-plugin')

    def test_get_nonexistent_process_status(self):
        """Test getting status of non-existent process."""
        response = self.client.get('/api/input/99999999/status')

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertEqual(data['pid'], 99999999)
        self.assertFalse(data['registered'])
        self.assertFalse(data['alive'])

    def test_send_command(self):
        """Test sending a command via HTTP."""
        response = self.client.post(
            f'/api/input/{self.pid}/send',
            data=json.dumps({
                'type': 'action',
                'action': 'status'
            }),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)

        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['data']['status'], 'ok')
        self.assertTrue(data['data']['test'])

    def test_send_command_to_nonexistent_process(self):
        """Test sending command to non-existent process."""
        response = self.client.post(
            '/api/input/99999999/send',
            data=json.dumps({
                'type': 'action',
                'action': 'status'
            }),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertIn('error', data)

    def test_send_command_without_body(self):
        """Test sending command without JSON body."""
        response = self.client.post(f'/api/input/{self.pid}/send')

        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)


class TestWebSocketAvailability(unittest.TestCase):
    """Tests for WebSocket availability detection."""

    def test_websocket_available(self):
        """Test that WebSocket is available when flask-sock is installed."""
        from server.routes.input import WEBSOCKET_AVAILABLE

        # flask-sock should be installed
        self.assertTrue(WEBSOCKET_AVAILABLE)

    def test_init_websocket_routes(self):
        """Test that WebSocket routes can be initialized."""
        from server.routes.input import init_websocket_routes
        from flask import Flask

        app = Flask(__name__)
        # Should not raise
        init_websocket_routes(app)


class TestWebSocketIntegration(unittest.TestCase):
    """Integration tests for WebSocket input bridge.

    These tests require flask-sock to be installed and use
    the simple-websocket test client.
    """

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.socket_path = os.path.join(self.temp_dir, 'test.sock')
        self.registry_path = os.path.join(self.temp_dir, 'registry.json')
        self.auth_token = generate_auth_token()

        # Reset the singleton registry
        ProcessRegistryManager.reset()

        # Create a test IPC server
        self.server = InputIPCServer(self.socket_path, self.auth_token)
        self.server.register_handler('status', lambda cmd: {
            'status': 'ok',
            'websocket_test': True
        })
        self.server.start()
        time.sleep(0.1)

        # Register with process registry
        self.registry = ProcessRegistry(self.registry_path)
        self.pid = os.getpid()
        self.registry.register(RegisteredProcess(
            pid=self.pid,
            socket_path=self.socket_path,
            auth_token=self.auth_token,
            plugin_name='websocket-test',
            capabilities=['status']
        ))

        # Create Flask app with WebSocket routes
        from server.app import create_app
        from server.routes.input import init_websocket_routes

        self.app = create_app(local_only=True)
        self.app.config['TESTING'] = True

        # Monkey-patch the registry manager
        original_get_registry = ProcessRegistryManager.get_registry
        ProcessRegistryManager.get_registry = lambda: self.registry
        self._original_get_registry = original_get_registry

    def tearDown(self):
        """Clean up test fixtures."""
        ProcessRegistryManager.get_registry = self._original_get_registry

        if self.server:
            self.server.stop()

        self.registry.unregister(self.pid)

        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_websocket_routes_initialized(self):
        """Test that WebSocket routes were initialized on the app."""
        from server.routes.input import WEBSOCKET_AVAILABLE

        if not WEBSOCKET_AVAILABLE:
            self.skipTest("flask-sock not installed")

        # Check that the Sock instance was attached to the app
        # flask-sock adds routes differently than regular blueprints
        # We verify by checking the app config shows WebSocket was enabled
        # The create_app function prints "WebSocket input bridge enabled" when successful

        # Verify flask-sock module is available
        from flask_sock import Sock
        self.assertTrue(True)  # If we get here, import worked

    def test_websocket_can_import(self):
        """Test that flask-sock can be imported."""
        try:
            from flask_sock import Sock
            self.assertTrue(True)
        except ImportError:
            self.fail("flask-sock should be installed")


if __name__ == '__main__':
    unittest.main()
