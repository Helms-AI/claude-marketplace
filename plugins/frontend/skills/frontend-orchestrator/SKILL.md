---
name: frontend-orchestrator
description: Routes frontend implementation requests to specialized skills and coordinates the implementation phase
argument-hint: "[component|feature|optimization]"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Task
---

# Dynamic Context

```
!git status --short -- '*.tsx' '*.ts' '*.css' '*.scss' 2>/dev/null | head -10
!cat package.json 2>/dev/null | jq -r '.dependencies | keys | .[:5] | join(", ")' 2>/dev/null
```

