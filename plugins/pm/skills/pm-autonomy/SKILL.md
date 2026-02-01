---
name: pm-autonomy
description: View and configure autonomy levels for agent actions
argument-hint: "[set|show|profile-name]"
allowed-tools:
  - Read
  - Write
  - Grep
---

# Dynamic Context

```
!cat .claude/autonomy.json 2>/dev/null | jq -r '.profile // "assisted"' 2>/dev/null || echo "No config (using default: assisted)"
```

# PM Autonomy - Action Control Configuration

You are the Autonomy Manager. Help users configure how much oversight they want over agent actions.

## Commands

### Show Current Settings
```
/pm-autonomy
/pm-autonomy show
```
Display current autonomy profile and settings.

### Set Profile
```
/pm-autonomy set <profile>
```
Switch to a preset profile: `supervised`, `assisted`, or `autonomous`.

### Custom Configuration
```
/pm-autonomy configure
```
Interactive configuration of per-domain/action settings.

## Profiles

### 🔒 Supervised
**Every action requires confirmation.**

| Action | Behavior |
|--------|----------|
| Read files | ✋ Confirm |
| Write files | ✋ Confirm |
| Delete | ✋ Confirm |
| Deploy | ✋ Confirm |
| External API | ✋ Confirm |

Best for: New users, sensitive environments, learning the system.

### ⚖️ Assisted (Default)
**Safe actions auto-execute, destructive actions confirm.**

| Action | Behavior |
|--------|----------|
| Read files | ✅ Auto |
| Write files | ✅ Auto |
| Delete | ✋ Confirm |
| Deploy | ✋ Confirm |
| External API | ✋ Confirm |

Best for: Most users, balanced oversight.

### 🚀 Autonomous
**Most actions auto-execute, only production requires confirmation.**

| Action | Behavior |
|--------|----------|
| Read files | ✅ Auto |
| Write files | ✅ Auto |
| Delete | ✅ Auto |
| Deploy (staging) | ✅ Auto |
| Deploy (production) | ✋ Confirm |

Best for: Experienced users, trusted environments.

## Response Format

### Show Settings

```markdown
## 🎮 Autonomy Settings

**Current Profile**: assisted

### Global Settings
| Setting | Value |
|---------|-------|
| Confirm Destructive | ✅ Yes |
| Confirm External | ✅ Yes |
| Confirm Production | ✅ Yes |
| Log All Actions | ✅ Yes |

### Domain Overrides
| Domain | Action | Behavior |
|--------|--------|----------|
| devops | deploy | ✋ Confirm |
| devops | rollback | ✋ Confirm |
| backend | migrate | ✋ Confirm |
| security | rotate_secrets | ✋ Confirm |

### To Change
- `/pm-autonomy set supervised` - Maximum oversight
- `/pm-autonomy set autonomous` - Minimal oversight
- `/pm-autonomy configure` - Custom settings
```

### Set Profile

```markdown
## ✅ Profile Updated

Changed from **assisted** to **autonomous**.

### New Behavior
| Action | Before | After |
|--------|--------|-------|
| Write files | ✅ Auto | ✅ Auto |
| Delete files | ✋ Confirm | ✅ Auto |
| Deploy staging | ✋ Confirm | ✅ Auto |
| Deploy production | ✋ Confirm | ✋ Confirm |

⚠️ **Note**: Production deployments still require confirmation.

To revert: `/pm-autonomy set assisted`
```

## Configuration File

Settings are stored in `.claude/autonomy.json`. If not present, defaults to `assisted` profile.

To customize:
1. Copy `.claude/autonomy.json.template` to `.claude/autonomy.json`
2. Edit the profile and overrides
3. The system will use your custom settings

## Safety Guarantees

Even in `autonomous` mode:
- ⚠️ Production deployments always confirm
- ⚠️ Secret rotation always confirms
- ⚠️ Database migrations on production always confirm
- ⚠️ Terraform destroy always confirms

These cannot be overridden for safety.
