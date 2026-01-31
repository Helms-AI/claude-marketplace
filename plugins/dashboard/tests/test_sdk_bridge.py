#!/usr/bin/env python3
"""Tests for the SDK bridge module (Phase 4.3).

Tests cover:
- SDK bridge initialization
- Agent and plugin discovery
- Options configuration
- Error handling and retry logic
- Session management
"""

import asyncio
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestMarketplaceSDKBridgeInit(unittest.TestCase):
    """Tests for SDK bridge initialization."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.marketplace_path = self.temp_dir

        # Create mock plugin structure
        plugin_dir = Path(self.temp_dir) / 'plugins' / 'test-plugin'
        plugin_dir.mkdir(parents=True)
        (plugin_dir / '.claude-plugin').mkdir()
        (plugin_dir / '.claude-plugin' / 'plugin.json').write_text(json.dumps({
            'name': 'test-plugin',
            'version': '1.0.0',
            'description': 'Test plugin'
        }))

        # Create mock agent
        agents_dir = plugin_dir / 'agents'
        agents_dir.mkdir()
        (agents_dir / 'test-agent.md').write_text('''# Test Agent - Role
## Role
Test agent for unit tests
''')

    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_bridge_init_without_sdk(self):
        """Test bridge initialization when SDK is not available."""
        with patch.dict('sys.modules', {'claude_agent_sdk': None}):
            # Force reimport to pick up mocked module
            from server.services.marketplace_sdk_bridge import MarketplaceSDKBridge

            bridge = MarketplaceSDKBridge(
                cwd=self.temp_dir,
                marketplace_path=self.marketplace_path
            )

            # Should initialize but have no plugins/agents loaded
            self.assertIsNotNone(bridge)

    def test_bridge_discovers_plugins(self):
        """Test that bridge discovers plugins correctly."""
        from server.services.marketplace_sdk_bridge import MarketplaceSDKBridge

        bridge = MarketplaceSDKBridge(
            cwd=self.temp_dir,
            marketplace_path=self.marketplace_path
        )

        plugins = bridge.list_plugins()
        self.assertIsInstance(plugins, list)

    def test_bridge_default_settings(self):
        """Test bridge default settings."""
        from server.services.marketplace_sdk_bridge import MarketplaceSDKBridge

        bridge = MarketplaceSDKBridge(
            cwd=self.temp_dir,
            marketplace_path=self.marketplace_path
        )

        self.assertEqual(bridge.model, 'sonnet')
        self.assertEqual(bridge.max_turns, 50)
        self.assertEqual(bridge.max_budget_usd, 5.0)
        self.assertTrue(bridge.enable_thinking)

    def test_bridge_custom_settings(self):
        """Test bridge with custom settings."""
        from server.services.marketplace_sdk_bridge import MarketplaceSDKBridge

        bridge = MarketplaceSDKBridge(
            cwd=self.temp_dir,
            marketplace_path=self.marketplace_path,
            model='opus',
            max_turns=100,
            max_budget_usd=10.0,
            enable_thinking=False
        )

        self.assertEqual(bridge.model, 'opus')
        self.assertEqual(bridge.max_turns, 100)
        self.assertEqual(bridge.max_budget_usd, 10.0)
        self.assertFalse(bridge.enable_thinking)


class TestRetryLogic(unittest.TestCase):
    """Tests for retry logic (Phase 4.1)."""

    def test_sdk_error_from_rate_limit(self):
        """Test SDKError detection of rate limit errors."""
        from server.services.marketplace_sdk_bridge import SDKError

        error = SDKError.from_exception(Exception("Rate limit exceeded"))

        self.assertEqual(error.code, 'rate_limit')
        self.assertTrue(error.retryable)
        self.assertIsNotNone(error.retry_after)

    def test_sdk_error_from_timeout(self):
        """Test SDKError detection of timeout errors."""
        from server.services.marketplace_sdk_bridge import SDKError

        error = SDKError.from_exception(Exception("Request timed out"))

        self.assertEqual(error.code, 'timeout')
        self.assertTrue(error.retryable)

    def test_sdk_error_from_unknown(self):
        """Test SDKError detection of unknown errors."""
        from server.services.marketplace_sdk_bridge import SDKError

        error = SDKError.from_exception(Exception("Something went wrong"))

        self.assertEqual(error.code, 'unknown')
        self.assertFalse(error.retryable)

    def test_sdk_error_to_dict(self):
        """Test SDKError serialization to dict."""
        from server.services.marketplace_sdk_bridge import SDKError

        error = SDKError(
            code='rate_limit',
            message='Too many requests',
            retryable=True,
            retry_after=60.0
        )

        result = error.to_dict()

        self.assertEqual(result['code'], 'rate_limit')
        self.assertEqual(result['message'], 'Too many requests')
        self.assertTrue(result['retryable'])
        self.assertEqual(result['retry_after'], 60.0)

    def test_retry_config_defaults(self):
        """Test RetryConfig default values."""
        from server.services.marketplace_sdk_bridge import RetryConfig

        config = RetryConfig()

        self.assertEqual(config.max_retries, 3)
        self.assertEqual(config.base_delay, 1.0)
        self.assertEqual(config.max_delay, 30.0)
        self.assertTrue(config.jitter)

    def test_retry_with_backoff_success(self):
        """Test retry_with_backoff on successful execution."""
        from server.services.marketplace_sdk_bridge import retry_with_backoff

        async def success_func():
            return "success"

        result = asyncio.run(retry_with_backoff(success_func))
        self.assertEqual(result, "success")

    def test_retry_with_backoff_retries(self):
        """Test retry_with_backoff retries on failure."""
        from server.services.marketplace_sdk_bridge import retry_with_backoff, RetryConfig

        attempts = [0]

        async def failing_then_success():
            attempts[0] += 1
            if attempts[0] < 3:
                raise Exception("Rate limit exceeded")
            return "success"

        config = RetryConfig(base_delay=0.01, max_delay=0.1)  # Fast for testing
        result = asyncio.run(retry_with_backoff(failing_then_success, config))

        self.assertEqual(result, "success")
        self.assertEqual(attempts[0], 3)


class TestSessionManagement(unittest.TestCase):
    """Tests for session management (Phase 3.2)."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_list_sessions_empty(self):
        """Test listing sessions when none exist."""
        from server.services.marketplace_sdk_bridge import MarketplaceSDKBridge

        bridge = MarketplaceSDKBridge(
            cwd=self.temp_dir,
            marketplace_path=self.temp_dir
        )

        sessions = bridge.list_sessions()
        self.assertEqual(sessions, [])


