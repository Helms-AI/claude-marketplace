#!/usr/bin/env python3
"""Tests for the process registry module.

Tests cover:
- Process registration and unregistration
- Lookup by PID
- Cleanup of stale entries
- Persistence to disk
- Thread safety
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

from server.services.process_registry import (
    ProcessRegistry,
    RegisteredProcess,
    ProcessRegistryManager,
    is_process_alive,
)


class TestRegisteredProcess(unittest.TestCase):
    """Tests for RegisteredProcess dataclass."""

    def test_to_dict(self):
        """Test converting process to dictionary."""
        process = RegisteredProcess(
            pid=12345,
            socket_path='/tmp/test.sock',
            auth_token='secret123',
            plugin_name='test-plugin',
            capabilities=['status', 'interrupt']
        )
        d = process.to_dict()

        self.assertEqual(d['pid'], 12345)
        self.assertEqual(d['socket_path'], '/tmp/test.sock')
        self.assertEqual(d['auth_token'], 'secret123')
        self.assertEqual(d['plugin_name'], 'test-plugin')
        self.assertEqual(d['capabilities'], ['status', 'interrupt'])
        self.assertIn('registered_at', d)

    def test_from_dict(self):
        """Test creating process from dictionary."""
        d = {
            'pid': 54321,
            'socket_path': '/tmp/other.sock',
            'auth_token': 'token456',
            'plugin_name': 'other-plugin',
            'registered_at': '2026-01-30T00:00:00Z',
            'capabilities': ['status']
        }
        process = RegisteredProcess.from_dict(d)

        self.assertEqual(process.pid, 54321)
        self.assertEqual(process.socket_path, '/tmp/other.sock')
        self.assertEqual(process.auth_token, 'token456')
        self.assertEqual(process.plugin_name, 'other-plugin')
        self.assertEqual(process.registered_at, '2026-01-30T00:00:00Z')
        self.assertEqual(process.capabilities, ['status'])

    def test_round_trip(self):
        """Test serialization round-trip."""
        original = RegisteredProcess(
            pid=99999,
            socket_path='/path/to/socket',
            auth_token='auth_token_value',
            plugin_name='round-trip-plugin',
            capabilities=['status', 'refresh', 'cancel']
        )
        d = original.to_dict()
        restored = RegisteredProcess.from_dict(d)

        self.assertEqual(original.pid, restored.pid)
        self.assertEqual(original.socket_path, restored.socket_path)
        self.assertEqual(original.auth_token, restored.auth_token)
        self.assertEqual(original.plugin_name, restored.plugin_name)
        self.assertEqual(original.capabilities, restored.capabilities)


class TestProcessRegistry(unittest.TestCase):
    """Tests for ProcessRegistry."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.registry_path = os.path.join(self.temp_dir, 'registry.json')
        self.registry = ProcessRegistry(self.registry_path)

    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_register_and_get(self):
        """Test registering and retrieving a process."""
        # Use current process (known to be alive)
        pid = os.getpid()
        process = RegisteredProcess(
            pid=pid,
            socket_path='/tmp/test.sock',
            auth_token='secret',
            plugin_name='test'
        )

        self.registry.register(process)
        retrieved = self.registry.get(pid)

        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.pid, pid)
        self.assertEqual(retrieved.plugin_name, 'test')

    def test_unregister(self):
        """Test unregistering a process."""
        pid = os.getpid()
        process = RegisteredProcess(
            pid=pid,
            socket_path='/tmp/test.sock',
            auth_token='secret',
            plugin_name='test'
        )

        self.registry.register(process)
        self.assertIsNotNone(self.registry.get(pid))

        result = self.registry.unregister(pid)
        self.assertTrue(result)
        self.assertIsNone(self.registry.get(pid))

    def test_unregister_nonexistent(self):
        """Test unregistering a non-existent process."""
        result = self.registry.unregister(99999999)
        self.assertFalse(result)

    def test_list_all(self):
        """Test listing all processes."""
        pid = os.getpid()

        for i in range(3):
            process = RegisteredProcess(
                pid=pid + i * 1000000,  # Use fake PIDs that won't exist
                socket_path=f'/tmp/test{i}.sock',
                auth_token=f'secret{i}',
                plugin_name=f'plugin-{i}'
            )
            self.registry.register(process)

        # Register current process too (only one that's alive)
        self.registry.register(RegisteredProcess(
            pid=pid,
            socket_path='/tmp/current.sock',
            auth_token='current',
            plugin_name='current'
        ))

        processes = self.registry.list_all()

        # Only current process should be returned (others are "dead")
        self.assertEqual(len(processes), 1)
        self.assertEqual(processes[0].pid, pid)

    def test_cleanup_stale(self):
        """Test cleanup of stale entries."""
        # Register some fake PIDs (won't exist)
        for i in range(3):
            process = RegisteredProcess(
                pid=99999000 + i,  # Unlikely to exist
                socket_path=f'/tmp/stale{i}.sock',
                auth_token=f'stale{i}',
                plugin_name=f'stale-{i}'
            )
            self.registry.register(process)

        # Also register current process
        pid = os.getpid()
        self.registry.register(RegisteredProcess(
            pid=pid,
            socket_path='/tmp/alive.sock',
            auth_token='alive',
            plugin_name='alive'
        ))

        # Cleanup stale
        removed = self.registry.cleanup_stale()

        self.assertEqual(len(removed), 3)
        self.assertIn(99999000, removed)
        self.assertIn(99999001, removed)
        self.assertIn(99999002, removed)

        # Current process should still be there
        self.assertIsNotNone(self.registry.get(pid))

    def test_find_by_plugin(self):
        """Test finding processes by plugin name."""
        pid = os.getpid()

        # Register multiple processes for same plugin
        self.registry.register(RegisteredProcess(
            pid=pid,
            socket_path='/tmp/p1.sock',
            auth_token='t1',
            plugin_name='my-plugin'
        ))

        # These won't show up (dead PIDs)
        self.registry.register(RegisteredProcess(
            pid=99999100,
            socket_path='/tmp/p2.sock',
            auth_token='t2',
            plugin_name='my-plugin'
        ))
        self.registry.register(RegisteredProcess(
            pid=99999200,
            socket_path='/tmp/p3.sock',
            auth_token='t3',
            plugin_name='other-plugin'
        ))

        # Find by plugin
        found = self.registry.find_by_plugin('my-plugin')

        # Only alive process should be found
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0].pid, pid)

    def test_persistence(self):
        """Test that registry persists to disk."""
        pid = os.getpid()
        process = RegisteredProcess(
            pid=pid,
            socket_path='/tmp/persist.sock',
            auth_token='persist-token',
            plugin_name='persist-plugin'
        )

        self.registry.register(process)

        # Create new registry instance pointing to same file
        registry2 = ProcessRegistry(self.registry_path)
        retrieved = registry2.get(pid)

        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.plugin_name, 'persist-plugin')

    def test_thread_safety(self):
        """Test concurrent access to registry."""
        pid = os.getpid()
        errors = []

        def worker(worker_id):
            try:
                for i in range(10):
                    process = RegisteredProcess(
                        pid=pid,
                        socket_path=f'/tmp/thread{worker_id}.sock',
                        auth_token=f'token-{worker_id}-{i}',
                        plugin_name=f'thread-{worker_id}'
                    )
                    self.registry.register(process)
                    self.registry.get(pid)
                    self.registry.list_all()
            except Exception as e:
                errors.append(e)

        threads = [
            threading.Thread(target=worker, args=(i,))
            for i in range(5)
        ]

        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(len(errors), 0, f"Thread errors: {errors}")


