"""Parser for agent markdown files."""

import json
import os
import re
from pathlib import Path
from typing import Optional

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False

from ..models import AgentInfo


class AgentParser:
    """Parse agent information from markdown files."""

    @staticmethod
    def _parse_simple_yaml(text: str) -> dict:
        """Simple YAML parser for frontmatter when yaml module is unavailable.

        Args:
            text: YAML text content.

        Returns:
            Dictionary of parsed values.
        """
        result = {}
        for line in text.strip().split('\n'):
            line = line.strip()
            if ':' in line and not line.startswith('#'):
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()

                # Handle lists like [Read, Grep, Glob]
                if value.startswith('[') and value.endswith(']'):
                    items = value[1:-1].split(',')
                    result[key] = [item.strip() for item in items]
                # Handle quoted strings
                elif value.startswith('"') and value.endswith('"'):
                    result[key] = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    result[key] = value[1:-1]
                else:
                    result[key] = value

        return result

    @staticmethod
    def parse_file(file_path: str) -> Optional[AgentInfo]:
        """Parse an agent markdown file and extract agent information.

        Args:
            file_path: Path to the agent markdown file.

        Returns:
            AgentInfo object or None if parsing fails.
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract YAML frontmatter
            frontmatter = {}
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    if HAS_YAML:
                        try:
                            frontmatter = yaml.safe_load(parts[1]) or {}
                        except Exception:
                            frontmatter = AgentParser._parse_simple_yaml(parts[1])
                    else:
                        frontmatter = AgentParser._parse_simple_yaml(parts[1])
                    content = parts[2]

            # Get domain from file path
            domain = AgentParser._extract_domain_from_path(file_path)

            # Extract name from first heading or frontmatter
            name = frontmatter.get('name', '')
            if not name:
                heading_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
                if heading_match:
                    name = heading_match.group(1).strip()

            # Extract role from Persona section or frontmatter description
            role = ""
            description = frontmatter.get('description', '')
            if description:
                role = description.split(' - ')[0] if ' - ' in description else description
            else:
                role_match = re.search(r'\*\*Role:\*\*\s*(.+)', content)
                if role_match:
                    role = role_match.group(1).strip()

            # Extract tools from frontmatter
            tools = frontmatter.get('tools', [])
            if isinstance(tools, str):
                tools = [t.strip() for t in tools.split(',')]

            # Extract key phrases
            key_phrases = []
            phrases_section = re.search(r'## Key Phrases\s*\n((?:- .+\n?)+)', content)
            if phrases_section:
                phrases_text = phrases_section.group(1)
                for line in phrases_text.split('\n'):
                    if line.strip().startswith('-'):
                        phrase = line.strip('- "').strip('"').strip()
                        if phrase:
                            key_phrases.append(phrase)

            # Generate ID from file name
            agent_id = frontmatter.get('name', Path(file_path).stem)

            # Extract full name (e.g., "Quinn Martinez" from "# Quinn Martinez")
            full_name = name
            if not full_name:
                full_name = agent_id.replace('-', ' ').title()

            return AgentInfo(
                id=agent_id,
                name=full_name,
                role=role,
                domain=domain or "unknown",
                description=description,
                tools=tools,
                key_phrases=key_phrases[:5],  # Limit to 5 key phrases
                file_path=file_path
            )

        except Exception as e:
            print(f"Error parsing agent file {file_path}: {e}")
            return None

    @staticmethod
    def parse_directory(agents_dir: str) -> list[AgentInfo]:
        """Parse all agent files in a directory.

        Args:
            agents_dir: Path to the agents directory.

        Returns:
            List of AgentInfo objects.
        """
        agents = []
        if not os.path.isdir(agents_dir):
            return agents

        for filename in os.listdir(agents_dir):
            if filename.endswith('.md'):
                file_path = os.path.join(agents_dir, filename)
                agent = AgentParser.parse_file(file_path)
                if agent:
                    agents.append(agent)

        return agents

    @staticmethod
    def _extract_domain_from_path(file_path: str) -> Optional[str]:
        """Extract domain name from file path.

        Handles multiple path patterns:
        1. Development: plugins/<domain>/agents/file.md
        2. Cache: cache/<source>/<plugin-name>/<version>/agents/file.md

        Args:
            file_path: Path to the agent file.

        Returns:
            Domain name or None if not found.
        """
        path_parts = Path(file_path).parts

        # Try pattern 1: plugins/<domain>/agents/
        for i, part in enumerate(path_parts):
            if part == 'plugins' and i + 1 < len(path_parts):
                # Skip if next part is 'cache' (that's pattern 2)
                if path_parts[i + 1] != 'cache':
                    return path_parts[i + 1]

        # Try pattern 2: cache/<source>/<plugin-name>/<version>/agents/
        # Look for plugin.json to get the actual domain name
        for i, part in enumerate(path_parts):
            if part == 'agents':
                # Go up one level to find the plugin root
                plugin_root = str(Path(*path_parts[:i]))
                plugin_json_path = os.path.join(plugin_root, '.claude-plugin', 'plugin.json')
                if os.path.isfile(plugin_json_path):
                    try:
                        with open(plugin_json_path, 'r', encoding='utf-8') as f:
                            plugin_data = json.load(f)
                            return plugin_data.get('name')
                    except Exception:
                        pass
                # Fallback: use directory name before 'agents'
                if i >= 1:
                    # For cache path, the plugin name is 2 levels up from agents
                    # e.g., cache/helms-ai-marketplace/frontend/1.0.0/agents
                    # We want 'frontend' which is path_parts[i-2] typically
                    # But with version directory, it's path_parts[i-2]
                    return path_parts[i - 2] if i >= 2 else path_parts[i - 1]

        return None
