"""Native Claude Agent SDK service — thin wrapper for dashboard API.

Replaces the deprecated MarketplaceSDKBridge with direct SDK calls. The SDK
natively supports agent/skill discovery via the ``setting_sources`` option, so
no manual plugin loading is needed here.

Usage::

    options = build_options(request_data, cwd)
    async for msg in stream_query(prompt, options):
        send_sse(msg)
"""

from __future__ import annotations

import os
import sys
from typing import AsyncIterator, Optional

# ---------------------------------------------------------------------------
# SDK availability guard
# ---------------------------------------------------------------------------

try:
    from claude_agent_sdk import (
        query,
        ClaudeAgentOptions,
        AssistantMessage,
        SystemMessage,
        ResultMessage,
        UserMessage,
        TextBlock,
        ToolUseBlock,
        ThinkingBlock,
        ToolResultBlock,
    )
    from claude_agent_sdk.types import StreamEvent
    SDK_AVAILABLE = True
except ImportError:
    SDK_AVAILABLE = False
    print(
        "[sdk_service] claude-agent-sdk not installed. "
        "Install with: pip install claude-agent-sdk",
        file=sys.stderr,
    )

    # Provide stub types so the module is importable even without the SDK.
    # These are only used for isinstance() checks, which will always be False
    # at runtime when the real SDK is absent.
    class _Stub:  # noqa: N801
        pass

    query = None  # type: ignore[assignment]
    ClaudeAgentOptions = _Stub  # type: ignore[assignment,misc]
    AssistantMessage = _Stub  # type: ignore[assignment,misc]
    SystemMessage = _Stub  # type: ignore[assignment,misc]
    ResultMessage = _Stub  # type: ignore[assignment,misc]
    UserMessage = _Stub  # type: ignore[assignment,misc]
    TextBlock = _Stub  # type: ignore[assignment,misc]
    ToolUseBlock = _Stub  # type: ignore[assignment,misc]
    ThinkingBlock = _Stub  # type: ignore[assignment,misc]
    ToolResultBlock = _Stub  # type: ignore[assignment,misc]
    StreamEvent = _Stub  # type: ignore[assignment,misc]

# Try to import SandboxSettings — it may not be present in all SDK versions.
try:
    from claude_agent_sdk import SandboxSettings  # type: ignore[import]
    SANDBOX_AVAILABLE = True
except ImportError:
    SANDBOX_AVAILABLE = False
    SandboxSettings = None  # type: ignore[assignment,misc]


# ---------------------------------------------------------------------------
# Project root discovery
# ---------------------------------------------------------------------------

def _find_project_root(start_path: Optional[str] = None) -> str:
    """Walk up from *start_path* looking for a .git directory.

    Falls back to *start_path* (or ``os.getcwd()``) when no git root is found.
    """
    if start_path is None:
        start_path = os.path.dirname(os.path.abspath(__file__))

    current = os.path.abspath(start_path)
    while current != os.path.dirname(current):  # stop at filesystem root
        if os.path.isdir(os.path.join(current, ".git")):
            return current
        current = os.path.dirname(current)

    # No .git found — return the original start path
    return start_path


