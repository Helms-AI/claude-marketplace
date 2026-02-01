#!/bin/bash
# Security Plugin - Sensitive Path Check
# Validates file paths before Write/Edit to prevent modifying sensitive files
#
# Exit codes:
#   0 = Path is safe
#   2 = Path is sensitive (blocks the operation)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Get filename
FILENAME=$(basename "$FILE_PATH")

# =============================================================================
# BLOCKED: Sensitive files that should never be written by agents
# =============================================================================

# SSH keys and certificates
if echo "$FILENAME" | grep -qiE '^(id_rsa|id_ed25519|id_ecdsa|.*\.pem|.*\.key|.*\.crt|.*\.p12|.*\.pfx)$'; then
    echo "BLOCKED: Cannot write to private key or certificate files." >&2
    exit 2
fi

# Environment files with secrets
if echo "$FILENAME" | grep -qiE '^\.env(\.local|\.production|\.secret)?$'; then
    echo "BLOCKED: Cannot write to .env files. Use a secrets manager." >&2
    exit 2
fi

# Cloud credential files
if echo "$FILE_PATH" | grep -qiE '\.(aws|gcloud|azure)/|\.boto|\.kube/config'; then
    echo "BLOCKED: Cannot write to cloud credential configuration files." >&2
    exit 2
fi

# SSH config
if echo "$FILE_PATH" | grep -qiE '\.ssh/(config|known_hosts|authorized_keys)'; then
    echo "BLOCKED: Cannot modify SSH configuration files." >&2
    exit 2
fi

# Git credentials
if echo "$FILE_PATH" | grep -qiE '\.git-credentials|\.netrc'; then
    echo "BLOCKED: Cannot write to Git credential files." >&2
    exit 2
fi

# =============================================================================
# WARNINGS: Sensitive files that should be flagged
# =============================================================================

WARNINGS=""

# Secrets configuration files
if echo "$FILENAME" | grep -qiE '(secrets?|credentials?|auth).*\.(ya?ml|json|config)$'; then
    WARNINGS="Modifying secrets configuration file. "
fi

# Package manifests (could add malicious dependencies)
if echo "$FILENAME" | grep -qiE '^(package\.json|requirements\.txt|Gemfile|Cargo\.toml|go\.mod)$'; then
    WARNINGS="${WARNINGS}Modifying dependency file - review for unexpected packages. "
fi

# CI/CD configurations
if echo "$FILE_PATH" | grep -qiE '(\.github/workflows|\.gitlab-ci|Jenkinsfile|\.circleci)'; then
    WARNINGS="${WARNINGS}Modifying CI/CD pipeline - review for security implications. "
fi

# Docker/container files
if echo "$FILENAME" | grep -qiE '^(Dockerfile|docker-compose)'; then
    WARNINGS="${WARNINGS}Modifying container config - verify base images and exposed ports. "
fi

if [[ -n "$WARNINGS" ]]; then
    echo "{\"systemMessage\": \"🔒 Security notice: ${WARNINGS}\"}"
fi

exit 0