class TestMCPTools(unittest.TestCase):
    """Tests for MCP tools (Phase 3.1)."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()

        # Create mock marketplace structure
        claude_plugin_dir = Path(self.temp_dir) / '.claude-plugin'
        claude_plugin_dir.mkdir()
        (claude_plugin_dir / 'marketplace.json').write_text(json.dumps({
            'plugins': [
                {
                    'name': 'test-plugin',
                    'description': 'A test plugin',
                    'version': '1.0.0',
                    'category': 'testing',
                    'tags': ['test', 'unit']
                }
            ]
        }))
        (claude_plugin_dir / 'taxonomy.json').write_text(json.dumps({
            'domains': ['testing'],
            'verbs': ['test']
        }))

    def tearDown(self):
        """Clean up test fixtures."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_search_plugins(self):
        """Test plugin search MCP tool."""
        from server.services.marketplace_mcp import search_plugins

        # Mock the marketplace root
        with patch('server.services.marketplace_mcp.get_marketplace_root',
                   return_value=Path(self.temp_dir)):
            result = asyncio.run(search_plugins({'query': 'test'}))

            self.assertIn('content', result)
            self.assertEqual(len(result['content']), 1)

            content = json.loads(result['content'][0]['text'])
            self.assertIn('results', content)
            self.assertEqual(len(content['results']), 1)
            self.assertEqual(content['results'][0]['name'], 'test-plugin')

    def test_search_plugins_no_query(self):
        """Test plugin search with no query returns error."""
        from server.services.marketplace_mcp import search_plugins

        result = asyncio.run(search_plugins({}))

        content = json.loads(result['content'][0]['text'])
        self.assertIn('error', content)

    def test_list_plugins_summary(self):
        """Test plugins summary MCP tool."""
        from server.services.marketplace_mcp import list_plugins_summary

        with patch('server.services.marketplace_mcp.get_marketplace_root',
                   return_value=Path(self.temp_dir)):
            result = asyncio.run(list_plugins_summary({}))

            content = json.loads(result['content'][0]['text'])
            self.assertIn('plugins', content)
            self.assertEqual(content['count'], 1)

    def test_get_domain_taxonomy(self):
        """Test taxonomy MCP tool."""
        from server.services.marketplace_mcp import get_domain_taxonomy

        with patch('server.services.marketplace_mcp.get_marketplace_root',
                   return_value=Path(self.temp_dir)):
            result = asyncio.run(get_domain_taxonomy({}))

            content = json.loads(result['content'][0]['text'])
            self.assertIn('domains', content)

    def test_get_mcp_tool_definitions(self):
        """Test getting MCP tool definitions."""
        from server.services.marketplace_mcp import get_mcp_tool_definitions

        tools = get_mcp_tool_definitions()

        self.assertIsInstance(tools, list)
        self.assertGreater(len(tools), 0)

        # Check tool structure
        for tool in tools:
            self.assertIn('name', tool)
            self.assertIn('description', tool)
            self.assertIn('inputSchema', tool)

    def test_get_marketplace_mcp_allowed_tools(self):
        """Test getting allowed tool names."""
        from server.services.marketplace_mcp import get_marketplace_mcp_allowed_tools

        tools = get_marketplace_mcp_allowed_tools()

        self.assertIsInstance(tools, list)
        self.assertGreater(len(tools), 0)

        # Check format
        for tool in tools:
            self.assertTrue(tool.startswith('mcp__marketplace__'))


