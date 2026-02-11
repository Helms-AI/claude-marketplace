# Recipe: CI/CD Pipeline

Set up a complete CI/CD pipeline with security scanning.

## Overview

| Property | Value |
|----------|-------|
| **Time** | ~10 minutes |
| **Difficulty** | ⭐⭐ Intermediate |
| **Domains** | devops → security → documentation |

## Command

```bash
/pm-recipe cicd-pipeline --platform="github-actions"
```

## What It Does

1. **DevOps** (6min)
   - Workflow files
   - Build configuration
   - Deploy stages

2. **Security** (3min)
   - Dependency scanning
   - Secret management
   - Security gates

3. **Documentation** (1min)
   - Pipeline documentation

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--platform` | No | "github-actions", "gitlab-ci" |
| `--deploy` | No | Deploy target (e.g., "vercel", "aws") |
