"""Parser for capabilities.json files."""

import json
import os
from pathlib import Path
from typing import Optional

from ..models import CapabilityInfo, DomainInfo


class CapabilityParser:
    """Parse capability information from capabilities.json files."""

    @staticmethod
    def parse_file(file_path: str) -> tuple[Optional[DomainInfo], list[CapabilityInfo]]:
        """Parse a capabilities.json file.

        Args:
            file_path: Path to the capabilities.json file.

        Returns:
            Tuple of (DomainInfo, list of CapabilityInfo) or (None, []) if parsing fails.
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Extract domain info (handles multiple formats)
            domain_data = data.get('domain', {})

            # Domain can be a string or an object
            if isinstance(domain_data, str):
                domain_name = domain_data
                subdomains = []
            else:
                domain_name = domain_data.get('primary', data.get('name', 'unknown'))
                subdomains = domain_data.get('subdomains', [])

            # collaborates_with can be at top level or inside domain
            collaborates_with = data.get('collaborates_with', [])
            if not collaborates_with and isinstance(domain_data, dict):
                collaborates_with = domain_data.get('collaborates_with', [])

            domain_info = DomainInfo(
                name=domain_name,
                subdomains=subdomains,
                collaborates_with=collaborates_with
            )

            # Extract capabilities (handles both array and object formats)
            capabilities = []
            caps_data = data.get('capabilities', [])

            # Handle array format
            if isinstance(caps_data, list):
                for cap_data in caps_data:
                    capability = CapabilityInfo(
                        id=cap_data.get('id', ''),
                        verb=cap_data.get('verb', ''),
                        domain=domain_name,
                        artifacts=cap_data.get('artifacts', []),
                        keywords=cap_data.get('keywords', []),
                        skill=cap_data.get('skill', ''),
                        priority=cap_data.get('priority', 5)
                    )
                    capabilities.append(capability)
            # Handle object/dict format (alternative schema)
            elif isinstance(caps_data, dict):
                for cap_id, cap_data in caps_data.items():
                    if isinstance(cap_data, dict):
                        # Extract keywords from triggers or description
                        keywords = cap_data.get('triggers', [])
                        if not keywords and cap_data.get('description'):
                            keywords = [cap_data.get('description', '')]

                        capability = CapabilityInfo(
                            id=f"{domain_name}.{cap_id}",
                            verb='create',  # default verb
                            domain=domain_name,
                            artifacts=cap_data.get('technologies', []) or cap_data.get('patterns', []),
                            keywords=keywords,
                            skill=f"/{cap_id}",
                            priority=5
                        )
                        capabilities.append(capability)

            return domain_info, capabilities

        except Exception as e:
            print(f"Error parsing capabilities file {file_path}: {e}")
            return None, []

    @staticmethod
    def parse_marketplace(plugins_dir: str) -> tuple[dict[str, DomainInfo], list[CapabilityInfo]]:
        """Parse all capabilities.json files in the plugins directory.

        Args:
            plugins_dir: Path to the plugins directory.

        Returns:
            Tuple of (dict mapping domain name to DomainInfo, list of all capabilities).
        """
        return CapabilityParser.parse_directories([plugins_dir])

    @staticmethod
    def parse_directories(plugin_paths: list[str]) -> tuple[dict[str, DomainInfo], list[CapabilityInfo]]:
        """Parse all capabilities.json files from multiple plugin directories.

        Handles both development structure (plugins/<domain>/) and cache structure
        (cache/<source>/<plugin-name>/<version>/).

        Args:
            plugin_paths: List of paths to scan for plugins.

        Returns:
            Tuple of (dict mapping domain name to DomainInfo, list of all capabilities).
        """
        domains = {}
        all_capabilities = []

        for plugins_dir in plugin_paths:
            if not os.path.isdir(plugins_dir):
                continue

            # Check if this is a cache directory structure
            is_cache = 'cache' in plugins_dir

            if is_cache:
                # Cache structure: cache/<source>/<plugin-name>/<version>/
                CapabilityParser._scan_cache_directory(plugins_dir, domains, all_capabilities)
            else:
                # Development structure: plugins/<domain>/
                CapabilityParser._scan_plugins_directory(plugins_dir, domains, all_capabilities)

        return domains, all_capabilities

    @staticmethod
    def _scan_plugins_directory(plugins_dir: str, domains: dict, all_capabilities: list) -> None:
        """Scan development-style plugins directory.

        Args:
            plugins_dir: Path to plugins directory.
            domains: Dict to update with domain info.
            all_capabilities: List to extend with capabilities.
        """
        for plugin_name in os.listdir(plugins_dir):
            plugin_path = os.path.join(plugins_dir, plugin_name)
            if not os.path.isdir(plugin_path):
                continue

            # Look for capabilities.json in .claude-plugin directory
            caps_file = os.path.join(plugin_path, '.claude-plugin', 'capabilities.json')
            if os.path.isfile(caps_file):
                domain_info, capabilities = CapabilityParser.parse_file(caps_file)
                if domain_info and domain_info.name not in domains:
                    domains[domain_info.name] = domain_info
                    all_capabilities.extend(capabilities)

    @staticmethod
    def _scan_cache_directory(cache_dir: str, domains: dict, all_capabilities: list) -> None:
        """Scan cache-style plugins directory.

        Cache structure: cache/<source>/<plugin-name>/<version>/

        Args:
            cache_dir: Path to cache directory.
            domains: Dict to update with domain info.
            all_capabilities: List to extend with capabilities.
        """
        # Iterate through sources (e.g., helms-ai-marketplace)
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

                # Use the most recent version (simple sort, semantic versioning)
                versions.sort(key=lambda x: x[0], reverse=True)
                _, latest_version_path = versions[0]

                # Look for capabilities.json
                caps_file = os.path.join(latest_version_path, '.claude-plugin', 'capabilities.json')
                if os.path.isfile(caps_file):
                    domain_info, capabilities = CapabilityParser.parse_file(caps_file)
                    if domain_info and domain_info.name not in domains:
                        domains[domain_info.name] = domain_info
                        all_capabilities.extend(capabilities)

    @staticmethod
    def build_collaboration_graph(domains: dict[str, DomainInfo]) -> dict[str, list[str]]:
        """Build a graph of domain collaborations.

        Args:
            domains: Dictionary mapping domain names to DomainInfo.

        Returns:
            Dictionary mapping each domain to list of domains it collaborates with.
        """
        graph = {}
        for domain_name, domain_info in domains.items():
            graph[domain_name] = domain_info.collaborates_with

        return graph
