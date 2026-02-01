# Migration Guide: Claude Marketplace Modernization

This guide covers the changes introduced in the Phase 1-4 modernization of the Claude Marketplace plugin system, aligned with Claude Code best practices (January 2026).

## Overview

The modernization introduced:
- **Phase 1**: Critical safety controls (skill restrictions, production guards)
- **Phase 2**: Subagent conversion (58 agents with YAML frontmatter)
- **Phase 3**: Collaboration hooks (31 hook scripts across 10 plugins)
- **Phase 4**: Advanced features (MCP, LSP, styles, dynamic context)

## Breaking Changes

### Skill Frontmatter Changes

**Before:**
```yaml
---
name: frontend-component-architect
description: Build React/Vue/Svelte components
---
```

**After:**
```yaml
---
name: frontend-component-architect
description: Build React/Vue/Svelte components
argument-hint: "[component-name]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# Dynamic Context

```
!ls src/components/ 2>/dev/null | head -10
```
```

### Internal Skills Now Marked

Team session skills are now marked as internal:
```yaml
user-invocable: false
```

These skills won't appear in autocomplete but can still be invoked by orchestrators.

### Hooks Directory Structure

Each plugin now has:
```
plugins/<name>/
├── .claude-plugin/
│   ├── plugin.json      # Updated with hooks, mcp, lsp references
│   ├── mcp.json         # MCP server configuration (optional)
│   └── lsp.json         # LSP server configuration (optional)
├── hooks/
│   └── hooks.json       # Hook definitions
└── scripts/
    └── *.sh             # Hook implementation scripts
```

## New Features

### 1. MCP Server Integrations

Plugins can now declare MCP servers in `mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Plugins with MCP:**
- `pm` - GitHub, Filesystem
- `backend` - PostgreSQL, SQLite
- `data` - PostgreSQL, BigQuery
- `documentation` - Filesystem, Fetch
- `devops` - GitHub, Filesystem
- `security` - GitHub

### 2. LSP Integrations

Plugins can declare LSP servers in `lsp.json`:

```json
{
  "lspServers": {
    "typescript": {
      "command": "typescript-language-server",
      "args": ["--stdio"],
      "languages": ["typescript", "typescriptreact"]
    }
  }
}
```

**Plugins with LSP:**
- `frontend` - TypeScript, TailwindCSS, CSS
- `backend` - TypeScript, Python, Go, Rust
- `testing` - TypeScript, Vitest
- `data` - Python, SQL
- `architecture` - YAML, JSON
- `devops` - YAML, Dockerfile, Terraform

### 3. Dynamic Context

Skills can inject live context using `!command` syntax:

```yaml
# Dynamic Context

```
!git status --short
!cat package.json | jq '.dependencies | keys[:5]'
```
```

The output is injected into the skill context at invocation time.

### 4. Hook System

Hooks run at specific lifecycle points:

| Hook Type | When It Runs | Example Use |
|-----------|--------------|-------------|
| `PreToolUse` | Before Write/Edit/Bash | Path validation, command safety |
| `PostToolUse` | After Write/Edit/Bash | Linting, secret scanning |
| `SubagentStart` | When subagent spawns | Handoff validation |
| `SubagentStop` | When subagent completes | Changeset updates, summaries |
| `SessionStart` | On session start/resume | Context loading |

**Exit Codes:**
- `0` = Allow operation (with optional `systemMessage` warning)
- `2` = Block operation

**Example hooks.json:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate-path.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### 5. Output Styles

The PM plugin includes output style templates:

| Style | Use For |
|-------|---------|
| `technical-deep-dive` | Architecture reviews, debugging |
| `executive-summary` | Status updates, stakeholder briefings |
| `code-review` | PR reviews, code audits |

Located in `plugins/pm/.claude-plugin/styles/`.

### 6. Status Lines

Plugins define status line templates:

```json
{
  "statusLine": {
    "template": "Frontend | Components: ${component_count} | Lint: ${lint_status}",
    "refresh": "on-change"
  }
}
```

## Migration Steps

### For Existing Skills

1. **Add `argument-hint`** for better autocomplete:
   ```yaml
   argument-hint: "[component-name]"
   ```

2. **Add `allowed-tools`** to restrict tool access:
   ```yaml
   allowed-tools:
     - Read
     - Grep
     - Glob
   ```

3. **Add dynamic context** for relevant live data:
   ```yaml
   # Dynamic Context
   ```
   !relevant-command
   ```
   ```

4. **Mark internal skills**:
   ```yaml
   user-invocable: false
   ```

### For Plugins

1. **Update `plugin.json`** with new fields:
   ```json
   {
     "homepage": "https://...",
     "repository": "https://...",
     "license": "MIT",
     "keywords": ["..."],
     "hooks": "./hooks/hooks.json",
     "mcp": "./mcp.json",
     "lsp": "./lsp.json",
     "statusLine": {...}
   }
   ```

2. **Create hooks structure** if needed:
   ```bash
   mkdir -p plugins/<name>/hooks plugins/<name>/scripts
   ```

3. **Add hook scripts** with proper exit codes.

## High-Risk Skills

The following skills have `disable-model-invocation: true` and require manual invocation:

| Plugin | Skill | Reason |
|--------|-------|--------|
| devops | devops-deployment-engineer | Production deployments |
| devops | devops-infrastructure-specialist | Infrastructure changes |
| devops | devops-container-specialist | Container management |
| devops | devops-ci-architect | Pipeline modifications |
| security | security-secrets-manager | Secrets access |
| backend | backend-database-modeler | Schema changes |
| data | data-pipeline-architect | Pipeline execution |

## Safety Guards

### Blocked Operations

Hooks automatically block:
- Writing to `node_modules/`, `.git/`, lock files
- Production DB operations (DROP, DELETE, TRUNCATE)
- `terraform destroy` on production
- Direct credential file access
- Curl with inline credentials

### Warnings

Hooks warn on:
- Modifying config files (package.json, tsconfig)
- CI/CD pipeline changes
- Migration commands
- Vault/AWS secret operations

## Testing Your Migration

1. **Verify hooks work:**
   ```bash
   echo '{}' | plugins/<name>/scripts/<hook>.sh
   ```

2. **Check skill frontmatter:**
   ```bash
   head -20 plugins/<name>/skills/<skill>/SKILL.md
   ```

3. **Validate plugin.json:**
   ```bash
   cat plugins/<name>/.claude-plugin/plugin.json | jq .
   ```

## Rollback

If issues arise:
1. Hooks can be disabled by removing `hooks` from `plugin.json`
2. Skills can revert to basic frontmatter (name, description only)
3. MCP/LSP are optional and can be removed

## Support

- Issues: https://github.com/Helms-AI/claude-marketplace/issues
- Discussions: https://github.com/Helms-AI/claude-marketplace/discussions
