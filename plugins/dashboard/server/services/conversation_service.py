#!/usr/bin/env python3
"""Conversation Service - Native Claude SDK integration.

This service provides direct Claude SDK usage for browser-based conversations.
Uses the native claude_agent_sdk types for proper streaming and message handling.
"""

import asyncio
import os
import sys
from pathlib import Path
from typing import AsyncGenerator, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone

# Try to import Claude SDK
try:
    from claude_agent_sdk import query, ClaudeAgentOptions
    SDK_AVAILABLE = True
except ImportError:
    SDK_AVAILABLE = False
    print("[ConversationService] claude_agent_sdk not installed", file=sys.stderr)


@dataclass
class ConversationSettings:
    """Settings for a conversation query - maps to ClaudeAgentOptions."""
    model: str = "sonnet"
    max_turns: int = 50
    enable_thinking: bool = True
    max_thinking_tokens: int = 16000
    permission_mode: str = "default"  # default, acceptEdits, bypassPermissions
    system_prompt: Optional[str] = None
    include_partial_messages: bool = True  # For streaming events


class ConversationService:
    """Conversation service using native Claude SDK.

    Executes Claude queries from the project root directory,
    giving it access to project agents, skills, and context.
    """

    # Model mapping to SDK model names
    MODEL_MAP = {
        "sonnet": "sonnet",
        "opus": "opus",
        "haiku": "haiku"
    }

    def __init__(self, project_root: str, debug: bool = False):
        """Initialize the conversation service.

        Args:
            project_root: The project root directory (where .git lives)
            debug: Enable debug logging
        """
        self.project_root = Path(project_root)
        self.debug = debug
        self._current_task: Optional[asyncio.Task] = None

        if debug:
            print(f"[ConversationService] Initialized with project_root={project_root}")
            print(f"[ConversationService] SDK available: {SDK_AVAILABLE}")

    @property
    def sdk_available(self) -> bool:
        """Check if SDK is available."""
        return SDK_AVAILABLE

    async def send_message(
        self,
        message: str,
        settings: ConversationSettings = None,
        context_id: Optional[str] = None
    ) -> AsyncGenerator[dict, None]:
        """Send a message and stream the response using native SDK.

        Args:
            message: The user's message
            settings: Query settings (model, thinking, etc.)
            context_id: Optional context identifier (changeset, session, etc.)

        Yields:
            Event dictionaries with type and content:
            - {type: "start", ...}
            - {type: "text", content: "...", ...}  # Streaming text
            - {type: "tool_start", tool: "...", ...}
            - {type: "tool_result", tool: "...", result: "...", ...}
            - {type: "thinking", content: "...", ...}
            - {type: "assistant", content: "...", ...}  # Complete message
            - {type: "error", content: "...", ...}
            - {type: "end", ...}
        """
        if not SDK_AVAILABLE:
            yield {
                "type": "error",
                "content": "Claude SDK not installed. Install with: pip install claude-agent-sdk",
                "context_id": context_id,
                "timestamp": self._timestamp()
            }
            return

        settings = settings or ConversationSettings()

        # Build SDK options
        options = self._build_options(settings)

        if self.debug:
            print(f"[ConversationService] Sending message with model={settings.model}")

        # Yield start event
        yield {
            "type": "start",
            "context_id": context_id,
            "timestamp": self._timestamp()
        }

        try:
            # Change to project root for context
            original_cwd = os.getcwd()
            os.chdir(str(self.project_root))

            accumulated_text = ""
            got_assistant_event = False  # Track if SDK sent a complete assistant message

            try:
                # Stream using native SDK
                async for event in query(prompt=message, options=options):
                    # Process SDK event and yield our event format
                    async for our_event in self._process_sdk_event(event, context_id):
                        event_type = our_event.get("type")
                        # Track accumulated text for streaming
                        if event_type == "text":
                            accumulated_text += our_event.get("content", "")
                        elif event_type == "assistant":
                            # SDK sent complete message - mark it and clear accumulated
                            got_assistant_event = True
                            accumulated_text = ""
                        yield our_event

            finally:
                os.chdir(original_cwd)

            # Only emit fallback assistant message if SDK didn't send one
            # and we have accumulated streaming text
            if not got_assistant_event and accumulated_text:
                yield {
                    "type": "assistant",
                    "content": accumulated_text,
                    "context_id": context_id,
                    "timestamp": self._timestamp()
                }

        except Exception as e:
            if self.debug:
                import traceback
                traceback.print_exc()
            yield {
                "type": "error",
                "content": str(e),
                "context_id": context_id,
                "timestamp": self._timestamp()
            }

        # Yield end event
        yield {
            "type": "end",
            "context_id": context_id,
            "timestamp": self._timestamp()
        }

    def _build_options(self, settings: ConversationSettings) -> 'ClaudeAgentOptions':
        """Build ClaudeAgentOptions from settings."""
        options_kwargs = {
            "max_turns": settings.max_turns,
            "include_partial_messages": settings.include_partial_messages,
            # Enable all setting sources for full agent/skill discovery
            # user=~/.claude/, project=.claude/, local=cwd context
            "setting_sources": ["user", "project", "local"],
        }

        # Model
        if settings.model:
            options_kwargs["model"] = self.MODEL_MAP.get(settings.model, settings.model)

        # Extended thinking (SDK uses max_thinking_tokens directly)
        if settings.enable_thinking and settings.max_thinking_tokens:
            options_kwargs["max_thinking_tokens"] = settings.max_thinking_tokens

        # Permission mode
        if settings.permission_mode == "acceptEdits":
            options_kwargs["permission_mode"] = "acceptEdits"
        elif settings.permission_mode == "bypassPermissions":
            options_kwargs["permission_mode"] = "bypassPermissions"

        # System prompt
        if settings.system_prompt:
            options_kwargs["system_prompt"] = settings.system_prompt

        # Working directory
        options_kwargs["cwd"] = str(self.project_root)

        return ClaudeAgentOptions(**options_kwargs)

    async def _process_sdk_event(
        self,
        event: Any,
        context_id: Optional[str]
    ) -> AsyncGenerator[dict, None]:
        """Process a native SDK event and yield our event format.

        The SDK can return various message types:
        - StreamEvent: Partial streaming events
        - AssistantMessage: Complete assistant messages
        - ToolUseMessage: Tool invocations
        - ToolResultMessage: Tool results
        """
        timestamp = self._timestamp()

        # Get event type (SDK messages have a 'type' attribute)
        event_type = getattr(event, 'type', None) or type(event).__name__

        if self.debug:
            print(f"[ConversationService] SDK event: {event_type}, attrs: {dir(event)}")
            # Log all attributes for debugging
            for attr in ['event_type', 'text', 'content', 'name', 'id', 'tool_use_id']:
                if hasattr(event, attr):
                    print(f"  {attr}: {getattr(event, attr)!r}")

        # Handle different SDK message types
        if event_type == 'stream_event' or hasattr(event, 'event_type'):
            # StreamEvent - partial streaming
            stream_type = getattr(event, 'event_type', None)

            if stream_type == 'text':
                yield {
                    "type": "text",
                    "content": getattr(event, 'text', ''),
                    "context_id": context_id,
                    "timestamp": timestamp
                }
            elif stream_type == 'thinking':
                yield {
                    "type": "thinking",
                    "content": getattr(event, 'text', ''),
                    "context_id": context_id,
                    "timestamp": timestamp
                }
            elif stream_type == 'tool_start':
                yield {
                    "type": "tool_start",
                    "tool": getattr(event, 'tool_name', 'unknown'),
                    "tool_id": getattr(event, 'tool_use_id', None),
                    "context_id": context_id,
                    "timestamp": timestamp
                }
            elif stream_type == 'tool_result':
                yield {
                    "type": "tool_result",
                    "tool": getattr(event, 'tool_name', 'unknown'),
                    "tool_id": getattr(event, 'tool_use_id', None),
                    "result": getattr(event, 'result', ''),
                    "context_id": context_id,
                    "timestamp": timestamp
                }

        elif event_type == 'assistant' or hasattr(event, 'content'):
            # AssistantMessage - complete message
            content = getattr(event, 'content', '')
            if isinstance(content, list):
                # Content blocks
                text_parts = []
                for block in content:
                    if hasattr(block, 'text'):
                        text_parts.append(block.text)
                    elif isinstance(block, dict) and 'text' in block:
                        text_parts.append(block['text'])
                content = ''.join(text_parts)

            # Only emit non-empty assistant messages
            if content:
                yield {
                    "type": "assistant",
                    "content": content,
                    "context_id": context_id,
                    "timestamp": timestamp
                }

        elif event_type == 'tool_use':
            # Tool invocation
            yield {
                "type": "tool_start",
                "tool": getattr(event, 'name', 'unknown'),
                "tool_id": getattr(event, 'id', None),
                "input": getattr(event, 'input', {}),
                "context_id": context_id,
                "timestamp": timestamp
            }

        elif event_type == 'tool_result':
            # Tool result
            yield {
                "type": "tool_result",
                "tool_id": getattr(event, 'tool_use_id', None),
                "result": getattr(event, 'content', ''),
                "context_id": context_id,
                "timestamp": timestamp
            }

        elif event_type == 'user':
            # User message echo - skip
            pass

        else:
            # Unknown event type - log but don't yield
            if self.debug:
                print(f"[ConversationService] Unknown event type: {event_type}")

    def cancel(self) -> bool:
        """Cancel the active query.

        Returns:
            True if a task was cancelled, False otherwise
        """
        if self._current_task and not self._current_task.done():
            self._current_task.cancel()
            return True
        return False

    def _timestamp(self) -> str:
        """Get current ISO timestamp."""
        return datetime.now(timezone.utc).isoformat()


# Singleton instance
_conversation_service: Optional[ConversationService] = None


def get_conversation_service(project_root: str = None, debug: bool = False) -> ConversationService:
    """Get or create the conversation service singleton.

    Args:
        project_root: Project root directory. Required on first call.
        debug: Enable debug logging

    Returns:
        ConversationService instance
    """
    global _conversation_service

    if _conversation_service is None:
        if project_root is None:
            raise ValueError("project_root required on first initialization")
        _conversation_service = ConversationService(project_root, debug)

    return _conversation_service
