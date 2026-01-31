#!/usr/bin/env python3
"""Marketplace MCP Tools - Custom tools for marketplace operations.

This module provides marketplace-specific MCP tools that enhance
the Claude Agent SDK with domain knowledge about the marketplace.

Tools:
- marketplace_search: Search plugins by name, description, or tags
- marketplace_agent_info: Get detailed information about an agent
- marketplace_skill_info: Get detailed information about a skill
- marketplace_capabilities: List capabilities for cross-domain routing
- marketplace_domain_agents: List agents for a specific domain

Usage:
    from marketplace_mcp import get_marketplace_mcp_config

    options = ClaudeAgentOptions(
        mcp_servers=get_marketplace_mcp_config(),
        allowed_tools=[
            "mcp__marketplace__marketplace_search",
            "mcp__marketplace__marketplace_agent_info",
            # etc.
        ]
    )
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional


def get_marketplace_root() -> Path:
    """Get the root path of the marketplace repository.

    Returns:
        Path to the marketplace root directory
    """
    # Walk up from this file to find marketplace root
    current = Path(__file__).resolve()
    for _ in range(10):
        if (current / '.claude-plugin' / 'marketplace.json').exists():
            return current
        parent = current.parent
        if parent == current:
            break
        current = parent

    # Fallback: assume 5 dirs up from this file
    return Path(__file__).resolve().parents[4]


def load_marketplace_data() -> Dict[str, Any]:
    """Load the marketplace.json data.

    Returns:
        Dict with marketplace data
    """
    marketplace_path = get_marketplace_root() / '.claude-plugin' / 'marketplace.json'
    try:
        with open(marketplace_path) as f:
            return json.load(f)
    except Exception as e:
        print(f"[MCP] Error loading marketplace.json: {e}", file=sys.stderr)
        return {'plugins': []}


def load_taxonomy() -> Dict[str, Any]:
    """Load the taxonomy.json data.

    Returns:
        Dict with taxonomy data
    """
    taxonomy_path = get_marketplace_root() / '.claude-plugin' / 'taxonomy.json'
    try:
        with open(taxonomy_path) as f:
            return json.load(f)
    except Exception as e:
        print(f"[MCP] Error loading taxonomy.json: {e}", file=sys.stderr)
        return {}


# ============================================================================
# MCP Tool Implementations
# ============================================================================

async def search_plugins(args: Dict[str, Any]) -> Dict[str, Any]:
    """Search the marketplace for plugins matching a query.

    Args:
        args: Dict with 'query' (str), optional 'category' (str), optional 'limit' (int)

    Returns:
        Dict with 'content' list containing search results
    """
    query = args.get('query', '').lower()
    category = args.get('category', None)
    limit = args.get('limit', 10)

    if not query:
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({"error": "No query provided"}, indent=2)
            }]
        }

    marketplace = load_marketplace_data()
    results = []

    for plugin in marketplace.get('plugins', []):
        score = 0

        # Score by name match
        name = plugin.get('name', '').lower()
        if query == name:
            score += 20
        elif query in name:
            score += 10

        # Score by description match
        description = plugin.get('description', '').lower()
        if query in description:
            score += 5

        # Score by tags match
        tags = ' '.join(plugin.get('tags', [])).lower()
        if query in tags:
            score += 3

        # Filter by category if specified
        if category and plugin.get('category') != category:
            continue

        if score > 0:
            results.append({
                'name': plugin.get('name'),
                'description': plugin.get('description'),
                'version': plugin.get('version'),
                'category': plugin.get('category'),
                'tags': plugin.get('tags', []),
                '_score': score
            })

    # Sort by score and limit
    results.sort(key=lambda x: x.get('_score', 0), reverse=True)
    results = results[:limit]

    # Remove internal score field
    for r in results:
        r.pop('_score', None)

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "results": results,
                "count": len(results),
                "query": query,
                "category": category
            }, indent=2)
        }]
    }


async def get_agent_info(args: Dict[str, Any]) -> Dict[str, Any]:
    """Get detailed information about a marketplace agent.

    Args:
        args: Dict with 'agent_name' (str) and 'plugin' (str)

    Returns:
        Dict with agent details or error message
    """
    agent_name = args.get('agent_name', '')
    plugin = args.get('plugin', '')

    if not agent_name or not plugin:
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "error": "Both 'agent_name' and 'plugin' are required"
                }, indent=2)
            }]
        }

    agent_path = get_marketplace_root() / 'plugins' / plugin / 'agents' / f'{agent_name}.md'

    if not agent_path.exists():
        # Try without .md extension (in case agent_name already has it)
        agent_path = get_marketplace_root() / 'plugins' / plugin / 'agents' / agent_name
        if not agent_path.exists():
            return {
                "content": [{
                    "type": "text",
                    "text": json.dumps({
                        "error": f"Agent '{agent_name}' not found in plugin '{plugin}'"
                    }, indent=2)
                }]
            }

    try:
        content = agent_path.read_text()
        return {
            "content": [{
                "type": "text",
                "text": content
            }]
        }
    except Exception as e:
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "error": f"Error reading agent file: {str(e)}"
                }, indent=2)
            }]
        }


async def get_skill_info(args: Dict[str, Any]) -> Dict[str, Any]:
    """Get detailed information about a marketplace skill.

    Args:
        args: Dict with 'skill_name' (str) and 'plugin' (str)

    Returns:
        Dict with skill details or error message
    """
    skill_name = args.get('skill_name', '')
    plugin = args.get('plugin', '')

    if not skill_name or not plugin:
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "error": "Both 'skill_name' and 'plugin' are required"
                }, indent=2)
            }]
        }

    skill_path = get_marketplace_root() / 'plugins' / plugin / 'skills' / skill_name / 'SKILL.md'

    if not skill_path.exists():
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "error": f"Skill '{skill_name}' not found in plugin '{plugin}'"
                }, indent=2)
            }]
        }

    try:
        content = skill_path.read_text()
        return {
            "content": [{
                "type": "text",
                "text": content
            }]
        }
    except Exception as e:
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "error": f"Error reading skill file: {str(e)}"
                }, indent=2)
            }]
        }


async def list_capabilities(args: Dict[str, Any]) -> Dict[str, Any]:
    """List capabilities for cross-domain routing.

    Args:
        args: Dict with optional 'domain' (str), 'verb' (str)

    Returns:
        Dict with capabilities list
    """
    domain_filter = args.get('domain', None)
    verb_filter = args.get('verb', None)

    capabilities = []
    plugins_dir = get_marketplace_root() / 'plugins'

    for plugin_path in plugins_dir.iterdir():
        if not plugin_path.is_dir():
            continue

        cap_path = plugin_path / '.claude-plugin' / 'capabilities.json'
        if not cap_path.exists():
            continue

        try:
            with open(cap_path) as f:
                cap_data = json.load(f)

            plugin_domain = cap_data.get('domain', {}).get('primary', '')

            # Filter by domain if specified
            if domain_filter and plugin_domain != domain_filter:
                continue

            for cap in cap_data.get('capabilities', []):
                # Filter by verb if specified
                if verb_filter and cap.get('verb') != verb_filter:
                    continue

                capabilities.append({
                    'id': cap.get('id'),
                    'domain': plugin_domain,
                    'verb': cap.get('verb'),
                    'artifacts': cap.get('artifacts', []),
                    'keywords': cap.get('keywords', []),
                    'skill': cap.get('skill'),
                    'priority': cap.get('priority', 5)
                })
        except Exception as e:
            print(f"[MCP] Error loading capabilities from {plugin_path}: {e}", file=sys.stderr)

    # Sort by priority
    capabilities.sort(key=lambda x: x.get('priority', 5), reverse=True)

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "capabilities": capabilities,
                "count": len(capabilities),
                "filters": {
                    "domain": domain_filter,
                    "verb": verb_filter
                }
            }, indent=2)
        }]
    }


async def list_domain_agents(args: Dict[str, Any]) -> Dict[str, Any]:
    """List all agents for a specific domain.

    Args:
        args: Dict with 'domain' (str)

    Returns:
        Dict with agents list
    """
    domain = args.get('domain', '')

    if not domain:
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "error": "Domain is required"
                }, indent=2)
            }]
        }

    agents = []
    plugin_path = get_marketplace_root() / 'plugins' / domain / 'agents'

    if not plugin_path.exists():
        return {
            "content": [{
                "type": "text",
                "text": json.dumps({
                    "error": f"Domain '{domain}' not found or has no agents"
                }, indent=2)
            }]
        }

    for agent_file in plugin_path.glob('*.md'):
        try:
            content = agent_file.read_text()

            # Extract name from first heading
            name = agent_file.stem
            import re
            heading_match = re.match(r'^#\s+(.+?)(?:\s*-\s*(.+))?$', content, re.MULTILINE)
            if heading_match:
                title = heading_match.group(1).strip()
                role = heading_match.group(2).strip() if heading_match.group(2) else ''
            else:
                title = name
                role = ''

            # Extract first paragraph as description
            lines = content.split('\n')
            description = ''
            for line in lines[1:]:
                line = line.strip()
                if line and not line.startswith('#'):
                    description = line[:150] + ('...' if len(line) > 150 else '')
                    break

            agents.append({
                'name': name,
                'title': title,
                'role': role,
                'description': description,
                'file': str(agent_file.relative_to(get_marketplace_root()))
            })
        except Exception as e:
            print(f"[MCP] Error parsing agent {agent_file}: {e}", file=sys.stderr)

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "domain": domain,
                "agents": agents,
                "count": len(agents)
            }, indent=2)
        }]
    }


async def get_domain_taxonomy(args: Dict[str, Any]) -> Dict[str, Any]:
    """Get taxonomy information for domains, verbs, and artifacts.

    Args:
        args: Empty dict or optional filters

    Returns:
        Dict with taxonomy data
    """
    taxonomy = load_taxonomy()

    return {
        "content": [{
            "type": "text",
            "text": json.dumps(taxonomy, indent=2)
        }]
    }


async def list_plugins_summary(args: Dict[str, Any]) -> Dict[str, Any]:
    """Get a summary of all marketplace plugins.

    Args:
        args: Empty dict

    Returns:
        Dict with plugin summaries
    """
    marketplace = load_marketplace_data()
    plugins = []

    for plugin in marketplace.get('plugins', []):
        plugins.append({
            'name': plugin.get('name'),
            'version': plugin.get('version'),
            'category': plugin.get('category'),
            'description': plugin.get('description', '')[:100],
        })

    return {
        "content": [{
            "type": "text",
            "text": json.dumps({
                "plugins": plugins,
                "count": len(plugins)
            }, indent=2)
        }]
    }


# ============================================================================
# MCP Tool Configuration
# ============================================================================

# Tool definitions for the MCP server
MCP_TOOLS = [
    {
        "name": "marketplace_search",
        "description": "Search marketplace plugins by name, description, or tags. Use this to find relevant plugins for a task.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query to match against plugin names, descriptions, and tags"
                },
                "category": {
                    "type": "string",
                    "description": "Optional category filter (e.g., 'development', 'design')"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results to return (default 10)",
                    "default": 10
                }
            },
            "required": ["query"]
        },
        "handler": search_plugins
    },
    {
        "name": "marketplace_agent_info",
        "description": "Get detailed information about a specific marketplace agent including their persona, responsibilities, and communication style.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_name": {
                    "type": "string",
                    "description": "The agent name (filename without .md extension)"
                },
                "plugin": {
                    "type": "string",
                    "description": "The plugin name (e.g., 'frontend', 'backend')"
                }
            },
            "required": ["agent_name", "plugin"]
        },
        "handler": get_agent_info
    },
    {
        "name": "marketplace_skill_info",
        "description": "Get detailed information about a specific marketplace skill including its instructions.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "skill_name": {
                    "type": "string",
                    "description": "The skill name (directory name)"
                },
                "plugin": {
                    "type": "string",
                    "description": "The plugin name (e.g., 'frontend', 'backend')"
                }
            },
            "required": ["skill_name", "plugin"]
        },
        "handler": get_skill_info
    },
    {
        "name": "marketplace_capabilities",
        "description": "List capabilities for cross-domain routing. Use this to understand what each domain can do.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "domain": {
                    "type": "string",
                    "description": "Optional domain filter (e.g., 'frontend', 'backend')"
                },
                "verb": {
                    "type": "string",
                    "description": "Optional verb filter (e.g., 'create', 'audit', 'test')"
                }
            },
            "required": []
        },
        "handler": list_capabilities
    },
    {
        "name": "marketplace_domain_agents",
        "description": "List all agents in a specific domain with their titles and descriptions.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "domain": {
                    "type": "string",
                    "description": "The domain name (e.g., 'frontend', 'backend', 'user-experience')"
                }
            },
            "required": ["domain"]
        },
        "handler": list_domain_agents
    },
    {
        "name": "marketplace_taxonomy",
        "description": "Get the taxonomy of domains, verbs, and artifacts used for cross-domain orchestration.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": []
        },
        "handler": get_domain_taxonomy
    },
    {
        "name": "marketplace_plugins_summary",
        "description": "Get a summary of all marketplace plugins with name, version, and brief description.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": []
        },
        "handler": list_plugins_summary
    }
]


def get_mcp_tool_definitions() -> List[Dict[str, Any]]:
    """Get MCP tool definitions for SDK integration.

    Returns:
        List of tool definitions without handlers (for listing)
    """
    return [
        {
            "name": tool["name"],
            "description": tool["description"],
            "inputSchema": tool["inputSchema"]
        }
        for tool in MCP_TOOLS
    ]


def get_mcp_tool_handlers() -> Dict[str, Any]:
    """Get MCP tool handlers mapping.

    Returns:
        Dict mapping tool names to handler functions
    """
    return {
        tool["name"]: tool["handler"]
        for tool in MCP_TOOLS
    }


def get_marketplace_mcp_allowed_tools() -> List[str]:
    """Get list of allowed tool names for ClaudeAgentOptions.

    Returns:
        List of tool names in MCP format
    """
    return [
        f"mcp__marketplace__{tool['name']}"
        for tool in MCP_TOOLS
    ]


# ============================================================================
# Standalone MCP Server (for direct use without SDK bridge)
# ============================================================================

async def handle_mcp_request(request: Dict[str, Any]) -> Dict[str, Any]:
    """Handle an MCP request.

    Args:
        request: MCP request dict with 'method' and 'params'

    Returns:
        MCP response dict
    """
    method = request.get('method', '')
    params = request.get('params', {})

    if method == 'tools/list':
        return {
            "tools": get_mcp_tool_definitions()
        }

    elif method == 'tools/call':
        tool_name = params.get('name', '')
        tool_args = params.get('arguments', {})

        handlers = get_mcp_tool_handlers()
        if tool_name not in handlers:
            return {
                "error": {
                    "code": -32601,
                    "message": f"Unknown tool: {tool_name}"
                }
            }

        try:
            result = await handlers[tool_name](tool_args)
            return result
        except Exception as e:
            return {
                "error": {
                    "code": -32000,
                    "message": f"Tool execution error: {str(e)}"
                }
            }

    return {
        "error": {
            "code": -32601,
            "message": f"Unknown method: {method}"
        }
    }


# CLI for testing
if __name__ == '__main__':
    import asyncio

    async def test_tools():
        """Test the MCP tools."""
        print("Testing marketplace MCP tools...\n")

        # Test search
        print("1. Search for 'frontend':")
        result = await search_plugins({'query': 'frontend'})
        print(result['content'][0]['text'][:500])
        print()

        # Test domain agents
        print("2. List frontend agents:")
        result = await list_domain_agents({'domain': 'frontend'})
        print(result['content'][0]['text'][:500])
        print()

        # Test capabilities
        print("3. List capabilities:")
        result = await list_capabilities({})
        print(result['content'][0]['text'][:500])
        print()

        # Test plugins summary
        print("4. Plugins summary:")
        result = await list_plugins_summary({})
        print(result['content'][0]['text'][:500])

    asyncio.run(test_tools())
