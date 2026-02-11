# Recipe: API Endpoint

Create a REST or GraphQL API endpoint with tests and documentation.

## Overview

| Property | Value |
|----------|-------|
| **Time** | ~8 minutes |
| **Difficulty** | ⭐⭐ Intermediate |
| **Domains** | architecture → backend → testing → documentation |

## Command

```bash
/pm-recipe api-endpoint --name="users" --method="CRUD"
```

## What It Does

1. **Architecture** (1min)
   - API contract (OpenAPI)
   - Data model design

2. **Backend** (4min)
   - Route handlers
   - Service layer
   - Database model

3. **Testing** (2min)
   - Unit tests
   - Integration tests

4. **Documentation** (1min)
   - API reference

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--name` | Yes | Resource name (e.g., "users") |
| `--method` | No | "CRUD", "GET", "POST", etc. |
| `--auth` | No | Authentication required (default: true) |

## Example

```bash
# Full CRUD endpoint
/pm-recipe api-endpoint --name="products" --method="CRUD"

# Read-only endpoint
/pm-recipe api-endpoint --name="analytics" --method="GET"
```