# Resolve once at import time for the common case.
_DEFAULT_CWD: str = _find_project_root()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_options(data: dict, cwd: str) -> "ClaudeAgentOptions":  # type: ignore[return]
    """Convert an HTTP request body dict into a :class:`ClaudeAgentOptions`.

    Args:
        data:  Parsed JSON body from the incoming request.
        cwd:   Working directory Claude should operate in (usually project root).

    Returns:
        A fully-populated :class:`ClaudeAgentOptions` instance ready to pass
        to :func:`stream_query`.

    Raises:
        RuntimeError: If the SDK is not installed.
    """
    if not SDK_AVAILABLE:
        raise RuntimeError(
            "claude-agent-sdk is not installed. "
            "Run: pip install claude-agent-sdk"
        )

    # --- thinking tokens -------------------------------------------------------
    enable_thinking: bool = bool(data.get("enable_thinking", False))
    if enable_thinking:
        max_thinking_tokens: Optional[int] = int(
            data.get("max_thinking_tokens") or 16000
        )
    else:
        max_thinking_tokens = None

    # --- sandbox ---------------------------------------------------------------
    sandbox: Optional[object] = None
    if data.get("sandbox_mode") and SANDBOX_AVAILABLE and SandboxSettings is not None:
        try:
            sandbox = SandboxSettings(
                network_config={"allow_network": True}
            )
        except Exception as exc:  # pragma: no cover
            print(
                f"[sdk_service] Could not construct SandboxSettings: {exc}",
                file=sys.stderr,
            )

    # --- permission mode -------------------------------------------------------
    permission_mode: Optional[str] = data.get("permission_mode")

    # --- disallowed tools (mcp_tools=False disables all MCP) ------------------
    # The SDK accepts a string pattern for disallowed_tools.
    # When mcp_tools is explicitly False, exclude all mcp__ prefixed tools.
    disallowed_tools: Optional[str] = None
    if data.get("mcp_tools") is False:
        disallowed_tools = "mcp__.*"

    # --- assemble options -------------------------------------------------------
    # Stripped to minimum. Add back one at a time to find memory culprit.
    # NOTE: Do NOT pass cwd=project_root. The Claude CLI loads all plugins,
    # CLAUDE.md, and settings from cwd, which for this marketplace project
    # means 10+ plugins / 82 agents / 128 skills — causing memory explosion.
    kwargs: dict = dict(
        model=data.get("model") or "sonnet",
        max_turns=int(data.get("max_turns") or 50),
        permission_mode=permission_mode or "bypassPermissions",
        include_partial_messages=True,
    )

    if data.get("max_budget_usd") is not None:
        kwargs["max_budget_usd"] = float(data["max_budget_usd"])

    if data.get("resume"):
        kwargs["resume"] = data["resume"]

    if max_thinking_tokens is not None:
        kwargs["max_thinking_tokens"] = max_thinking_tokens

    if data.get("system_prompt"):
        kwargs["system_prompt"] = data["system_prompt"]

    return ClaudeAgentOptions(**kwargs)


