#!/usr/bin/env python3
"""SDK Hook System - Security and behavior modification hooks.

This module provides a hook system for the Claude Agent SDK to:
1. Block dangerous commands before they execute
2. Log tool usage for monitoring
3. Modify tool inputs/outputs as needed

Hook Types:
- PreToolUse: Execute before tool runs, can block or modify
- PostToolUse: Execute after tool completes, for logging/metrics

Usage:
    from sdk_hooks import hook_manager

    # In ClaudeAgentOptions:
    hooks={
        'PreToolUse': [hook_manager.create_pre_tool_matcher('Bash')],
        'PostToolUse': [hook_manager.create_post_tool_matcher('*')],
    }
"""

from __future__ import annotations

import re
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional, Callable
from dataclasses import dataclass, field


@dataclass
class HookResult:
    """Result from a hook execution."""
    allowed: bool = True
    reason: Optional[str] = None
    modified_input: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ToolUsageLog:
    """Log entry for tool usage."""
    timestamp: datetime
    tool_name: str
    tool_input: Dict[str, Any]
    tool_output: Optional[Any] = None
    duration_ms: Optional[float] = None
    is_error: bool = False
    blocked: bool = False
    block_reason: Optional[str] = None


class SDKHookManager:
    """Manages hooks for SDK query lifecycle.

    Provides security hooks to block dangerous commands and
    logging hooks for monitoring tool usage.
    """

    # Dangerous command patterns to block
    DANGEROUS_PATTERNS = [
        # Recursive root deletion
        (r'rm\s+(-[rf]+\s+)*/', 'Recursive root deletion'),
        (r'rm\s+.*--no-preserve-root', 'Root deletion without preserve'),
        # Elevated privilege operations
        (r'sudo\s+rm\s+-rf', 'Elevated privilege recursive deletion'),
        (r'sudo\s+dd\s+', 'Elevated disk write'),
        (r'sudo\s+mkfs', 'Elevated filesystem format'),
        # Fork bomb
        (r':\(\)\{\s*:\|:\s*&\s*\};:', 'Fork bomb'),
        # Filesystem formatting
        (r'mkfs\.', 'Filesystem formatting'),
        # Direct disk operations
        (r'dd\s+.*if=.*of=/dev/', 'Direct disk write'),
        # Dangerous chmod
        (r'chmod\s+(-R\s+)?777\s+/', 'Recursive chmod 777 on root'),
        # History/trace clearing
        (r'history\s+-c', 'History clearing'),
        (r'shred.*/(etc|root|home)', 'Shredding system directories'),
        # Network attacks (outbound only concerns)
        (r'curl\s+.*\|\s*(ba)?sh', 'Piping remote script to shell'),
        (r'wget\s+.*\|\s*(ba)?sh', 'Piping remote script to shell'),
    ]

    # Commands that require extra scrutiny but aren't blocked by default
    SENSITIVE_PATTERNS = [
        (r'git\s+push\s+.*--force', 'Force push'),
        (r'git\s+reset\s+--hard', 'Hard reset'),
        (r'DROP\s+(TABLE|DATABASE)', 'Database deletion'),
        (r'TRUNCATE\s+', 'Table truncation'),
    ]

    def __init__(self):
        """Initialize the hook manager."""
        self.usage_logs: List[ToolUsageLog] = []
        self.blocked_count: int = 0
        self.total_tool_calls: int = 0
        self.custom_blocked_patterns: List[tuple] = []
        self.allow_list: List[str] = []

    async def pre_tool_use(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute before tool runs. Can block or modify the tool call.

        Args:
            tool_name: Name of the tool being called
            tool_input: Input parameters for the tool
            context: Additional context (session info, etc.)

        Returns:
            Dict with hook decision. Empty dict allows the tool to proceed.
            Dict with 'hookSpecificOutput' blocks the tool.
        """
        self.total_tool_calls += 1

        # Check Bash commands for dangerous patterns
        if tool_name == 'Bash':
            result = self._check_bash_command(tool_input)
            if not result.allowed:
                self.blocked_count += 1
                self._log_blocked(tool_name, tool_input, result.reason)
                return {
                    'hookSpecificOutput': {
                        'hookEventName': 'PreToolUse',
                        'permissionDecision': 'deny',
                        'permissionDecisionReason': f'Blocked: {result.reason}'
                    }
                }

        # Check Write/Edit for dangerous paths
        if tool_name in ('Write', 'Edit'):
            result = self._check_file_operation(tool_input)
            if not result.allowed:
                self.blocked_count += 1
                self._log_blocked(tool_name, tool_input, result.reason)
                return {
                    'hookSpecificOutput': {
                        'hookEventName': 'PreToolUse',
                        'permissionDecision': 'deny',
                        'permissionDecisionReason': f'Blocked: {result.reason}'
                    }
                }

        # Log the tool call start
        self._log_start(tool_name, tool_input)

        # Allow tool to proceed
        return {}

    async def post_tool_use(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        tool_output: Any,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute after tool completes. For logging and metrics.

        Args:
            tool_name: Name of the tool that was called
            tool_input: Input parameters that were used
            tool_output: Output from the tool
            context: Additional context

        Returns:
            Empty dict (post hooks can't modify behavior)
        """
        # Update the log entry with output
        self._log_complete(tool_name, tool_output)

        return {}

    def _check_bash_command(self, tool_input: Dict[str, Any]) -> HookResult:
        """Check a Bash command for dangerous patterns.

        Args:
            tool_input: The Bash tool input with 'command' field

        Returns:
            HookResult indicating if command is allowed
        """
        cmd = tool_input.get('command', '')

        if not cmd:
            return HookResult(allowed=True)

        # Check against allow list first
        for allowed in self.allow_list:
            if allowed in cmd:
                return HookResult(allowed=True)

        # Check custom blocked patterns
        for pattern, reason in self.custom_blocked_patterns:
            if re.search(pattern, cmd, re.IGNORECASE):
                return HookResult(allowed=False, reason=reason)

        # Check built-in dangerous patterns
        for pattern, reason in self.DANGEROUS_PATTERNS:
            if re.search(pattern, cmd, re.IGNORECASE):
                return HookResult(allowed=False, reason=reason)

        return HookResult(allowed=True)

    def _check_file_operation(self, tool_input: Dict[str, Any]) -> HookResult:
        """Check file operations for dangerous paths.

        Args:
            tool_input: The Write/Edit tool input with 'file_path' field

        Returns:
            HookResult indicating if operation is allowed
        """
        file_path = tool_input.get('file_path', '')

        if not file_path:
            return HookResult(allowed=True)

        # Block writes to critical system paths
        dangerous_paths = [
            '/etc/passwd', '/etc/shadow', '/etc/sudoers',
            '/boot/', '/sys/', '/proc/',
            '~/.ssh/authorized_keys', '~/.bashrc', '~/.profile',
        ]

        for dangerous in dangerous_paths:
            if file_path.startswith(dangerous) or dangerous in file_path:
                return HookResult(
                    allowed=False,
                    reason=f'Write to protected path: {dangerous}'
                )

        return HookResult(allowed=True)

    def _log_start(self, tool_name: str, tool_input: Dict[str, Any]) -> None:
        """Log the start of a tool call."""
        log_entry = ToolUsageLog(
            timestamp=datetime.now(),
            tool_name=tool_name,
            tool_input=tool_input,
        )
        self.usage_logs.append(log_entry)

        # Keep log size manageable
        if len(self.usage_logs) > 1000:
            self.usage_logs = self.usage_logs[-500:]

        print(f"[SDK Hook] Tool started: {tool_name}", file=sys.stderr)

    def _log_complete(self, tool_name: str, tool_output: Any) -> None:
        """Log the completion of a tool call."""
        # Find the most recent log entry for this tool
        for log in reversed(self.usage_logs):
            if log.tool_name == tool_name and log.tool_output is None:
                log.tool_output = tool_output
                log.duration_ms = (datetime.now() - log.timestamp).total_seconds() * 1000
                log.is_error = isinstance(tool_output, dict) and tool_output.get('is_error', False)
                break

    def _log_blocked(self, tool_name: str, tool_input: Dict[str, Any], reason: str) -> None:
        """Log a blocked tool call."""
        log_entry = ToolUsageLog(
            timestamp=datetime.now(),
            tool_name=tool_name,
            tool_input=tool_input,
            blocked=True,
            block_reason=reason,
        )
        self.usage_logs.append(log_entry)

        print(f"[SDK Hook] BLOCKED: {tool_name} - {reason}", file=sys.stderr)

    def add_blocked_pattern(self, pattern: str, reason: str) -> None:
        """Add a custom pattern to block.

        Args:
            pattern: Regex pattern to match
            reason: Human-readable reason for blocking
        """
        self.custom_blocked_patterns.append((pattern, reason))

    def add_to_allow_list(self, substring: str) -> None:
        """Add a substring to the allow list.

        Commands containing this substring will not be blocked.

        Args:
            substring: String that, if found in command, allows it
        """
        self.allow_list.append(substring)

    def get_stats(self) -> Dict[str, Any]:
        """Get hook statistics.

        Returns:
            Dict with blocked count, total calls, etc.
        """
        return {
            'total_tool_calls': self.total_tool_calls,
            'blocked_count': self.blocked_count,
            'block_rate': self.blocked_count / max(1, self.total_tool_calls),
            'log_count': len(self.usage_logs),
        }

    def get_recent_logs(self, count: int = 20) -> List[Dict[str, Any]]:
        """Get recent usage logs.

        Args:
            count: Number of logs to return

        Returns:
            List of log entries as dicts
        """
        return [
            {
                'timestamp': log.timestamp.isoformat(),
                'tool_name': log.tool_name,
                'blocked': log.blocked,
                'block_reason': log.block_reason,
                'duration_ms': log.duration_ms,
                'is_error': log.is_error,
            }
            for log in self.usage_logs[-count:]
        ]

    def create_pre_tool_matcher(self, tool_pattern: str) -> Dict[str, Any]:
        """Create a PreToolUse hook matcher configuration.

        Args:
            tool_pattern: Tool name or '*' for all tools

        Returns:
            HookMatcher-compatible dict for ClaudeAgentOptions
        """
        return {
            'matcher': tool_pattern,
            'hooks': [self.pre_tool_use],
            'timeout': 120,
        }

    def create_post_tool_matcher(self, tool_pattern: str) -> Dict[str, Any]:
        """Create a PostToolUse hook matcher configuration.

        Args:
            tool_pattern: Tool name or '*' for all tools

        Returns:
            HookMatcher-compatible dict for ClaudeAgentOptions
        """
        return {
            'matcher': tool_pattern,
            'hooks': [self.post_tool_use],
            'timeout': 60,
        }


# Singleton instance for use across the application
hook_manager = SDKHookManager()