class TestHookSystem(unittest.TestCase):
    """Tests for hook system (Phase 2.1)."""

    def test_hook_manager_init(self):
        """Test hook manager initialization."""
        from server.services.sdk_hooks import SDKHookManager

        manager = SDKHookManager()

        self.assertEqual(manager.blocked_count, 0)
        self.assertEqual(manager.total_tool_calls, 0)
        self.assertEqual(len(manager.usage_logs), 0)

    def test_dangerous_command_detection(self):
        """Test detection of dangerous commands."""
        from server.services.sdk_hooks import SDKHookManager

        manager = SDKHookManager()

        # Test dangerous patterns
        dangerous_commands = [
            'rm -rf /',
            'sudo rm -rf /etc',
            'mkfs.ext4 /dev/sda',
            'dd if=/dev/zero of=/dev/sda',
            'chmod -R 777 /',
        ]

        for cmd in dangerous_commands:
            result = manager._check_bash_command({'command': cmd})
            self.assertFalse(result.allowed, f"Should block: {cmd}")

    def test_safe_command_allowed(self):
        """Test that safe commands are allowed."""
        from server.services.sdk_hooks import SDKHookManager

        manager = SDKHookManager()

        safe_commands = [
            'ls -la',
            'cat file.txt',
            'grep pattern file.txt',
            'git status',
            'npm install',
        ]

        for cmd in safe_commands:
            result = manager._check_bash_command({'command': cmd})
            self.assertTrue(result.allowed, f"Should allow: {cmd}")

    def test_pre_tool_use_blocks_dangerous(self):
        """Test PreToolUse hook blocks dangerous commands."""
        from server.services.sdk_hooks import SDKHookManager

        manager = SDKHookManager()

        result = asyncio.run(manager.pre_tool_use(
            'Bash',
            {'command': 'rm -rf /'},
            {}
        ))

        self.assertIn('hookSpecificOutput', result)
        self.assertEqual(result['hookSpecificOutput']['permissionDecision'], 'deny')
        self.assertEqual(manager.blocked_count, 1)

    def test_pre_tool_use_allows_safe(self):
        """Test PreToolUse hook allows safe commands."""
        from server.services.sdk_hooks import SDKHookManager

        manager = SDKHookManager()

        result = asyncio.run(manager.pre_tool_use(
            'Bash',
            {'command': 'ls -la'},
            {}
        ))

        self.assertEqual(result, {})
        self.assertEqual(manager.blocked_count, 0)

    def test_hook_stats(self):
        """Test hook statistics."""
        from server.services.sdk_hooks import SDKHookManager

        manager = SDKHookManager()

        # Make some calls
        asyncio.run(manager.pre_tool_use('Bash', {'command': 'ls'}, {}))
        asyncio.run(manager.pre_tool_use('Bash', {'command': 'rm -rf /'}, {}))
        asyncio.run(manager.pre_tool_use('Read', {'file_path': '/tmp/test'}, {}))

        stats = manager.get_stats()

        self.assertEqual(stats['total_tool_calls'], 3)
        self.assertEqual(stats['blocked_count'], 1)
        self.assertGreater(stats['log_count'], 0)

    def test_add_custom_pattern(self):
        """Test adding custom blocked pattern."""
        from server.services.sdk_hooks import SDKHookManager

        manager = SDKHookManager()
        manager.add_blocked_pattern(r'rm\s+sensitive', 'Removing sensitive file')

        result = manager._check_bash_command({'command': 'rm sensitive_data.txt'})

        self.assertFalse(result.allowed)
        self.assertEqual(result.reason, 'Removing sensitive file')

    def test_allow_list(self):
        """Test allow list functionality."""
        from server.services.sdk_hooks import SDKHookManager

        manager = SDKHookManager()
        manager.add_to_allow_list('--dry-run')

        # This would normally be blocked
        result = manager._check_bash_command({'command': 'rm -rf / --dry-run'})

        self.assertTrue(result.allowed)


if __name__ == '__main__':
    unittest.main()
