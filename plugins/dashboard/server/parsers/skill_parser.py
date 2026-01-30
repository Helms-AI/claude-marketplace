"""Parser for skill markdown files."""

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

from ..models import SkillInfo


class SkillParser:
    """Parse skill information from SKILL.md files."""

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

                # Handle quoted strings
                if value.startswith('"') and value.endswith('"'):
                    result[key] = value[1:-1]
                elif value.startswith("'") and value.endswith("'"):
                    result[key] = value[1:-1]
                else:
                    result[key] = value

        return result

    @staticmethod
    def parse_file(file_path: str) -> Optional[SkillInfo]:
        """Parse a skill markdown file and extract skill information.

        Args:
            file_path: Path to the SKILL.md file.

        Returns:
            SkillInfo object or None if parsing fails.
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
                            frontmatter = SkillParser._parse_simple_yaml(parts[1])
                    else:
                        frontmatter = SkillParser._parse_simple_yaml(parts[1])
                    content = parts[2]

            # Get skill ID and domain from file path
            # Path patterns:
            #   Development: plugins/<domain>/skills/<skill-name>/SKILL.md
            #   Cache: cache/<source>/<plugin-name>/<version>/skills/<skill-name>/SKILL.md
            path_parts = Path(file_path).parts
            skill_id = frontmatter.get('name', '')
            domain = SkillParser._extract_domain_from_path(file_path)

            # Extract skill_id from path if not in frontmatter
            for i, part in enumerate(path_parts):
                if part == 'skills' and i + 1 < len(path_parts):
                    if not skill_id:
                        skill_id = path_parts[i + 1]
                    break

            # Extract description from frontmatter
            description = frontmatter.get('description', '')

            # Extract name from first heading
            name = skill_id.replace('-', ' ').title()
            heading_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
            if heading_match:
                name = heading_match.group(1).strip()
                # Remove "Skill" suffix if present
                if name.endswith(' Skill'):
                    name = name[:-6]

            # Extract backing agent from agent announcement pattern
            # Pattern: **Quinn Martinez - Aesthetic Director** is now working
            backing_agent = None
            agent_pattern = r'\*\*([A-Z][a-z]+\s+[A-Z][a-z]+)\s+-\s+([^*]+)\*\*\s+is now working'
            agent_match = re.search(agent_pattern, content)
            if agent_match:
                agent_name = agent_match.group(1)
                # Convert agent name to ID format (e.g., "Quinn Martinez" -> "quinn-aesthetic")
                # Try to find the actual agent ID from the "Team Agent" section
                team_agent_match = re.search(
                    r'backed by\s+\*\*([^*]+)\*\*.*?(\w+-\w+)',
                    content,
                    re.IGNORECASE | re.DOTALL
                )
                if team_agent_match:
                    backing_agent = team_agent_match.group(2).lower()
                else:
                    # Generate ID from name
                    backing_agent = agent_name.lower().replace(' ', '-')

            # Extract handoff inputs (Context This Skill Receives)
            handoff_inputs = []
            inputs_section = re.search(
                r'Context This Skill Receives.*?\n\|(.*?)\n\n',
                content,
                re.DOTALL
            )
            if inputs_section:
                for match in re.finditer(r'`/([^`]+)`', inputs_section.group(1)):
                    skill_ref = match.group(1)
                    if skill_ref not in handoff_inputs:
                        handoff_inputs.append(skill_ref)

            # Extract handoff outputs (Context This Skill Provides)
            handoff_outputs = []
            outputs_section = re.search(
                r'Context This Skill Provides.*?\n\|(.*?)\n\n',
                content,
                re.DOTALL
            )
            if outputs_section:
                for match in re.finditer(r'`/([^`]+)`', outputs_section.group(1)):
                    skill_ref = match.group(1)
                    if skill_ref not in handoff_outputs:
                        handoff_outputs.append(skill_ref)

            # Also look for "Skills That Consume" or "Next Steps" sections
            next_steps_match = re.search(
                r'## Next Steps\s*\n((?:.+\n?)+?)(?:\n##|$)',
                content
            )
            if next_steps_match:
                for match in re.finditer(r'`/([^`]+)`', next_steps_match.group(1)):
                    skill_ref = match.group(1)
                    if skill_ref not in handoff_outputs:
                        handoff_outputs.append(skill_ref)

            return SkillInfo(
                id=skill_id,
                name=name,
                domain=domain or "unknown",
                description=description,
                backing_agent=backing_agent,
                handoff_inputs=handoff_inputs,
                handoff_outputs=handoff_outputs,
                file_path=file_path
            )

        except Exception as e:
            print(f"Error parsing skill file {file_path}: {e}")
            return None

    @staticmethod
    def parse_directory(skills_dir: str) -> list[SkillInfo]:
        """Parse all skill files in a directory.

        Args:
            skills_dir: Path to the skills directory.

        Returns:
            List of SkillInfo objects.
        """
        skills = []
        if not os.path.isdir(skills_dir):
            return skills

        for skill_name in os.listdir(skills_dir):
            skill_path = os.path.join(skills_dir, skill_name)
            if os.path.isdir(skill_path):
                skill_file = os.path.join(skill_path, 'SKILL.md')
                if os.path.isfile(skill_file):
                    skill = SkillParser.parse_file(skill_file)
                    if skill:
                        skills.append(skill)

        return skills

    @staticmethod
    def _extract_domain_from_path(file_path: str) -> Optional[str]:
        """Extract domain name from file path.

        Handles multiple path patterns:
        1. Development: plugins/<domain>/skills/skill-name/SKILL.md
        2. Cache: cache/<source>/<plugin-name>/<version>/skills/skill-name/SKILL.md

        Args:
            file_path: Path to the skill file.

        Returns:
            Domain name or None if not found.
        """
        path_parts = Path(file_path).parts

        # Try pattern 1: plugins/<domain>/skills/
        for i, part in enumerate(path_parts):
            if part == 'plugins' and i + 1 < len(path_parts):
                # Skip if next part is 'cache' (that's pattern 2)
                if path_parts[i + 1] != 'cache':
                    return path_parts[i + 1]

        # Try pattern 2: cache/<source>/<plugin-name>/<version>/skills/
        # Look for plugin.json to get the actual domain name
        for i, part in enumerate(path_parts):
            if part == 'skills':
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
                # Fallback: use directory name before 'skills'
                if i >= 1:
                    # For cache path, the plugin name is 2 levels up from skills
                    # e.g., cache/helms-ai-marketplace/frontend/1.0.0/skills
                    # We want 'frontend' which is path_parts[i-2]
                    return path_parts[i - 2] if i >= 2 else path_parts[i - 1]

        return None
