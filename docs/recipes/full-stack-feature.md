# Recipe: Full-Stack Feature

Build a complete feature from design to deployment.

## Overview

| Property | Value |
|----------|-------|
| **Time** | ~15 minutes |
| **Difficulty** | ⭐⭐⭐ Advanced |
| **Domains** | architecture → backend → user-experience → frontend → testing → documentation |

## Command

```bash
/pm-recipe full-stack-feature --name="User Profile"
```

## What It Does

1. **Architecture** (2min)
   - System design decisions
   - API contract definition
   - Data flow diagram

2. **Backend** (4min)
   - Database schema
   - API endpoints
   - Business logic

3. **User Experience** (2min)
   - Aesthetic brief
   - Component specifications
   - Interaction patterns

4. **Frontend** (4min)
   - React/Vue components
   - State management
   - API integration

5. **Testing** (2min)
   - Unit tests
   - Integration tests
   - E2E tests

6. **Documentation** (1min)
   - API documentation
   - User guide

## Expected Artifacts

```
docs/
├── architecture/
│   └── user-profile-adr.md
├── api/
│   └── user-profile.md
└── guides/
    └── user-profile-guide.md

src/
├── api/
│   └── user-profile/
│       ├── controller.ts
│       ├── service.ts
│       └── model.ts
├── components/
│   └── UserProfile/
│       ├── UserProfile.tsx
│       ├── UserProfile.test.tsx
│       └── index.ts
└── prisma/
    └── migrations/
        └── xxx_add_user_profile.sql

tests/
├── unit/
│   └── user-profile.test.ts
├── integration/
│   └── user-profile.api.test.ts
└── e2e/
    └── user-profile.spec.ts
```

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--name` | Yes | Feature name (e.g., "User Profile") |
| `--stack` | No | Tech stack (default: "react-node") |
| `--skip` | No | Domains to skip (e.g., "testing,docs") |

## Example

```bash
# Full feature
/pm-recipe full-stack-feature --name="Shopping Cart"

# Skip testing and docs
/pm-recipe full-stack-feature --name="Dashboard" --skip="testing,docs"

# Vue + Python stack
/pm-recipe full-stack-feature --name="Analytics" --stack="vue-python"
```

## Related Recipes

- [API Endpoint](./api-endpoint.md) - Just the backend
- [React Component](./react-component.md) - Just the frontend
- [Auth System](./auth-system.md) - Authentication features
