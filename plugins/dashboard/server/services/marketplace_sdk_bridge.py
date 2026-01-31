#!/usr/bin/env python3
"""Marketplace SDK Bridge - Use Claude Agent SDK with marketplace plugins.

This module provides a bridge that allows the dashboard to query Claude
using the Agent SDK while loading all marketplace agents and skills.

Architecture:
- Discovers all marketplace plugins from the plugins/ directory
- Converts agent markdown files to AgentDefinition objects
- Loads plugins so their skills are available
- Streams responses back to the dashboard via SSE

Usage:
    bridge = MarketplaceSDKBridge(
        cwd="/path/to/project",
        marketplace_path="/path/to/claude-marketplace"
    )

    async for message in bridge.stream_query("Create a React component"):
        print(message)
"""

from __future__ import annotations

import asyncio
import re
import sys
import random
from pathlib import Path
from typing import AsyncIterator, Optional, Any, Callable, TypeVar
from dataclasses import dataclass, field
from datetime import datetime

# Note: Install with: pip install claude-agent-sdk pyyaml
try:
    from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition
    SDK_AVAILABLE = True
    # Try to import ClaudeSDKClient for session management (Phase 2.2)
    try:
        from claude_agent_sdk import ClaudeSDKClient
        CLIENT_AVAILABLE = True
    except ImportError:
        CLIENT_AVAILABLE = False
except ImportError:
    SDK_AVAILABLE = False
    CLIENT_AVAILABLE = False
    print("[MarketplaceSDKBridge] claude-agent-sdk not installed. "
          "Install with: pip install claude-agent-sdk", file=sys.stderr)

try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False

# Import hook manager for security hooks (Phase 2.1)
try:
    from .sdk_hooks import hook_manager
    HOOKS_AVAILABLE = True
except ImportError:
    HOOKS_AVAILABLE = False
    hook_manager = None

# Import marketplace MCP tools (Phase 3.1)
try:
    from .marketplace_mcp import (
        get_marketplace_mcp_allowed_tools,
        get_mcp_tool_handlers,
        MCP_TOOLS,
    )
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False
    get_marketplace_mcp_allowed_tools = lambda: []
    get_mcp_tool_handlers = lambda: {}
    MCP_TOOLS = []


@dataclass
class ParsedAgent:
    """Parsed agent from marketplace format."""
    name: str
    description: str
    prompt: str
    tools: list[str]


@dataclass
class RetryConfig:
    """Configuration for retry logic (Phase 4.1)."""
    max_retries: int = 3
    base_delay: float = 1.0
    max_delay: float = 30.0
    exponential_base: float = 2.0
    jitter: bool = True
    retryable_errors: list[str] = field(default_factory=lambda: [
        'rate_limit',
        'overloaded',
        'timeout',
        'connection',
        'api_error',
    ])


@dataclass
class SDKError:
    """Structured error from SDK (Phase 4.1)."""
    code: str
    message: str
    retryable: bool = False
    retry_after: Optional[float] = None
    details: Optional[dict] = None

    @classmethod
    def from_exception(cls, e: Exception) -> 'SDKError':
        """Create SDKError from exception."""
        error_str = str(e).lower()

        # Detect retryable errors
        if 'rate limit' in error_str or 'rate_limit' in error_str:
            return cls(
                code='rate_limit',
                message=str(e),
                retryable=True,
                retry_after=60.0  # Default to 60 seconds
            )
        elif 'overloaded' in error_str or 'capacity' in error_str:
            return cls(
                code='overloaded',
                message=str(e),
                retryable=True,
                retry_after=30.0
            )
        elif 'timeout' in error_str or 'timed out' in error_str:
            return cls(
                code='timeout',
                message=str(e),
                retryable=True
            )
        elif 'connection' in error_str or 'network' in error_str:
            return cls(
                code='connection',
                message=str(e),
                retryable=True
            )
        elif 'api' in error_str and 'error' in error_str:
            return cls(
                code='api_error',
                message=str(e),
                retryable=True
            )
        else:
            return cls(
                code='unknown',
                message=str(e),
                retryable=False
            )

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            'code': self.code,
            'message': self.message,
            'retryable': self.retryable,
            'retry_after': self.retry_after,
        }


async def retry_with_backoff(
    func: Callable,
    config: Optional[RetryConfig] = None,
    on_retry: Optional[Callable[[int, SDKError, float], None]] = None,
) -> Any:
    """Execute a function with retry logic and exponential backoff.

    Args:
        func: Async function to execute
        config: Retry configuration
        on_retry: Optional callback called before each retry (attempt, error, delay)

    Returns:
        Result from the function

    Raises:
        Last exception if all retries fail
    """
    config = config or RetryConfig()
    last_error = None

    for attempt in range(config.max_retries + 1):
        try:
            return await func()
        except Exception as e:
            sdk_error = SDKError.from_exception(e)
            last_error = e

            # Check if we should retry
            if not sdk_error.retryable or attempt >= config.max_retries:
                raise

            # Calculate delay with exponential backoff
            if sdk_error.retry_after:
                delay = sdk_error.retry_after
            else:
                delay = min(
                    config.base_delay * (config.exponential_base ** attempt),
                    config.max_delay
                )

            # Add jitter to prevent thundering herd
            if config.jitter:
                delay = delay * (0.5 + random.random())

            # Call retry callback
            if on_retry:
                on_retry(attempt + 1, sdk_error, delay)

            print(f"[SDK Bridge] Retry {attempt + 1}/{config.max_retries} "
                  f"after {delay:.1f}s: {sdk_error.code}", file=sys.stderr)

            await asyncio.sleep(delay)

    raise last_error


