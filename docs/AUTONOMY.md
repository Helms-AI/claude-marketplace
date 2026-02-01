# Autonomy Configuration Guide

Control how much oversight you want over agent actions in the Claude Marketplace.

## Quick Start

```bash
# View current settings
/pm-autonomy

# Switch to maximum oversight
/pm-autonomy set supervised

# Switch to balanced mode (default)
/pm-autonomy set assisted

# Switch to minimal oversight
/pm-autonomy set autonomous
```

## Profiles

| Profile | Description | Best For |
|---------|-------------|----------|
| **supervised** | Confirm everything | New users, sensitive environments |
| **assisted** | Confirm destructive actions | Most users (default) |
| **autonomous** | Confirm production only | Experienced users |

## Action Behaviors

| Action Type | Supervised | Assisted | Autonomous |
|-------------|------------|----------|------------|
| Read files | ✋ | ✅ | ✅ |
| Write files | ✋ | ✅ | ✅ |
| Edit files | ✋ | ✅ | ✅ |
| Delete files | ✋ | ✋ | ✅ |
| Run commands | ✋ | ✅ | ✅ |
| External APIs | ✋ | ✋ | ✅ |
| Deploy staging | ✋ | ✋ | ✅ |
| Deploy production | ✋ | ✋ | ✋ |

✅ = Auto-execute | ✋ = Requires confirmation

## Configuration File

Settings are stored in `.claude/autonomy.json`:

```json
{
  "profile": "assisted",
  "global": {
    "confirmDestructive": true,
    "confirmExternal": true,
    "confirmProduction": true
  },
  "domains": {
    "devops": {
      "deploy": "confirm",
      "rollback": "confirm"
    }
  }
}
```

## Custom Overrides

You can override settings per-domain:

```json
{
  "profile": "assisted",
  "domains": {
    "frontend": {
      "build": "auto",
      "publish": "confirm"
    },
    "devops": {
      "deploy": "confirm",
      "scale": "auto"
    }
  }
}
```

## Safety Guarantees

These actions **always** require confirmation, regardless of profile:

- 🔒 Production deployments
- 🔒 Database migrations on production
- 🔒 Secret rotation
- 🔒 Terraform destroy
- 🔒 kubectl delete on production namespaces

## Best Practices

1. **Start with `assisted`** - The default provides a good balance
2. **Use `supervised` for learning** - See exactly what the system does
3. **Upgrade to `autonomous` when confident** - After you trust the system
4. **Never disable production confirms** - Safety first
