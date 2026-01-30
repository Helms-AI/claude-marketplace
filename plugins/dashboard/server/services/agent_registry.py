"""Agent registry service for aggregating agent metadata."""

import os
from datetime import datetime
from typing import Optional

from ..models import AgentInfo, DomainInfo
from ..parsers.agent_parser import AgentParser
from ..parsers.capability_parser import CapabilityParser


class AgentRegistry:
    """Registry of all agent personas across all plugins."""

    def __init__(self, plugin_paths: list[str]):
        """Initialize the agent registry.

        Args:
            plugin_paths: List of paths to scan for plugins.
        """
        self.plugin_paths = plugin_paths
        self.agents: dict[str, AgentInfo] = {}
        self.domains: dict[str, DomainInfo] = {}
        self.agents_by_domain: dict[str, list[str]] = {}

    def scan(self) -> None:
        """Scan all plugin paths and build the agent registry."""
        self.agents.clear()
        self.domains.clear()
        self.agents_by_domain.clear()

        # First, parse capabilities to get domain info from all paths
        self.domains, _ = CapabilityParser.parse_directories(self.plugin_paths)

        # Then parse agent files from each plugin path
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

            # Look for agents directory
            agents_dir = os.path.join(plugin_path, 'agents')
            if os.path.isdir(agents_dir):
                self._process_agents_directory(agents_dir)

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

                # Look for agents directory
                agents_dir = os.path.join(latest_version_path, 'agents')
                if os.path.isdir(agents_dir):
                    self._process_agents_directory(agents_dir)

    def _process_agents_directory(self, agents_dir: str) -> None:
        """Process agents from a directory.

        Args:
            agents_dir: Path to agents directory.
        """
        agents = AgentParser.parse_directory(agents_dir)
        for agent in agents:
            # Skip duplicates (same agent from different sources)
            if agent.id in self.agents:
                continue

            self.agents[agent.id] = agent

            # Track agents by domain
            if agent.domain not in self.agents_by_domain:
                self.agents_by_domain[agent.domain] = []
            self.agents_by_domain[agent.domain].append(agent.id)

            # Update domain info
            if agent.domain in self.domains:
                self.domains[agent.domain].agents.append(agent.id)

    def get_all(self) -> list[AgentInfo]:
        """Get all registered agents.

        Returns:
            List of all AgentInfo objects.
        """
        return list(self.agents.values())

    def get_by_id(self, agent_id: str) -> Optional[AgentInfo]:
        """Get an agent by ID.

        Args:
            agent_id: The agent ID.

        Returns:
            AgentInfo or None if not found.
        """
        return self.agents.get(agent_id)

    def get_by_domain(self, domain: str) -> list[AgentInfo]:
        """Get all agents in a domain.

        Args:
            domain: The domain name.

        Returns:
            List of AgentInfo objects in the domain.
        """
        agent_ids = self.agents_by_domain.get(domain, [])
        return [self.agents[aid] for aid in agent_ids if aid in self.agents]

    def get_domain_info(self, domain: str) -> Optional[DomainInfo]:
        """Get domain information.

        Args:
            domain: The domain name.

        Returns:
            DomainInfo or None if not found.
        """
        return self.domains.get(domain)

    def get_all_domains(self) -> list[DomainInfo]:
        """Get all domain information.

        Returns:
            List of all DomainInfo objects.
        """
        return list(self.domains.values())

    def update_activity(self, agent_id: str, timestamp: Optional[datetime] = None) -> None:
        """Update an agent's last activity timestamp.

        Args:
            agent_id: The agent ID.
            timestamp: The activity timestamp (defaults to now).
        """
        if agent_id in self.agents:
            self.agents[agent_id].last_active = timestamp or datetime.now()

    def get_recent_active(self, limit: int = 10) -> list[AgentInfo]:
        """Get recently active agents.

        Args:
            limit: Maximum number of agents to return.

        Returns:
            List of recently active AgentInfo objects.
        """
        active_agents = [a for a in self.agents.values() if a.last_active]
        active_agents.sort(key=lambda a: a.last_active or datetime.min, reverse=True)
        return active_agents[:limit]

    def to_dict(self, agent: AgentInfo) -> dict:
        """Convert an AgentInfo to a dictionary for JSON serialization.

        Args:
            agent: The AgentInfo object.

        Returns:
            Dictionary representation.
        """
        return {
            'id': agent.id,
            'name': agent.name,
            'role': agent.role,
            'domain': agent.domain,
            'description': agent.description,
            'tools': agent.tools,
            'key_phrases': agent.key_phrases,
            'file_path': agent.file_path,
            'last_active': agent.last_active.isoformat() if agent.last_active else None
        }

    def domain_to_dict(self, domain: DomainInfo) -> dict:
        """Convert a DomainInfo to a dictionary for JSON serialization.

        Args:
            domain: The DomainInfo object.

        Returns:
            Dictionary representation.
        """
        return {
            'name': domain.name,
            'subdomains': domain.subdomains,
            'collaborates_with': domain.collaborates_with,
            'agents': domain.agents,
            'skills': domain.skills,
            'capabilities': domain.capabilities
        }
