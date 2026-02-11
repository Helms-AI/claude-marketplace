# Recipe: Security Audit

Perform a comprehensive security audit across the codebase.

## Overview

| Property | Value |
|----------|-------|
| **Time** | ~15 minutes |
| **Difficulty** | ⭐⭐⭐ Advanced |
| **Domains** | security → backend → frontend |

## Command

```bash
/pm-recipe security-audit --scope="full"
```

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--scope` | No | "full", "backend", "frontend" |
| `--compliance` | No | "owasp", "soc2", "gdpr" |
