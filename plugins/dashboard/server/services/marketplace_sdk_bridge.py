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
from pathlib import Path
from typing import AsyncIterator, Optional, Any
from dataclasses import dataclass

# Note: Install with: pip install claude-agent-sdk pyyaml
try:
    from claude_agent_sdk import query, ClaudeAgentOptions, AgentDefinition
    SDK_AVAILABLE = True
except ImportError:
    SDK_AVAILABLE = False
    print("[MarketplaceSDKBridge] claude-agent-sdk not installed. "
          "Install with: pip install claude-agent-sdk", file=sys.stderr)

try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False


@dataclass
class ParsedAgent:
    """Parsed agent from marketplace format."""
    name: str
    description: str
    prompt: str
    tools: list[str]


class MarketplaceSDKBridge:
    """Bridge for querying Claude with marketplace agents and skills.

    This bridge:
    1. Discovers all plugins in the marketplace
    2. Loads agents from plugin agents/ directories
    3. Configures the SDK with all agents and skills
    4. Streams responses back for real-time display
    """

    def __init__(
        self,
        cwd: str,
        marketplace_path: Optional[str] = None,
        permission_mode: str = 'acceptEdits'
    ):
        """Initialize the marketplace SDK bridge.

        Args:
            cwd: Working directory for Claude operations (your project path)
            marketplace_path: Path to claude-marketplace repo (defaults to cwd)
            permission_mode: Permission mode ('default', 'acceptEdits', 'bypassPermissions')
        """
        self.cwd = cwd
        self.marketplace_path = marketplace_path or cwd
        self.permission_mode = permission_mode

        # Discover plugins and agents
        self.plugins: list[dict] = []
        self.agents: dict[str, Any] = {}

        if SDK_AVAILABLE:
            self.plugins = self._discover_plugins()
            self.agents = self._load_all_agents()
            print(f"[MarketplaceSDKBridge] Loaded {len(self.plugins)} plugins, "
                  f"{len(self.agents)} agents", file=sys.stderr)

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

    def get_options(self) -> Any:
        """Get ClaudeAgentOptions with all marketplace configuration."""
        if not SDK_AVAILABLE:
            raise RuntimeError("claude-agent-sdk is not installed")

        return ClaudeAgentOptions(
            cwd=self.cwd,
            permission_mode=self.permission_mode,
            plugins=self.plugins,
            agents=self.agents,
            setting_sources=["user", "project"],
            allowed_tools=[
                # Core tools
                "Read", "Write", "Edit", "Bash",
                "Glob", "Grep",
                # Web tools
                "WebFetch", "WebSearch",
                # Agent tools
                "Task", "Skill",
                # Other
                "AskUserQuestion", "EnterPlanMode", "ExitPlanMode",
                "TaskCreate", "TaskUpdate", "TaskList", "TaskGet"
            ]
        )

    async def stream_query(self, prompt: str) -> AsyncIterator[dict]:
        """Stream a query through the SDK with marketplace agents/skills.

        Args:
            prompt: The user's prompt/question

        Yields:
            Message dictionaries with type, content, tool info, etc.
        """
        if not SDK_AVAILABLE:
            yield {
                "type": "error",
                "content": "claude-agent-sdk is not installed. "
                           "Install with: pip install claude-agent-sdk"
            }
            return

        options = self.get_options()

        try:
            async for message in query(prompt=prompt, options=options):
                # Convert message to dict for JSON serialization
                yield self._message_to_dict(message)

        except Exception as e:
            yield {
                "type": "error",
                "content": f"SDK error: {str(e)}"
            }

    def _message_to_dict(self, message: Any) -> dict:
        """Convert SDK message to dictionary."""
        msg_type = getattr(message, 'type', None)

        # Debug: print message structure
        print(f"[SDK Bridge] Message type: {msg_type}, attrs: {dir(message)}", file=sys.stderr)

        # Handle different message types
        if msg_type == 'assistant' or str(msg_type) == 'MessageType.ASSISTANT':
            # Extract text from content blocks
            content = getattr(message, 'content', [])
            text_parts = []
            tool_uses = []

            if isinstance(content, list):
                for block in content:
                    if hasattr(block, 'text'):
                        text_parts.append(block.text)
                    elif hasattr(block, 'type') and block.type == 'tool_use':
                        tool_uses.append({
                            'name': getattr(block, 'name', None),
                            'input': getattr(block, 'input', None),
                        })

            return {
                "type": "assistant",
                "content": '\n'.join(text_parts) if text_parts else str(content),
                "tool_uses": tool_uses if tool_uses else None
            }

        elif msg_type == 'user':
            content = getattr(message, 'content', [])
            if isinstance(content, list):
                # Tool results
                results = []
                for block in content:
                    if hasattr(block, 'type') and block.type == 'tool_result':
                        results.append({
                            'tool_use_id': getattr(block, 'tool_use_id', None),
                            'content': getattr(block, 'content', None),
                            'is_error': getattr(block, 'is_error', False),
                        })
                if results:
                    return {"type": "tool_result", "results": results}

            return {"type": "user", "content": str(content)}

        elif msg_type == 'system':
            return {
                "type": "system",
                "subtype": getattr(message, 'subtype', None),
                "data": getattr(message, 'data', None)
            }

        elif msg_type == 'result':
            return {
                "type": "result",
                "result": getattr(message, 'result', None),
                "subagent": getattr(message, 'subagent', None)
            }

        # Fallback for unknown types
        result = {"type": str(msg_type) if msg_type else "unknown"}

        if hasattr(message, 'content'):
            content = message.content
            if isinstance(content, list):
                # Try to extract text
                texts = [getattr(b, 'text', str(b)) for b in content]
                result['content'] = '\n'.join(texts)
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
