# Claude Marketplace

Enterprise marketplace for sharing Claude Code components across the organization.

## Overview

This marketplace provides a centralized repository for teams to discover, share, and contribute Claude Code components:

| Component | Description | Location |
|-----------|-------------|----------|
| **Skills** | Slash commands that extend Claude's capabilities | [`/skills`](./skills) |
| **Subagents** | Specialized agents for domain-specific tasks | [`/subagents`](./subagents) |
| **Hooks** | Automation hooks that run on Claude events | [`/hooks`](./hooks) |
| **MCP Servers** | Model Context Protocol servers for external integrations | [`/mcp-servers`](./mcp-servers) |

## Quick Start

### Installing Components

```bash
# Clone the marketplace
git clone https://github.com/Helms-AI/claude-marketplace.git

# Install a skill
cp claude-marketplace/skills/code-review/code-review.md ~/.claude/skills/

# Install a hook
cp claude-marketplace/hooks/pre-commit-lint/hook.json ~/.claude/hooks/

# Install a subagent (add to your settings)
# See specific subagent README for configuration
```

### Configuration Locations

Claude Code looks for configuration in these locations:

- **Skills**: `~/.claude/skills/` or project `.claude/skills/`
- **Hooks**: Configured in `~/.claude/settings.json` or project `.claude/settings.json`
- **MCP Servers**: Configured in `~/.claude/settings.json`

## Directory Structure

```
claude-marketplace/
├── skills/                 # Slash command skills
│   ├── registry.json       # Skills registry
│   └── <skill-name>/
│       ├── skill.md        # Skill definition
│       └── README.md       # Documentation
├── subagents/              # Specialized agents
│   ├── registry.json       # Subagents registry
│   └── <agent-name>/
│       ├── agent.md        # Agent definition
│       └── README.md       # Documentation
├── hooks/                  # Automation hooks
│   ├── registry.json       # Hooks registry
│   └── <hook-name>/
│       ├── hook.json       # Hook configuration
│       └── README.md       # Documentation
├── mcp-servers/            # MCP server implementations
│   ├── registry.json       # MCP servers registry
│   └── <server-name>/
│       ├── src/            # Server source code
│       └── README.md       # Documentation
└── scripts/                # Installation & utility scripts
```

## Contributing

We welcome contributions from all teams! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Adding a New Component

1. Fork this repository
2. Create your component in the appropriate directory
3. Add an entry to the relevant `registry.json`
4. Submit a pull request

### Component Requirements

All components must include:
- A `README.md` with usage documentation
- Clear description of functionality
- Author/team information
- Version number

## Registry Format

Each component type has a `registry.json` for discoverability:

```json
{
  "version": "1.0",
  "components": [
    {
      "name": "component-name",
      "description": "Brief description",
      "author": "team-name",
      "version": "1.0.0",
      "tags": ["tag1", "tag2"],
      "path": "./component-name"
    }
  ]
}
```

## Support

- **Issues**: [GitHub Issues](https://github.com/Helms-AI/claude-marketplace/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Helms-AI/claude-marketplace/discussions)

## License

MIT License - See [LICENSE](./LICENSE) for details.
