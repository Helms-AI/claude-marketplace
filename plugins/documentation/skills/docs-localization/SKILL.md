---
name: docs-localization
description: Documentation localization and translation management
argument-hint: "[language|doc-path]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Documentation Localization

Manage translation of documentation to multiple languages.

## Capabilities

- Extract translatable content
- Maintain parallel doc structures
- Translation memory integration
- Quality checks for translations

## Directory Structure

```
docs/
├── en/           # Source language
│   ├── getting-started.md
│   └── api/
├── es/           # Spanish
│   ├── getting-started.md
│   └── api/
└── ja/           # Japanese
    ├── getting-started.md
    └── api/
```

## Translation Workflow

1. Write docs in source language (en/)
2. Extract to translation platform
3. Translate with context
4. Review and approve
5. Sync back to repo
