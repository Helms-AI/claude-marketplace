# Claude Marketplace

Enterprise marketplace for sharing Claude Code plugins across the organization.

## Quick Start

### Add the Marketplace

```bash
/plugin marketplace add Helms-AI/claude-marketplace
```

### Install a Plugin

```bash
# Install a skill
/plugin install code-review@helms-ai-marketplace

# Install an agent
/plugin install security-auditor@helms-ai-marketplace

# Install a hook
/plugin install pre-commit-lint@helms-ai-marketplace

# Install an MCP server
/plugin install jira-server@helms-ai-marketplace
```

### List Available Plugins

```bash
/plugin list helms-ai-marketplace
```

## Available Plugins

| Plugin | Type | Description |
|--------|------|-------------|
| **code-review** | Skill | Comprehensive code review with best practices and security checks |
| **api-docs** | Skill | Generate OpenAPI documentation from code |
| **security-auditor** | Agent | Security-focused agent for vulnerability assessment |
| **database-expert** | Agent | Database optimization and schema design specialist |
| **pre-commit-lint** | Hook | Run linting before git commit operations |
| **notify-slack** | Hook | Send Slack notifications on specific Claude actions |
| **jira-server** | MCP Server | Jira integration - create, update, and query issues |
| **confluence-server** | MCP Server | Confluence - search and create documentation |

## Directory Structure

```
claude-marketplace/
├── .claude-plugin/
│   └── marketplace.json      # Marketplace manifest
├── plugins/
│   ├── code-review/          # Code review skill
│   ├── api-docs/             # API documentation skill
│   ├── security-auditor/     # Security audit agent
│   ├── database-expert/      # Database specialist agent
│   ├── pre-commit-lint/      # Pre-commit lint hook
│   ├── notify-slack/         # Slack notification hook
│   ├── jira-server/          # Jira MCP server
│   └── confluence-server/    # Confluence MCP server
├── .github/                  # GitHub issue templates
├── CONTRIBUTING.md           # Contribution guidelines
└── LICENSE                   # MIT license
```

## Contributing

We welcome contributions from all teams! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Adding a New Plugin

1. Fork this repository
2. Create your plugin in `plugins/<plugin-name>/`
3. Add a `.claude-plugin/plugin.json` manifest
4. Add your plugin to `.claude-plugin/marketplace.json`
5. Submit a pull request

### Plugin Structure

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest (required)
├── skills/                   # Skills (for skill plugins)
│   └── <skill-name>/
│       └── SKILL.md
├── agents/                   # Agents (for agent plugins)
│   └── <agent-name>.md
├── scripts/                  # Scripts (for hooks)
└── README.md                 # Documentation (required)
```

### Plugin Manifest Example

```json
{
  "name": "my-plugin",
  "description": "What my plugin does",
  "version": "1.0.0",
  "skills": ["./skills/"],
  "agents": ["./agents/"],
  "hooks": { ... },
  "mcpServers": { ... }
}
```

## Environment Variables

Some plugins require environment variables:

| Plugin | Required Variables |
|--------|-------------------|
| **notify-slack** | `SLACK_WEBHOOK_URL` |
| **jira-server** | `JIRA_HOST`, `JIRA_EMAIL`, `JIRA_API_TOKEN` |
| **confluence-server** | `CONFLUENCE_HOST`, `CONFLUENCE_EMAIL`, `CONFLUENCE_API_TOKEN` |

## Support

- **Issues**: [GitHub Issues](https://github.com/Helms-AI/claude-marketplace/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Helms-AI/claude-marketplace/discussions)

## License

MIT License - See [LICENSE](./LICENSE) for details.
