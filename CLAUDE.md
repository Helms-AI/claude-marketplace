# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an enterprise marketplace for sharing Claude Code plugins. It contains reusable skills, agents, hooks, and MCP servers that can be installed across projects.

## Plugin Versioning Schema

**CRITICAL:** All plugins use semantic versioning `{X}.{Y}.{Z}` with these rules:

| Segment | When to Increment | Examples |
|---------|-------------------|----------|
| **Z (Patch)** | Modify existing agents, skills, hooks | Fix typo in skill prompt, update agent instructions |
| **Y (Minor)** | Add, modify, or delete agents, skills, hooks | Add new skill, remove deprecated agent, add hook |
| **X (Major)** | Global changes affecting plugin behavior | Restructure plugin architecture, breaking changes |

**Version Increment Rules:**
- **Once per commit**: Only increment the version ONCE per commit, regardless of how many changes are made. If you add 3 skills and modify 2 agents before committing, that's still only ONE version bump.
- **Highest level wins**: If changes span multiple levels (e.g., both patch and minor changes), only increment the highest level (minor in this case).
- **Check before incrementing**: Before bumping a version, check if it was already incremented in the current uncommitted changes using `git diff`.

**After changes to a plugin** (once per commit), update the version in:
1. `plugins/<name>/.claude-plugin/plugin.json` - the `version` field
2. `.claude-plugin/marketplace.json` - the corresponding plugin's `version` field

## Architecture

```
claude-marketplace/
├── .claude-plugin/
│   └── marketplace.json      # Registry of all plugins with metadata
└── plugins/
    └── <plugin-name>/
        ├── .claude-plugin/
        │   └── plugin.json   # Plugin manifest (version, hooks, config)
        ├── skills/           # Slash commands (SKILL.md files)
        ├── agents/           # Specialized assistants (.md files)
        ├── scripts/          # Hook scripts
        └── README.md
```

### Plugin Types

- **Skills**: User-invocable commands via `/<skill-name>` - defined in `skills/<name>/SKILL.md`
- **Agents**: Domain-specific assistants - defined in `agents/<name>.md`
- **Hooks**: Event-triggered actions (PreToolUse, PostToolUse) - defined in `plugin.json`
- **MCP Servers**: External tool integrations - defined in `plugin.json` under `mcpServers`

### Marketplace Registration

When adding/modifying plugins, update `.claude-plugin/marketplace.json` with:
- `name`, `source`, `description`, `version`
- `author` (object with `name`)
- `category`, `tags` for discoverability

**Note:** Only these fields are valid in marketplace.json. Additional metadata (skills list, agents list, technologies) should be documented in the plugin's README.md instead.

## Current Plugins

### UX Plugin (v2.0.0)
Location: `plugins/ux/`

A conversational UX team with 8 agent personas and 12 skills:
- **Agents**: Jordan Chen (Lead), Maya Torres (Research), Alex Kim (Architecture), Sam Rivera (Systems), Jordan Park (Motion), Casey Williams (A11y), Riley Chen (Responsive), Taylor Brooks (Performance)
- **Skills**: ux-orchestrator, ux-team-session, ux-design-system, ux-component-architect, ux-motion-designer, ux-accessibility-auditor, ux-responsive-engineer, ux-performance-engineer, ux-user-researcher, ux-data-viz, ux-storybook, ux-figma-sync
- **Hooks**: PreToolUse (accessibility reminders for .tsx/.jsx/.vue/.svelte), PostToolUse (responsive reminders for .css, motion reminders for animation files)

## Validation

Test plugins locally before committing:
```bash
/plugin validate ./plugins/<plugin-name>
```

## File Formats

### plugin.json (Valid Schema)
```json
{
  "name": "plugin-name",
  "description": "What this plugin does",
  "version": "1.0.0",
  "skills": ["./skills/"]
}
```

**Note:** The `agents` and `hooks` fields have strict schema requirements that may cause validation errors. Currently, only `skills` is reliably supported. Agent personas should be implemented as skills or included in skill prompts.

### SKILL.md
```markdown
---
name: skill-name
description: Brief description
---
# Instructions here
```

Use `${CLAUDE_PLUGIN_ROOT}` to reference files within the plugin directory.
