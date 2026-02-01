# Recipe: Data Pipeline

Build a data pipeline with transformations and orchestration.

## Overview

| Property | Value |
|----------|-------|
| **Time** | ~12 minutes |
| **Difficulty** | ⭐⭐⭐ Advanced |
| **Domains** | data → backend → devops |

## Command

```bash
/pm-recipe data-pipeline --name="user_analytics"
```

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--name` | Yes | Pipeline name |
| `--tool` | No | "dbt", "airflow", "prefect" |
