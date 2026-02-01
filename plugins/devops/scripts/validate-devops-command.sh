#!/bin/bash
# DevOps Plugin - Command Validation
# Validates DevOps/infrastructure commands
#
# Exit codes:
#   0 = Safe
#   2 = Blocked

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [[ -z "$COMMAND" ]]; then
    exit 0
fi

# Block production k8s/helm without explicit namespace
if echo "$COMMAND" | grep -qiE '\b(kubectl|helm)\s+(apply|delete|scale)' && echo "$COMMAND" | grep -qiE '\b(prod|production)\b'; then
    if ! echo "$COMMAND" | grep -qE '(-n|--namespace)\s+\S+'; then
        echo "BLOCKED: Production kubectl/helm requires explicit namespace." >&2
        exit 2
    fi
fi

# Block terraform destroy on production
if echo "$COMMAND" | grep -qiE '\bterraform\s+destroy\b.*\b(prod|production)\b'; then
    echo "BLOCKED: terraform destroy on production requires manual execution." >&2
    exit 2
fi

# Warn about terraform apply
if echo "$COMMAND" | grep -qiE '\bterraform\s+apply\b'; then
    echo '{"systemMessage": "⚠️ Terraform apply detected. Ensure plan was reviewed."}'
fi

# Warn about docker push to registries
if echo "$COMMAND" | grep -qiE '\bdocker\s+push\b'; then
    echo '{"systemMessage": "⚠️ Docker push detected. Verify image tag and registry."}'
fi

exit 0