class MarketplaceSDKBridge:
    """Bridge for querying Claude with marketplace agents and skills.

    This bridge:
    1. Discovers all plugins in the marketplace
    2. Loads agents from plugin agents/ directories
    3. Configures the SDK with all agents and skills
    4. Streams responses back for real-time display
    """

    # Available models for selection
    AVAILABLE_MODELS = ['sonnet', 'opus', 'haiku']
    DEFAULT_MODEL = 'sonnet'
    FALLBACK_MODEL = 'haiku'
    DEFAULT_MAX_TURNS = 50
    DEFAULT_MAX_BUDGET_USD = 5.0
    DEFAULT_MAX_THINKING_TOKENS = 16000

    # Beta features (Phase 3.3)
    AVAILABLE_BETAS = ["context-1m-2025-08-07"]

    # Sandbox configuration (Phase 3.4)
    DEFAULT_SANDBOX_CONFIG = {
        "enabled": True,
        "allow_network": True,
        "allow_filesystem": True,
    }

    def __init__(
        self,
        cwd: str,
        marketplace_path: Optional[str] = None,
        permission_mode: str = 'acceptEdits',
        model: Optional[str] = None,
        max_turns: Optional[int] = None,
        max_budget_usd: Optional[float] = None,
        enable_thinking: bool = True,
        enable_hooks: bool = True,
        enable_mcp_tools: bool = True,
        enable_betas: bool = False,
        enable_sandbox: bool = True,
    ):
        """Initialize the marketplace SDK bridge.

        Args:
            cwd: Working directory for Claude operations (your project path)
            marketplace_path: Path to claude-marketplace repo (defaults to cwd)
            permission_mode: Permission mode ('default', 'acceptEdits', 'bypassPermissions')
            model: Model to use ('sonnet', 'opus', 'haiku')
            max_turns: Maximum number of turns before stopping (safety limit)
            max_budget_usd: Maximum budget in USD before stopping
            enable_thinking: Whether to enable extended thinking
            enable_hooks: Whether to enable security hooks
            enable_mcp_tools: Whether to enable marketplace MCP tools (Phase 3.1)
            enable_betas: Whether to enable beta features like extended context (Phase 3.3)
            enable_sandbox: Whether to enable sandbox configuration (Phase 3.4)
        """
        self.cwd = cwd
        self.marketplace_path = marketplace_path or cwd
        self.permission_mode = permission_mode
        self.model = model or self.DEFAULT_MODEL
        self.max_turns = max_turns or self.DEFAULT_MAX_TURNS
        self.max_budget_usd = max_budget_usd or self.DEFAULT_MAX_BUDGET_USD
        self.enable_thinking = enable_thinking
        self.enable_hooks = enable_hooks and HOOKS_AVAILABLE
        self.enable_mcp_tools = enable_mcp_tools and MCP_AVAILABLE
        self.enable_betas = enable_betas
        self.enable_sandbox = enable_sandbox

        # Discover plugins and agents
        self.plugins: list[dict] = []
        self.agents: dict[str, Any] = {}

        # Session management (Phase 2.2 & 3.2)
        self._client: Optional[Any] = None
        self._sessions: dict[str, Any] = {}
        self._current_session_id: Optional[str] = None

        if SDK_AVAILABLE:
            self.plugins = self._discover_plugins()
            self.agents = self._load_all_agents()
            mcp_status = f", {len(MCP_TOOLS)} MCP tools" if self.enable_mcp_tools else ""
            print(f"[MarketplaceSDKBridge] Loaded {len(self.plugins)} plugins, "
                  f"{len(self.agents)} agents{mcp_status}", file=sys.stderr)

    def _discover_plugins(self) -> list[dict]:
        """Discover all marketplace plugins."""
        plugins = []
        plugins_dir = Path(self.marketplace_path) / "plugins"

        if not plugins_dir.exists():
            print(f"[MarketplaceSDKBridge] Plugins directory not found: {plugins_dir}",
                  file=sys.stderr)
            return plugins

        for plugin_path in plugins_dir.iterdir():
            if not plugin_path.is_dir():
                continue

            plugin_json = plugin_path / ".claude-plugin" / "plugin.json"
            if plugin_json.exists():
                plugins.append({
                    "type": "local",
                    "path": str(plugin_path)
                })
                print(f"[MarketplaceSDKBridge] Found plugin: {plugin_path.name}",
                      file=sys.stderr)

        return plugins

    def _load_all_agents(self) -> dict[str, Any]:
        """Load all agents from marketplace plugins."""
        if not SDK_AVAILABLE:
            return {}

        agents = {}
        plugins_dir = Path(self.marketplace_path) / "plugins"

        if not plugins_dir.exists():
            return agents

        for plugin_path in plugins_dir.iterdir():
            if not plugin_path.is_dir():
                continue

            agents_dir = plugin_path / "agents"
            if agents_dir.exists():
                for agent_file in agents_dir.glob("*.md"):
                    parsed = self._parse_agent_file(agent_file)
                    if parsed:
                        # Create AgentDefinition
                        agents[parsed.name] = AgentDefinition(
                            description=parsed.description,
                            prompt=parsed.prompt,
                            tools=parsed.tools
                        )

        return agents

    def _parse_agent_file(self, path: Path) -> Optional[ParsedAgent]:
        """Parse a marketplace agent markdown file.

        Supports two formats:

        Format 1 (with frontmatter):
        ---
        name: agent-name
        description: Agent description
        tools: [Read, Grep, Glob]
        ---
        # Agent Name
        [Prompt content...]

        Format 2 (without frontmatter):
        # Agent Name - Role Title
        ## Role
        Description here...
        [Prompt content...]
        """
        try:
            content = path.read_text()

            # Try to parse YAML frontmatter first
            match = re.match(r'^---\n(.*?)\n---\n(.*)$', content, re.DOTALL)
            if match:
                frontmatter_str = match.group(1)
                prompt = match.group(2).strip()

                # Parse YAML
                if YAML_AVAILABLE:
                    frontmatter = yaml.safe_load(frontmatter_str)
                else:
                    frontmatter = self._parse_simple_yaml(frontmatter_str)

                return ParsedAgent(
                    name=frontmatter.get('name', path.stem),
                    description=frontmatter.get('description', ''),
                    prompt=prompt,
                    tools=frontmatter.get('tools', ['Read', 'Grep', 'Glob'])
                )

            # Fallback: Parse markdown without frontmatter
            # Extract name from first heading
            heading_match = re.match(r'^#\s+(.+?)(?:\s*-\s*(.+))?$', content, re.MULTILINE)
            if heading_match:
                name = path.stem  # Use filename as name
                title = heading_match.group(1).strip()
                role = heading_match.group(2).strip() if heading_match.group(2) else ''

                # Try to find Role/Expertise section for description
                role_match = re.search(r'^##\s+(?:Role|Expertise)\s*\n(.+?)(?=\n##|\Z)',
                                       content, re.MULTILINE | re.DOTALL)
                if role_match:
                    description = role_match.group(1).strip().split('\n')[0]
                else:
                    description = role or title

                return ParsedAgent(
                    name=name,
                    description=description[:100],  # Limit length
                    prompt=content,
                    tools=['Read', 'Grep', 'Glob', 'Bash']  # Default tools
                )

            # Last resort: use filename
            return ParsedAgent(
                name=path.stem,
                description=f"Agent from {path.parent.parent.name} plugin",
                prompt=content,
                tools=['Read', 'Grep', 'Glob']
            )

        except Exception as e:
            print(f"[MarketplaceSDKBridge] Error parsing {path}: {e}",
                  file=sys.stderr)
            return None

    def _parse_simple_yaml(self, yaml_str: str) -> dict:
        """Simple YAML parsing fallback."""
        result = {}
        for line in yaml_str.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()
                # Handle arrays
                if value.startswith('[') and value.endswith(']'):
                    value = [v.strip() for v in value[1:-1].split(',')]
                result[key] = value
        return result

    def get_options(
        self,
        model: Optional[str] = None,
        max_turns: Optional[int] = None,
        max_budget_usd: Optional[float] = None,
        enable_thinking: Optional[bool] = None,
        enable_hooks: Optional[bool] = None,
        output_format: Optional[dict] = None,
        enable_checkpointing: Optional[bool] = None,
        enable_mcp_tools: Optional[bool] = None,
        enable_betas: Optional[bool] = None,
        enable_sandbox: Optional[bool] = None,
        session_id: Optional[str] = None,
        continue_conversation: bool = False,
    ) -> Any:
        """Get ClaudeAgentOptions with all marketplace configuration.

        Args:
            model: Override the instance model setting
            max_turns: Override the instance max_turns setting
            max_budget_usd: Override the instance max_budget_usd setting
            enable_thinking: Override the instance enable_thinking setting
            enable_hooks: Override the instance enable_hooks setting
            output_format: JSON schema for structured outputs (Phase 2.3)
            enable_checkpointing: Enable file checkpointing (Phase 2.4)
            enable_mcp_tools: Enable marketplace MCP tools (Phase 3.1)
            enable_betas: Enable beta features (Phase 3.3)
            enable_sandbox: Enable sandbox configuration (Phase 3.4)
            session_id: Session ID for continuation (Phase 3.2)
            continue_conversation: Whether to continue an existing conversation (Phase 3.2)

        Returns:
            ClaudeAgentOptions configured for marketplace use
        """
        if not SDK_AVAILABLE:
            raise RuntimeError("claude-agent-sdk is not installed")

        # Use provided values or fall back to instance settings
        use_model = model or self.model
        use_max_turns = max_turns if max_turns is not None else self.max_turns
        use_max_budget = max_budget_usd if max_budget_usd is not None else self.max_budget_usd
        use_thinking = enable_thinking if enable_thinking is not None else self.enable_thinking
        use_hooks = enable_hooks if enable_hooks is not None else self.enable_hooks
        use_mcp = enable_mcp_tools if enable_mcp_tools is not None else self.enable_mcp_tools
        use_betas = enable_betas if enable_betas is not None else self.enable_betas
        use_sandbox = enable_sandbox if enable_sandbox is not None else self.enable_sandbox

        # Build hooks configuration (Phase 2.1)
        hooks_config = None
        if use_hooks and HOOKS_AVAILABLE and hook_manager:
            hooks_config = {
                'PreToolUse': [
                    # Security hooks for Bash commands
                    hook_manager.create_pre_tool_matcher('Bash'),
                    # Security hooks for file operations
                    hook_manager.create_pre_tool_matcher('Write'),
                    hook_manager.create_pre_tool_matcher('Edit'),
                ],
                'PostToolUse': [
                    # Logging hook for all tools
                    hook_manager.create_post_tool_matcher('*'),
                ]
            }

        # Build base allowed tools list
        allowed_tools = [
            # Core tools
            "Read", "Write", "Edit", "Bash",
            "Glob", "Grep",
            # Web tools
            "WebFetch", "WebSearch",
            # Agent tools
            "Task", "Skill",
            # Other
            "AskUserQuestion", "EnterPlanMode", "ExitPlanMode",
            "TaskCreate", "TaskUpdate", "TaskList", "TaskGet",
            # Notebook
            "NotebookEdit",
            # Todo
            "TodoWrite",
        ]

        # Add marketplace MCP tools if enabled (Phase 3.1)
        if use_mcp and MCP_AVAILABLE:
            allowed_tools.extend(get_marketplace_mcp_allowed_tools())

        # Build options with all SDK features
        options_kwargs = dict(
            cwd=self.cwd,
            permission_mode=self.permission_mode,
            plugins=self.plugins,
            agents=self.agents,
            setting_sources=["user", "project"],
            # CRITICAL: Enable streaming events for lifecycle visibility
            include_partial_messages=True,
            # Model configuration (Phase 1.1)
            model=use_model,
            fallback_model=self.FALLBACK_MODEL,
            # Safety limits (Phase 1.2 & 1.3)
            max_turns=use_max_turns,
            max_budget_usd=use_max_budget,
            # Extended thinking (Phase 1.4)
            max_thinking_tokens=self.DEFAULT_MAX_THINKING_TOKENS if use_thinking else None,
            # Allowed tools including MCP tools
            allowed_tools=allowed_tools,
        )

        # Add hooks if available (Phase 2.1)
        if hooks_config:
            options_kwargs['hooks'] = hooks_config

        # Add structured output format (Phase 2.3)
        if output_format:
            options_kwargs['output_format'] = output_format

        # Add file checkpointing (Phase 2.4)
        if enable_checkpointing:
            options_kwargs['enable_file_checkpointing'] = True

        # Add session management options (Phase 3.2)
        if session_id:
            options_kwargs['resume'] = session_id
        if continue_conversation:
            options_kwargs['continue_conversation'] = True

        # Add beta features (Phase 3.3)
        if use_betas:
            options_kwargs['betas'] = self.AVAILABLE_BETAS

        # Add sandbox configuration (Phase 3.4)
        if use_sandbox:
            options_kwargs['sandbox'] = {
                **self.DEFAULT_SANDBOX_CONFIG,
                'filesystem_root': self.cwd,
            }

        options = ClaudeAgentOptions(**options_kwargs)

        return options

    async def stream_query(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_turns: Optional[int] = None,
        max_budget_usd: Optional[float] = None,
        enable_thinking: Optional[bool] = None,
        output_format: Optional[dict] = None,
        enable_checkpointing: Optional[bool] = None,
        retry_config: Optional[RetryConfig] = None,
        resume_session_id: Optional[str] = None,
    ) -> AsyncIterator[dict]:
        """Stream a query through the SDK with marketplace agents/skills.

        Args:
            prompt: The user's prompt/question
            model: Override model for this query ('sonnet', 'opus', 'haiku')
            max_turns: Override max turns for this query
            max_budget_usd: Override max budget for this query
            enable_thinking: Override thinking for this query
            output_format: JSON schema for structured output (Phase 2.3)
            enable_checkpointing: Enable file checkpointing (Phase 2.4)
            retry_config: Retry configuration for transient errors (Phase 4.1)
            resume_session_id: Session ID to resume for conversation continuity

        Yields:
            Message dictionaries with type, content, tool info, etc.
        """
        if not SDK_AVAILABLE:
            yield {
                "type": "error",
                "error": SDKError(
                    code="sdk_not_installed",
                    message="claude-agent-sdk is not installed. Install with: pip install claude-agent-sdk",
                    retryable=False
                ).to_dict()
            }
            return

        options = self.get_options(
            model=model,
            max_turns=max_turns,
            max_budget_usd=max_budget_usd,
            enable_thinking=enable_thinking,
            output_format=output_format,
            enable_checkpointing=enable_checkpointing,
            session_id=resume_session_id,
        )

        if resume_session_id:
            print(f"[SDK Bridge] Resuming session: {resume_session_id}", file=sys.stderr)

        # Use default retry config if not provided
        config = retry_config or RetryConfig()
        attempt = 0
        last_error = None

        while attempt <= config.max_retries:
            try:
                async for message in query(prompt=prompt, options=options):
                    # Check for API errors in AssistantMessage (Phase 4.1)
                    msg_dict = self._message_to_dict(message)

                    # Check for error field in assistant messages
                    if hasattr(message, 'error') and message.error:
                        error = SDKError(
                            code='api_error',
                            message=str(message.error),
                            retryable=self._is_retryable_api_error(message.error)
                        )
                        msg_dict['error'] = error.to_dict()

                    yield msg_dict

                # Success - exit retry loop
                return

            except Exception as e:
                sdk_error = SDKError.from_exception(e)
                last_error = e

                # Check if we should retry
                if not sdk_error.retryable or attempt >= config.max_retries:
                    yield {
                        "type": "error",
                        "error": sdk_error.to_dict(),
                        "content": f"SDK error: {str(e)}"
                    }
                    return

                # Calculate delay
                if sdk_error.retry_after:
                    delay = sdk_error.retry_after
                else:
                    delay = min(
                        config.base_delay * (config.exponential_base ** attempt),
                        config.max_delay
                    )
                if config.jitter:
                    delay = delay * (0.5 + random.random())

                # Yield retry notification
                yield {
                    "type": "system",
                    "subtype": "retry",
                    "data": {
                        "attempt": attempt + 1,
                        "max_retries": config.max_retries,
                        "delay": delay,
                        "error": sdk_error.to_dict()
                    }
                }

                print(f"[SDK Bridge] Retry {attempt + 1}/{config.max_retries} "
                      f"after {delay:.1f}s: {sdk_error.code}", file=sys.stderr)

                await asyncio.sleep(delay)
                attempt += 1

    def _is_retryable_api_error(self, error: Any) -> bool:
        """Check if an API error is retryable.

        Args:
            error: The error object from the message

        Returns:
            True if the error is retryable
        """
        error_str = str(error).lower()
        return any(
            keyword in error_str
            for keyword in ['rate', 'limit', 'overload', 'timeout', 'capacity']
        )

    # =========================================================================
    # Phase 2.2: ClaudeSDKClient-based methods for session management
    # =========================================================================

    async def get_client(
        self,
        model: Optional[str] = None,
        max_turns: Optional[int] = None,
        max_budget_usd: Optional[float] = None,
        enable_thinking: Optional[bool] = None,
    ) -> Any:
        """Get or create an SDK client for session-based queries.

        Args:
            model: Override model setting
            max_turns: Override max turns setting
            max_budget_usd: Override max budget setting
            enable_thinking: Override thinking setting

        Returns:
            ClaudeSDKClient instance
        """
        if not CLIENT_AVAILABLE:
            raise RuntimeError("ClaudeSDKClient is not available in this SDK version")

        if self._client is None:
            options = self.get_options(
                model=model,
                max_turns=max_turns,
                max_budget_usd=max_budget_usd,
                enable_thinking=enable_thinking,
            )
            self._client = ClaudeSDKClient(options=options)
            await self._client.__aenter__()

        return self._client

    async def stream_query_with_client(
        self,
        prompt: str,
        session_id: Optional[str] = None,
        model: Optional[str] = None,
        max_turns: Optional[int] = None,
        max_budget_usd: Optional[float] = None,
        enable_thinking: Optional[bool] = None,
    ) -> AsyncIterator[dict]:
        """Stream a query using ClaudeSDKClient for session continuity.

        Args:
            prompt: The user's prompt/question
            session_id: Optional session ID to continue a conversation
            model: Override model for this query
            max_turns: Override max turns for this query
            max_budget_usd: Override max budget for this query
            enable_thinking: Override thinking for this query

        Yields:
            Message dictionaries with type, content, tool info, etc.
        """
        if not CLIENT_AVAILABLE:
            # Fall back to query-based approach
            async for msg in self.stream_query(
                prompt, model, max_turns, max_budget_usd, enable_thinking
            ):
                yield msg
            return

        try:
            client = await self.get_client(
                model=model,
                max_turns=max_turns,
                max_budget_usd=max_budget_usd,
                enable_thinking=enable_thinking,
            )

            async for message in client.query(prompt):
                msg_dict = self._message_to_dict(message)
                # Track session ID for continuity
                if 'session_id' in msg_dict and msg_dict['session_id']:
                    self._current_session_id = msg_dict['session_id']
                yield msg_dict

        except Exception as e:
            yield {
                "type": "error",
                "content": f"SDK client error: {str(e)}"
            }

    async def interrupt(self) -> bool:
        """Interrupt the current query.

        Returns:
            True if interrupt was sent, False if no active client
        """
        if self._client and CLIENT_AVAILABLE:
            try:
                await self._client.interrupt()
                return True
            except Exception as e:
                print(f"[SDK Bridge] Interrupt error: {e}", file=sys.stderr)
        return False

    async def close_client(self) -> None:
        """Close the SDK client."""
        if self._client:
            try:
                await self._client.__aexit__(None, None, None)
            except Exception as e:
                print(f"[SDK Bridge] Close error: {e}", file=sys.stderr)
            finally:
                self._client = None

    def get_current_session_id(self) -> Optional[str]:
        """Get the current session ID."""
        return self._current_session_id

    async def rewind_files(self, uuid: str) -> bool:
        """Rewind files to a previous checkpoint state (Phase 2.4).

        Args:
            uuid: The UUID of the user message to rewind to

        Returns:
            True if rewind was successful, False otherwise
        """
        if not CLIENT_AVAILABLE or not self._client:
            print("[SDK Bridge] Cannot rewind: no active client", file=sys.stderr)
            return False

        try:
            await self._client.rewind_files(uuid)
            print(f"[SDK Bridge] Files rewound to checkpoint: {uuid}", file=sys.stderr)
            return True
        except Exception as e:
            print(f"[SDK Bridge] Rewind error: {e}", file=sys.stderr)
            return False

    # =========================================================================
    # Phase 3.2: Session Management
    # =========================================================================

    async def create_session(
        self,
        model: Optional[str] = None,
        max_turns: Optional[int] = None,
        max_budget_usd: Optional[float] = None,
    ) -> str:
        """Create a new conversation session.

        Args:
            model: Model to use for this session
            max_turns: Max turns for this session
            max_budget_usd: Max budget for this session

        Returns:
            Session ID string
        """
        import uuid as uuid_lib
        session_id = str(uuid_lib.uuid4())[:8]

        if CLIENT_AVAILABLE:
            try:
                options = self.get_options(
                    model=model,
                    max_turns=max_turns,
                    max_budget_usd=max_budget_usd,
                )
                client = ClaudeSDKClient(options=options)
                await client.__aenter__()
                self._sessions[session_id] = {
                    'client': client,
                    'created_at': __import__('datetime').datetime.now().isoformat(),
                    'model': model or self.model,
                    'message_count': 0,
                }
                print(f"[SDK Bridge] Session created: {session_id}", file=sys.stderr)
            except Exception as e:
                print(f"[SDK Bridge] Session creation error: {e}", file=sys.stderr)
                raise

        return session_id

    async def continue_session(
        self,
        session_id: str,
        prompt: str,
    ) -> AsyncIterator[dict]:
        """Continue an existing conversation session.

        Args:
            session_id: The session to continue
            prompt: The new prompt

        Yields:
            Message dictionaries
        """
        if session_id not in self._sessions:
            yield {
                "type": "error",
                "content": f"Session {session_id} not found"
            }
            return

        session = self._sessions[session_id]
        client = session.get('client')

        if not client:
            yield {
                "type": "error",
                "content": f"Session {session_id} has no active client"
            }
            return

        try:
            async for message in client.query(prompt):
                msg_dict = self._message_to_dict(message)
                yield msg_dict

            # Update message count
            session['message_count'] = session.get('message_count', 0) + 1

        except Exception as e:
            yield {
                "type": "error",
                "content": f"Session error: {str(e)}"
            }

    async def fork_session(self, session_id: str) -> str:
        """Fork an existing session to create a new branch.

        Args:
            session_id: The session to fork

        Returns:
            New session ID
        """
        if session_id not in self._sessions:
            raise ValueError(f"Session {session_id} not found")

        import uuid as uuid_lib
        new_session_id = str(uuid_lib.uuid4())[:8]

        if CLIENT_AVAILABLE:
            try:
                options = self.get_options(
                    session_id=session_id,
                )
                # Add fork flag
                options.fork_session = True

                client = ClaudeSDKClient(options=options)
                await client.__aenter__()

                self._sessions[new_session_id] = {
                    'client': client,
                    'created_at': __import__('datetime').datetime.now().isoformat(),
                    'forked_from': session_id,
                    'message_count': 0,
                }
                print(f"[SDK Bridge] Session forked: {session_id} -> {new_session_id}", file=sys.stderr)
            except Exception as e:
                print(f"[SDK Bridge] Session fork error: {e}", file=sys.stderr)
                raise

        return new_session_id

    async def close_session(self, session_id: str) -> bool:
        """Close a specific session.

        Args:
            session_id: The session to close

        Returns:
            True if closed successfully
        """
        if session_id not in self._sessions:
            return False

        session = self._sessions.pop(session_id)
        client = session.get('client')

        if client:
            try:
                await client.__aexit__(None, None, None)
                print(f"[SDK Bridge] Session closed: {session_id}", file=sys.stderr)
            except Exception as e:
                print(f"[SDK Bridge] Session close error: {e}", file=sys.stderr)

        return True

    def list_sessions(self) -> list[dict]:
        """List all active sessions.

        Returns:
            List of session info dicts
        """
        return [
            {
                'session_id': sid,
                'created_at': session.get('created_at'),
                'model': session.get('model'),
                'message_count': session.get('message_count', 0),
                'forked_from': session.get('forked_from'),
            }
            for sid, session in self._sessions.items()
        ]

    async def cleanup_sessions(self, max_age_hours: int = 24) -> int:
        """Clean up old sessions.

        Args:
            max_age_hours: Maximum age in hours before cleanup

        Returns:
            Number of sessions cleaned up
        """
        from datetime import datetime, timedelta

        cutoff = datetime.now() - timedelta(hours=max_age_hours)
        to_close = []

        for session_id, session in self._sessions.items():
            created_str = session.get('created_at', '')
            if created_str:
                try:
                    created = datetime.fromisoformat(created_str)
                    if created < cutoff:
                        to_close.append(session_id)
                except ValueError:
                    pass

        for session_id in to_close:
            await self.close_session(session_id)

        return len(to_close)

    def _message_to_dict(self, message: Any) -> dict:
        """Convert SDK message to dictionary.

        Handles all SDK message types including:
        - AssistantMessage: Complete assistant responses with content blocks
        - UserMessage: User input and tool results
        - SystemMessage: System metadata
        - ResultMessage: Final result with cost/usage
        - StreamEvent: Real-time streaming events (when include_partial_messages=True)
        """
        msg_type = getattr(message, 'type', None)
        msg_type_str = str(msg_type) if msg_type else ''

        # Debug: print message structure for development
        print(f"[SDK Bridge] Message type: {msg_type}, class: {type(message).__name__}", file=sys.stderr)

        # Handle StreamEvent (partial messages during streaming)
        # These provide real-time lifecycle visibility
        if type(message).__name__ == 'StreamEvent' or 'StreamEvent' in msg_type_str:
            event = getattr(message, 'event', {})
            event_type = event.get('type', '') if isinstance(event, dict) else ''
            parent_tool_use_id = getattr(message, 'parent_tool_use_id', None)

            # Extract event details
            result = {
                "type": "stream_event",
                "event_type": event_type,
                "parent_tool_use_id": parent_tool_use_id,
                "session_id": getattr(message, 'session_id', None),
            }

            # Handle specific stream event types
            if event_type == 'content_block_start':
                content_block = event.get('content_block', {})
                block_type = content_block.get('type', '')
                result['block_type'] = block_type
                result['block_index'] = event.get('index', 0)

                if block_type == 'tool_use':
                    result['tool_name'] = content_block.get('name', '')
                    result['tool_id'] = content_block.get('id', '')
                elif block_type == 'thinking':
                    result['thinking_start'] = True

            elif event_type == 'content_block_delta':
                delta = event.get('delta', {})
                delta_type = delta.get('type', '')
                result['delta_type'] = delta_type
                result['block_index'] = event.get('index', 0)

                if delta_type == 'text_delta':
                    result['text'] = delta.get('text', '')
                elif delta_type == 'input_json_delta':
                    result['partial_json'] = delta.get('partial_json', '')
                elif delta_type == 'thinking_delta':
                    result['thinking'] = delta.get('thinking', '')

            elif event_type == 'content_block_stop':
                result['block_index'] = event.get('index', 0)
                result['block_complete'] = True

            elif event_type == 'message_start':
                msg = event.get('message', {})
                result['model'] = msg.get('model', '')
                result['message_id'] = msg.get('id', '')

            elif event_type == 'message_delta':
                delta = event.get('delta', {})
                result['stop_reason'] = delta.get('stop_reason', '')
                usage = event.get('usage', {})
                if usage:
                    result['usage'] = usage

            elif event_type == 'message_stop':
                result['message_complete'] = True

            return result

        # Handle AssistantMessage (complete responses)
        if msg_type == 'assistant' or 'ASSISTANT' in msg_type_str:
            content = getattr(message, 'content', [])
            text_parts = []
            tool_uses = []
            thinking_blocks = []

            if isinstance(content, list):
                for block in content:
                    block_type = getattr(block, 'type', None) or type(block).__name__

                    if hasattr(block, 'text'):
                        text_parts.append(block.text)
                    elif block_type == 'tool_use' or 'ToolUse' in str(type(block)):
                        tool_uses.append({
                            'id': getattr(block, 'id', None),
                            'name': getattr(block, 'name', None),
                            'input': getattr(block, 'input', None),
                        })
                    elif block_type == 'thinking' or hasattr(block, 'thinking'):
                        thinking_blocks.append({
                            'thinking': getattr(block, 'thinking', ''),
                            'signature': getattr(block, 'signature', ''),
                        })

            return {
                "type": "assistant",
                "content": '\n'.join(text_parts) if text_parts else '',
                "tool_uses": tool_uses if tool_uses else None,
                "thinking": thinking_blocks if thinking_blocks else None,
                "model": getattr(message, 'model', None)
            }

        # Handle UserMessage (user input and tool results)
        elif msg_type == 'user' or 'USER' in msg_type_str:
            # Extract UUID for file checkpointing (Phase 2.4)
            message_uuid = getattr(message, 'uuid', None)

            content = getattr(message, 'content', [])
            if isinstance(content, list):
                # Tool results
                results = []
                text_parts = []
                for block in content:
                    block_type = getattr(block, 'type', None) or type(block).__name__

                    if block_type == 'tool_result' or 'ToolResult' in str(type(block)):
                        result_content = getattr(block, 'content', None)
                        # Handle content that may be a list of blocks
                        if isinstance(result_content, list):
                            result_text = []
                            for item in result_content:
                                if hasattr(item, 'text'):
                                    result_text.append(item.text)
                                elif isinstance(item, dict) and 'text' in item:
                                    result_text.append(item['text'])
                            result_content = '\n'.join(result_text)

                        results.append({
                            'tool_use_id': getattr(block, 'tool_use_id', None),
                            'content': str(result_content) if result_content else None,
                            'is_error': getattr(block, 'is_error', False),
                        })
                    elif hasattr(block, 'text'):
                        text_parts.append(block.text)

                if results:
                    return {
                        "type": "tool_result",
                        "results": results,
                        "text": '\n'.join(text_parts) if text_parts else None,
                        "uuid": message_uuid,  # For file checkpointing (Phase 2.4)
                    }

            return {
                "type": "user",
                "content": str(content),
                "uuid": message_uuid,  # For file checkpointing (Phase 2.4)
            }

        # Handle SystemMessage
        elif msg_type == 'system' or 'SYSTEM' in msg_type_str:
            return {
                "type": "system",
                "subtype": getattr(message, 'subtype', None),
                "data": getattr(message, 'data', None)
            }

        # Handle ResultMessage (final result with cost info)
        elif msg_type == 'result' or type(message).__name__ == 'ResultMessage':
            return {
                "type": "result",
                "subtype": getattr(message, 'subtype', None),
                "result": getattr(message, 'result', None),
                "is_error": getattr(message, 'is_error', False),
                "num_turns": getattr(message, 'num_turns', None),
                "duration_ms": getattr(message, 'duration_ms', None),
                "duration_api_ms": getattr(message, 'duration_api_ms', None),
                "total_cost_usd": getattr(message, 'total_cost_usd', None),
                "session_id": getattr(message, 'session_id', None),
                "usage": getattr(message, 'usage', None),
            }

        # Fallback for unknown types - still try to extract useful info
        result = {"type": str(msg_type) if msg_type else "unknown"}

        if hasattr(message, 'content'):
            content = message.content
            if isinstance(content, list):
                texts = []
                tool_uses = []
                for b in content:
                    if hasattr(b, 'text'):
                        texts.append(b.text)
                    elif hasattr(b, 'name') and hasattr(b, 'input'):
                        tool_uses.append({
                            'name': b.name,
                            'input': b.input,
                            'id': getattr(b, 'id', None)
                        })
                if texts:
                    result['content'] = '\n'.join(texts)
                if tool_uses:
                    result['tool_uses'] = tool_uses
            else:
                result['content'] = str(content)

        return result

    def list_agents(self) -> list[dict]:
        """List all loaded agents."""
        return [
            {
                "name": name,
                "description": agent.description if hasattr(agent, 'description') else "",
                "tools": agent.tools if hasattr(agent, 'tools') else []
            }
            for name, agent in self.agents.items()
        ]

    def list_plugins(self) -> list[dict]:
        """List all loaded plugins."""
        return self.plugins

    def get_hook_stats(self) -> dict:
        """Get hook system statistics.

        Returns:
            Dict with hook stats or empty dict if hooks unavailable
        """
        if HOOKS_AVAILABLE and hook_manager:
            return hook_manager.get_stats()
        return {}

    def get_hook_logs(self, count: int = 20) -> list[dict]:
        """Get recent hook logs.

        Args:
            count: Number of log entries to return

        Returns:
            List of log entries
        """
        if HOOKS_AVAILABLE and hook_manager:
            return hook_manager.get_recent_logs(count)
        return []


# CLI for testing
if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Marketplace SDK Bridge')
    parser.add_argument('--cwd', default='.', help='Working directory')
    parser.add_argument('--marketplace', help='Marketplace path')
    parser.add_argument('--list-agents', action='store_true', help='List agents')
    parser.add_argument('--list-plugins', action='store_true', help='List plugins')
    parser.add_argument('--query', help='Query to send')

    args = parser.parse_args()

    bridge = MarketplaceSDKBridge(
        cwd=args.cwd,
        marketplace_path=args.marketplace
    )

    if args.list_agents:
        print("Loaded Agents:")
        for agent in bridge.list_agents():
            print(f"  - {agent['name']}: {agent['description'][:50]}...")

    elif args.list_plugins:
        print("Loaded Plugins:")
        for plugin in bridge.list_plugins():
            print(f"  - {plugin['path']}")

    elif args.query:
        async def run_query():
            async for msg in bridge.stream_query(args.query):
                print(msg)

        asyncio.run(run_query())

    else:
        parser.print_help()
