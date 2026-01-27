# Contributing to Claude Marketplace

Thank you for contributing to the Claude Marketplace! This document provides guidelines for contributing new plugins.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch: `git checkout -b add-plugin-<plugin-name>`
4. Make your changes
5. Submit a pull request

## Plugin Guidelines

### Plugin Structure

Every plugin must follow this structure:

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest (required)
├── skills/                   # For skill plugins
│   └── <skill-name>/
│       └── SKILL.md
├── agents/                   # For agent plugins
│   └── <agent-name>.md
├── scripts/                  # For hook scripts
└── README.md                 # Documentation (required)
```

### Plugin Manifest (plugin.json)

Every plugin requires a `.claude-plugin/plugin.json` file:

```json
{
  "name": "my-plugin",
  "description": "What this plugin does",
  "version": "1.0.0",
  "skills": ["./skills/"],
  "agents": ["./agents/"],
  "hooks": { ... },
  "mcpServers": { ... }
}
```

### Skills

Skills are slash commands that users invoke with `/<skill-name>`.

**SKILL.md Format:**
```markdown
---
name: skill-name
description: Brief description of what this skill does
---

# Skill Instructions

Your skill prompt and instructions go here...
```

### Agents

Agents are specialized assistants for domain-specific tasks.

**agent.md Format:**
```markdown
---
name: agent-name
description: What this agent specializes in
tools: [Tool1, Tool2]
---

# Agent System Prompt

Instructions that define the agent's behavior...
```

### Hooks

Hooks are shell commands that run in response to Claude Code events.

**plugin.json hooks format:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": {
          "tool": "Bash",
          "command": "git commit"
        },
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here"
          }
        ]
      }
    ]
  }
}
```

Use `${CLAUDE_PLUGIN_ROOT}` to reference files within your plugin.

### MCP Servers

MCP (Model Context Protocol) servers provide Claude with access to external tools and data sources.

**plugin.json mcpServers format:**
```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/dist/index.js"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
```

## Documentation Requirements

Every plugin must include a README.md with:

1. **Overview**: What the plugin does
2. **Installation**: `/plugin install <name>@helms-ai-marketplace`
3. **Configuration**: Any required environment variables
4. **Usage**: Examples of how to use the plugin
5. **Author**: Team or individual contact

## Marketplace Registration

When adding a plugin, update `.claude-plugin/marketplace.json`:

```json
{
  "name": "your-plugin",
  "source": "./plugins/your-plugin",
  "description": "Brief description",
  "version": "1.0.0",
  "author": {
    "name": "Your Team"
  },
  "category": "category-name",
  "tags": ["relevant", "tags"]
}
```

## Pull Request Process

1. Ensure your plugin follows the guidelines above
2. Update `.claude-plugin/marketplace.json` with your plugin
3. Test your plugin locally with `/plugin validate ./plugins/your-plugin`
4. Create a PR with a clear description
5. Address any review feedback

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help maintain a welcoming environment

## Questions?

Open a [GitHub Discussion](https://github.com/Helms-AI/claude-marketplace/discussions) for questions or suggestions.
