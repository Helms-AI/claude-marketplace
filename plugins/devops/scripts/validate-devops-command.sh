#!/bin/bash
# DevOps Command Safety Validator
# Validates Bash commands before execution to prevent accidental production changes
#
# Exit codes:
#   0 = Allow command
#   2 = Block command (with reason on stderr)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [[ -z "$COMMAND" ]]; then
    exit 0  # No command to validate
fi

# =============================================================================
# CRITICAL: Commands that ALWAYS require confirmation
# =============================================================================

# Production deployment commands
if echo "$COMMAND" | grep -qiE '\b(kubectl\s+(apply|delete|scale|rollout)|helm\s+(install|upgrade|uninstall|delete))\b.*\b(prod|production)\b'; then
    echo "BLOCKED: Production Kubernetes/Helm operation detected. Use /devops-deployment-engineer explicitly." >&2
    exit 2
fi

# Terraform apply/destroy on production
if echo "$COMMAND" | grep -qiE '\bterraform\s+(apply|destroy)\b' && echo "$COMMAND" | grep -qiE '\b(prod|production)\b'; then
    echo "BLOCKED: Terraform apply/destroy on production. Use /devops-infrastructure-specialist explicitly." >&2
    exit 2
fi

# Direct database modifications
if echo "$COMMAND" | grep -qiE '\b(psql|mysql|mongo)\b.*\b(DROP|DELETE|TRUNCATE|ALTER)\b'; then
    echo "BLOCKED: Destructive database operation detected. Review carefully and run manually." >&2
    exit 2
fi

# AWS/GCP/Azure destructive operations
if echo "$COMMAND" | grep -qiE '\b(aws|gcloud|az)\b.*\b(delete|terminate|destroy|remove)\b.*\b(prod|production)\b'; then
    echo "BLOCKED: Cloud resource deletion in production. Review and run manually." >&2
    exit 2
fi

# =============================================================================
# WARNING: Commands that should be flagged but not blocked
# =============================================================================

# Any kubectl/helm without explicit namespace (could hit wrong namespace)
if echo "$COMMAND" | grep -qiE '\b(kubectl|helm)\s+(apply|delete|create)' && ! echo "$COMMAND" | grep -qE '\s(-n|--namespace)\s'; then
    echo '{"systemMessage": "⚠️ Warning: kubectl/helm command without explicit namespace. Consider adding -n <namespace>."}' 
    exit 0
fi

# Terraform without workspace check
if echo "$COMMAND" | grep -qiE '\bterraform\s+(apply|plan)' && ! echo "$COMMAND" | grep -qE 'terraform\s+workspace'; then
    echo '{"systemMessage": "⚠️ Warning: Terraform operation without workspace verification. Consider running terraform workspace show first."}'
    exit 0
fi

# Docker operations on production registries
if echo "$COMMAND" | grep -qiE '\bdocker\s+push\b.*\b(prod|production|latest)\b'; then
    echo '{"systemMessage": "⚠️ Warning: Pushing to production registry. Verify the image tag and registry."}'
    exit 0
fi

# =============================================================================
# Allow all other commands
# =============================================================================
exit 0
