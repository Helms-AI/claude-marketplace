#!/bin/bash
# DevOps Plugin - Infrastructure Change Validation
# Validates Terraform, K8s, and CI/CD file changes
#
# Exit codes:
#   0 = Always (non-blocking)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

FILENAME=$(basename "$FILE_PATH")
MESSAGES=""

# Terraform files
if echo "$FILENAME" | grep -qE '\.tf$'; then
    MESSAGES="${MESSAGES}📋 Terraform changed. Run 'terraform plan' before apply. "
fi

# Kubernetes manifests
if echo "$FILE_PATH" | grep -qiE '(k8s|kubernetes|manifests)/.*\.ya?ml$'; then
    MESSAGES="${MESSAGES}📋 K8s manifest changed. Run 'kubectl diff' before apply. "
fi

# Helm values
if echo "$FILENAME" | grep -qiE '^values.*\.ya?ml$'; then
    MESSAGES="${MESSAGES}📋 Helm values changed. Test with 'helm template'. "
fi

# CI/CD workflows
if echo "$FILE_PATH" | grep -qiE '\.github/workflows/'; then
    MESSAGES="${MESSAGES}📋 GitHub Actions workflow changed. Review carefully. "
fi

# Dockerfiles
if echo "$FILENAME" | grep -qiE '^Dockerfile'; then
    MESSAGES="${MESSAGES}📋 Dockerfile changed. Rebuild and test image. "
fi

if [[ -n "$MESSAGES" ]]; then
    echo "{\"systemMessage\": \"${MESSAGES}\"}"
fi

exit 0
