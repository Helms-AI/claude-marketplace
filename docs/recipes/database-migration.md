# Recipe: Database Migration

Create and test a database migration safely.

## Overview

| Property | Value |
|----------|-------|
| **Time** | ~10 minutes |
| **Difficulty** | ⭐⭐ Intermediate |
| **Domains** | backend → testing → devops |

## Command

```bash
/pm-recipe database-migration --name="add_user_roles"
```

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--name` | Yes | Migration name |
| `--orm` | No | "prisma", "drizzle", "knex" |
