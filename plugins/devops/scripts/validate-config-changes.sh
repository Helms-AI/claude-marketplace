#!/bin/bash
# DevOps Configuration Change Validator
# Validates file changes to catch risky modifications to DevOps config files
#
# Exit codes:
#   0 = Allow (optionally with warnings)
#   2 = Block (not used for PostToolUse, but kept for consistency)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Get the filename for pattern matching
FILENAME=$(basename "$FILE_PATH")

# =============================================================================
# Check for sensitive configuration files
# =============================================================================

# Kubernetes manifests
if echo "$FILENAME" | grep -qiE '\.(yaml|yml)$' && echo "$FILE_PATH" | grep -qiE '(k8s|kubernetes|manifests|deploy)'; then
    echo '{"systemMessage": "📋 Kubernetes manifest modified. Remember to review with kubectl diff before applying."}'
    exit 0
fi

# Terraform files
if echo "$FILENAME" | grep -qiE '\.tf$'; then
    echo '{"systemMessage": "📋 Terraform file modified. Run terraform plan to preview changes before applying."}'
    exit 0
fi

# CI/CD workflow files
if echo "$FILE_PATH" | grep -qiE '(\.github/workflows|\.gitlab-ci|Jenkinsfile|\.circleci)'; then
    echo '{"systemMessage": "📋 CI/CD pipeline modified. Review deployment stages carefully before committing."}'
    exit 0
fi

# Docker files
if echo "$FILENAME" | grep -qiE '^(Dockerfile|docker-compose)'; then
    echo '{"systemMessage": "📋 Docker configuration modified. Rebuild and test images before pushing."}'
    exit 0
fi

# Helm charts
if echo "$FILE_PATH" | grep -qiE '(charts?/|helm/).*\.(yaml|yml)$' || echo "$FILENAME" | grep -qiE '^(values|Chart)\.ya?ml$'; then
    echo '{"systemMessage": "📋 Helm chart modified. Run helm template to verify generated manifests."}'
    exit 0
fi

exit 0
