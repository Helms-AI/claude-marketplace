"""Skill registry service for aggregating skill metadata."""

import os
from datetime import datetime
from typing import Optional

from ..models import SkillInfo, CapabilityInfo
from ..parsers.skill_parser import SkillParser
from ..parsers.capability_parser import CapabilityParser


class SkillRegistry:
    """Registry of all skills across all plugins."""

    def __init__(self, plugin_paths: list[str]):
        """Initialize the skill registry.

        Args:
            plugin_paths: List of paths to scan for plugins.
        """
        self.plugin_paths = plugin_paths
        self.skills: dict[str, SkillInfo] = {}
        self.capabilities: list[CapabilityInfo] = []
        self.skills_by_domain: dict[str, list[str]] = {}
        self.skill_to_capability: dict[str, CapabilityInfo] = {}

    def scan(self) -> None:
        """Scan all plugin paths and build the skill registry."""
        self.skills.clear()
        self.capabilities.clear()
        self.skills_by_domain.clear()
        self.skill_to_capability.clear()

        # Parse capabilities from all paths
        _, self.capabilities = CapabilityParser.parse_directories(self.plugin_paths)

        # Build skill to capability mapping
        for cap in self.capabilities:
            if cap.skill:
                skill_id = cap.skill.lstrip('/')
                self.skill_to_capability[skill_id] = cap

        # Parse skill files from each plugin path
        for plugins_dir in self.plugin_paths:
            if not os.path.isdir(plugins_dir):
                continue

            # Check if this is a cache directory structure
            is_cache = 'cache' in plugins_dir

            if is_cache:
                self._scan_cache_directory(plugins_dir)
            else:
                self._scan_plugins_directory(plugins_dir)

    def _scan_plugins_directory(self, plugins_dir: str) -> None:
        """Scan development-style plugins directory.

        Args:
            plugins_dir: Path to plugins directory.
        """
        for plugin_name in os.listdir(plugins_dir):
            plugin_path = os.path.join(plugins_dir, plugin_name)
            if not os.path.isdir(plugin_path):
                continue

            # Look for skills directory
            skills_dir = os.path.join(plugin_path, 'skills')
            if os.path.isdir(skills_dir):
                self._process_skills_directory(skills_dir)

    def _scan_cache_directory(self, cache_dir: str) -> None:
        """Scan cache-style plugins directory.

        Cache structure: cache/<source>/<plugin-name>/<version>/

        Args:
            cache_dir: Path to cache directory.
        """
        # Iterate through sources
        for source_name in os.listdir(cache_dir):
            source_path = os.path.join(cache_dir, source_name)
            if not os.path.isdir(source_path):
                continue

            # Iterate through plugins within source
            for plugin_name in os.listdir(source_path):
                plugin_path = os.path.join(source_path, plugin_name)
                if not os.path.isdir(plugin_path):
                    continue

                # Find the latest version directory
                versions = []
                for version_name in os.listdir(plugin_path):
                    version_path = os.path.join(plugin_path, version_name)
                    if os.path.isdir(version_path):
                        versions.append((version_name, version_path))

                if not versions:
                    continue

                # Use the most recent version
                versions.sort(key=lambda x: x[0], reverse=True)
                _, latest_version_path = versions[0]

                # Look for skills directory
                skills_dir = os.path.join(latest_version_path, 'skills')
                if os.path.isdir(skills_dir):
                    self._process_skills_directory(skills_dir)

    def _process_skills_directory(self, skills_dir: str) -> None:
        """Process skills from a directory.

        Args:
            skills_dir: Path to skills directory.
        """
        skills = SkillParser.parse_directory(skills_dir)
        for skill in skills:
            # Skip duplicates (same skill from different sources)
            if skill.id in self.skills:
                continue

            self.skills[skill.id] = skill

            # Track skills by domain
            if skill.domain not in self.skills_by_domain:
                self.skills_by_domain[skill.domain] = []
            self.skills_by_domain[skill.domain].append(skill.id)

    def get_all(self) -> list[SkillInfo]:
        """Get all registered skills.

        Returns:
            List of all SkillInfo objects.
        """
        return list(self.skills.values())

    def get_by_id(self, skill_id: str) -> Optional[SkillInfo]:
        """Get a skill by ID.

        Args:
            skill_id: The skill ID.

        Returns:
            SkillInfo or None if not found.
        """
        return self.skills.get(skill_id)

    def get_by_domain(self, domain: str) -> list[SkillInfo]:
        """Get all skills in a domain.

        Args:
            domain: The domain name.

        Returns:
            List of SkillInfo objects in the domain.
        """
        skill_ids = self.skills_by_domain.get(domain, [])
        return [self.skills[sid] for sid in skill_ids if sid in self.skills]

    def get_capability(self, skill_id: str) -> Optional[CapabilityInfo]:
        """Get the capability info for a skill.

        Args:
            skill_id: The skill ID.

        Returns:
            CapabilityInfo or None if not found.
        """
        return self.skill_to_capability.get(skill_id)

    def get_all_capabilities(self) -> list[CapabilityInfo]:
        """Get all capabilities.

        Returns:
            List of all CapabilityInfo objects.
        """
        return self.capabilities

    def update_invocation(self, skill_id: str, timestamp: Optional[datetime] = None) -> None:
        """Update a skill's invocation count and timestamp.

        Args:
            skill_id: The skill ID.
            timestamp: The invocation timestamp (defaults to now).
        """
        if skill_id in self.skills:
            self.skills[skill_id].invocation_count += 1
            self.skills[skill_id].last_invoked = timestamp or datetime.now()

    def get_recent_invoked(self, limit: int = 10) -> list[SkillInfo]:
        """Get recently invoked skills.

        Args:
            limit: Maximum number of skills to return.

        Returns:
            List of recently invoked SkillInfo objects.
        """
        invoked_skills = [s for s in self.skills.values() if s.last_invoked]
        invoked_skills.sort(key=lambda s: s.last_invoked or datetime.min, reverse=True)
        return invoked_skills[:limit]

    def build_handoff_graph(self) -> dict[str, list[str]]:
        """Build a graph of skill handoffs.

        Returns:
            Dictionary mapping each skill ID to list of skills it hands off to.
        """
        graph = {}
        for skill in self.skills.values():
            graph[skill.id] = skill.handoff_outputs
        return graph

    def to_dict(self, skill: SkillInfo) -> dict:
        """Convert a SkillInfo to a dictionary for JSON serialization.

        Args:
            skill: The SkillInfo object.

        Returns:
            Dictionary representation.
        """
        return {
            'id': skill.id,
            'name': skill.name,
            'domain': skill.domain,
            'description': skill.description,
            'backing_agent': skill.backing_agent,
            'handoff_inputs': skill.handoff_inputs,
            'handoff_outputs': skill.handoff_outputs,
            'file_path': skill.file_path,
            'invocation_count': skill.invocation_count,
            'last_invoked': skill.last_invoked.isoformat() if skill.last_invoked else None
        }

    def capability_to_dict(self, cap: CapabilityInfo) -> dict:
        """Convert a CapabilityInfo to a dictionary for JSON serialization.

        Args:
            cap: The CapabilityInfo object.

        Returns:
            Dictionary representation.
        """
        return {
            'id': cap.id,
            'verb': cap.verb,
            'domain': cap.domain,
            'artifacts': cap.artifacts,
            'keywords': cap.keywords,
            'skill': cap.skill,
            'priority': cap.priority
        }