def serialize_message(message: object) -> Optional[dict]:
    """Serialize any SDK message type to a JSON-safe dict.

    Uses ``isinstance()`` checks against real SDK types — no string-based
    type detection.

    Args:
        message: A message yielded by :func:`claude_agent_sdk.query`.

    Returns:
        A dict suitable for JSON serialisation, or ``None`` if the message
        type is unrecognised.
    """
    # --- StreamEvent (real-time partial messages) --------------------------------
    if isinstance(message, StreamEvent):
        event = message.event
        event_type = event.get("type", "")
        result = {
            "type": "stream_event",
            "event_type": event_type,
            "session_id": message.session_id,
            "parent_tool_use_id": message.parent_tool_use_id,
        }

        if event_type == "content_block_start":
            cb = event.get("content_block", {})
            result["block_type"] = cb.get("type")
            result["block_index"] = event.get("index")
            if cb.get("type") == "tool_use":
                result["tool_name"] = cb.get("name")
                result["tool_id"] = cb.get("id")
            elif cb.get("type") == "thinking":
                result["thinking_start"] = True

        elif event_type == "content_block_delta":
            delta = event.get("delta", {})
            delta_type = delta.get("type", "")
            result["delta_type"] = delta_type
            result["block_index"] = event.get("index")
            if delta_type == "text_delta":
                result["text"] = delta.get("text", "")
            elif delta_type == "thinking_delta":
                result["thinking"] = delta.get("thinking", "")
            elif delta_type == "input_json_delta":
                result["partial_json"] = delta.get("partial_json", "")

        elif event_type == "content_block_stop":
            result["block_index"] = event.get("index")

        elif event_type == "message_start":
            msg = event.get("message", {})
            result["model"] = msg.get("model")
            result["message_id"] = msg.get("id")

        elif event_type == "message_delta":
            delta = event.get("delta", {})
            result["stop_reason"] = delta.get("stop_reason")
            usage = event.get("usage")
            if usage:
                result["usage"] = usage

        return result

    # --- AssistantMessage ------------------------------------------------------
    if isinstance(message, AssistantMessage):
        blocks: list[dict] = []
        for block in message.content:
            if isinstance(block, TextBlock):
                blocks.append({"type": "text", "text": block.text})
            elif isinstance(block, ThinkingBlock):
                blocks.append({"type": "thinking", "thinking": block.thinking})
            elif isinstance(block, ToolUseBlock):
                blocks.append({
                    "type": "tool_use",
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                })
            elif isinstance(block, ToolResultBlock):
                blocks.append({
                    "type": "tool_result",
                    "tool_use_id": block.tool_use_id,
                    "content": block.content,
                    "is_error": block.is_error,
                })

        joined_text: str = "".join(
            b["text"] for b in blocks if b["type"] == "text"
        )

        # Build merged tool_calls (tool_use + tool_result pairs)
        tool_uses = [b for b in blocks if b["type"] == "tool_use"]
        tool_results = {b["tool_use_id"]: b for b in blocks if b["type"] == "tool_result"}
        tool_calls = []
        for tu in tool_uses:
            tr = tool_results.get(tu["id"])
            tool_calls.append({
                "id": tu["id"], "name": tu["name"], "input": tu["input"],
                "result": tr["content"] if tr else None,
                "is_error": tr["is_error"] if tr else False,
                "status": ("error" if tr["is_error"] else "success") if tr else "complete",
            })

        return {
            "type": "assistant",
            "role": "assistant",
            "id": None,
            "timestamp": None,
            "content": joined_text,
            "blocks": blocks,
            "tool_calls": tool_calls,
            "model": getattr(message, "model", None),
            "usage": None,  # populated by ResultMessage
            "error": getattr(message, "error", None),
        }

    # --- SystemMessage ---------------------------------------------------------
    if isinstance(message, SystemMessage):
        return {
            "type": "system",
            "subtype": getattr(message, "subtype", None),
            "data": getattr(message, "data", {}),
        }

    # --- ResultMessage ---------------------------------------------------------
    if isinstance(message, ResultMessage):
        return {
            "type": "result",
            "subtype": getattr(message, "subtype", None),
            "session_id": getattr(message, "session_id", None),
            "total_cost_usd": getattr(message, "total_cost_usd", None),
            "usage": getattr(message, "usage", None),
            "duration_ms": getattr(message, "duration_ms", None),
            "duration_api_ms": getattr(message, "duration_api_ms", None),
            "is_error": getattr(message, "is_error", False),
            "num_turns": getattr(message, "num_turns", None),
            "result": getattr(message, "result", None),
        }

    # --- UserMessage -----------------------------------------------------------
    if isinstance(message, UserMessage):
        blocks = []
        for block in getattr(message, "content", []):
            if isinstance(block, ToolResultBlock):
                blocks.append({
                    "type": "tool_result",
                    "tool_use_id": block.tool_use_id,
                    "content": block.content,
                    "is_error": block.is_error,
                })
            elif isinstance(block, TextBlock):
                blocks.append({"type": "text", "text": block.text})

        joined_text = "".join(b["text"] for b in blocks if b["type"] == "text")
        return {
            "type": "user",
            "role": "user",
            "id": None,
            "timestamp": None,
            "blocks": blocks,
            "content": joined_text,
            "tool_calls": [],
            "model": None,
            "usage": None,
        }

    # Unrecognised type — log and skip
    print(
        f"[sdk_service] Unrecognised message type: {type(message).__name__}",
        file=sys.stderr,
    )
    return None


async def stream_query(
    prompt: str,
    options: "ClaudeAgentOptions",
) -> AsyncIterator[dict]:
    """Async generator that yields serialised SDK messages for a single query.

    Args:
        prompt:  The user prompt to send to Claude.
        options: Fully-built :class:`ClaudeAgentOptions`.

    Yields:
        Serialised message dicts (as returned by :func:`serialize_message`).

    Raises:
        RuntimeError: If the SDK is not installed.
    """
    if not SDK_AVAILABLE or query is None:
        raise RuntimeError(
            "claude-agent-sdk is not installed. "
            "Run: pip install claude-agent-sdk"
        )

    async for message in query(prompt=prompt, options=options):
        serialized = serialize_message(message)
        if serialized is not None:
            yield serialized
