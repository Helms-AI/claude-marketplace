# Recipe: Auth System

Implement a complete authentication system with login, registration, and security.

## Overview

| Property | Value |
|----------|-------|
| **Time** | ~20 minutes |
| **Difficulty** | ⭐⭐⭐ Advanced |
| **Domains** | security → backend → frontend → testing |

## Command

```bash
/pm-recipe auth-system --provider="jwt"
```

## What It Does

1. **Security** (3min)
   - Threat modeling
   - Auth flow design
   - Security requirements

2. **Backend** (8min)
   - User model
   - Auth endpoints
   - JWT/OAuth setup
   - Password hashing

3. **Frontend** (6min)
   - Login form
   - Registration form
   - Protected routes
   - Token management

4. **Testing** (3min)
   - Auth flow tests
   - Security tests

## Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `--provider` | No | "jwt", "oauth", "session" (default: jwt) |
| `--mfa` | No | Enable MFA (default: false) |