class TestProcessRegistryManager(unittest.TestCase):
    """Tests for ProcessRegistryManager singleton."""

    def setUp(self):
        """Reset singleton for each test."""
        ProcessRegistryManager.reset()

    def test_get_registry(self):
        """Test getting singleton instance."""
        registry1 = ProcessRegistryManager.get_registry()
        registry2 = ProcessRegistryManager.get_registry()

        self.assertIs(registry1, registry2)

    def test_reset(self):
        """Test resetting singleton."""
        registry1 = ProcessRegistryManager.get_registry()
        ProcessRegistryManager.reset()
        registry2 = ProcessRegistryManager.get_registry()

        self.assertIsNot(registry1, registry2)


class TestIsProcessAlive(unittest.TestCase):
    """Tests for is_process_alive helper."""

    def test_current_process_alive(self):
        """Test that current process is detected as alive."""
        self.assertTrue(is_process_alive(os.getpid()))

    def test_parent_process_alive(self):
        """Test that parent process is detected as alive."""
        # Parent process should always exist
        self.assertTrue(is_process_alive(os.getppid()))

    def test_nonexistent_process(self):
        """Test that non-existent PID returns False."""
        # Use a very high PID that's unlikely to exist
        # Also, very high PIDs are typically invalid on most systems
        self.assertFalse(is_process_alive(2147483647))


if __name__ == '__main__':
    unittest.main()
