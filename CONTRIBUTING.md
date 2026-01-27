# Contributing to Claude Marketplace

Thank you for contributing to the Claude Marketplace! This document provides guidelines for contributing new components.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch: `git checkout -b add-<component-type>-<component-name>`
4. Make your changes
5. Submit a pull request

## Component Guidelines

### Skills

Skills are slash commands that users can invoke with `/<skill-name>`. They extend Claude's capabilities with reusable prompts and instructions.

**File Structure:**
```
skills/<skill-name>/
├── skill.md          # The skill definition (required)
└── README.md         # Documentation (required)
```

**skill.md Format:**
```markdown
---
name: skill-name
description: Brief description of what this skill does
author: your-team
version: 1.0.0
tags: [category1, category2]
---

# Skill Instructions

Your skill prompt and instructions go here...
```

### Subagents

Subagents are specialized agents configured for specific domain tasks. They define the agent's behavior, available tools, and expertise area.

**File Structure:**
```
subagents/<agent-name>/
├── agent.md          # Agent definition (required)
└── README.md         # Documentation (required)
```

**agent.md Format:**
```markdown
---
name: agent-name
description: What this agent specializes in
author: your-team
version: 1.0.0
tags: [domain, expertise]
tools: [Tool1, Tool2]
---

# Agent System Prompt

Instructions that define the agent's behavior...
```

### Hooks

Hooks are shell commands or scripts that run in response to Claude Code events. They enable automation and integration with external tools.

**File Structure:**
```
hooks/<hook-name>/
├── hook.json         # Hook configuration (required)
├── script.sh         # Hook script (if applicable)
└── README.md         # Documentation (required)
```

**hook.json Format:**
```json
{
  "name": "hook-name",
  "description": "What this hook does",
  "author": "your-team",
  "version": "1.0.0",
  "event": "PreToolUse|PostToolUse|UserPromptSubmit|etc",
  "matcher": {
    "tool": "ToolName"
  },
  "command": "your-command-here",
  "timeout": 30000
}
```

### MCP Servers

MCP (Model Context Protocol) servers provide Claude with access to external tools and data sources.

**File Structure:**
```
mcp-servers/<server-name>/
├── src/              # Server source code
├── package.json      # Dependencies (for Node.js servers)
└── README.md         # Documentation (required)
```

## Documentation Requirements

Every component must include a README.md with:

1. **Overview**: What the component does
2. **Installation**: Step-by-step setup instructions
3. **Configuration**: Any required settings or environment variables
4. **Usage**: Examples of how to use the component
5. **Author**: Team or individual contact

## Registry Updates

When adding a component, update the appropriate `registry.json`:

```json
{
  "name": "your-component",
  "description": "Brief description",
  "author": "your-team",
  "version": "1.0.0",
  "tags": ["relevant", "tags"],
  "path": "./your-component"
}
```

## Pull Request Process

1. Ensure your component follows the guidelines above
2. Update the relevant registry.json
3. Test your component locally
4. Create a PR with a clear description
5. Address any review feedback

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help maintain a welcoming environment

## Questions?

Open a [GitHub Discussion](https://github.com/Helms-AI/claude-marketplace/discussions) for questions or suggestions.
