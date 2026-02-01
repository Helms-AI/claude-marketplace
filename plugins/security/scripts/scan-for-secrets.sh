#!/bin/bash
# Security Plugin - Secret Scanner
# Scans written/edited files for accidentally committed secrets
#
# Exit codes:
#   0 = Always (scanning is non-blocking)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Get absolute path
if [[ "$FILE_PATH" != /* ]]; then
    FILE_PATH="${CWD}/${FILE_PATH}"
fi

# Only scan text files
if ! file "$FILE_PATH" 2>/dev/null | grep -qiE '(text|json|xml|yaml)'; then
    exit 0
fi

# Read file content (limit to first 100KB)
CONTENT=$(head -c 102400 "$FILE_PATH" 2>/dev/null || echo "")

if [[ -z "$CONTENT" ]]; then
    exit 0
fi

SECRETS_FOUND=""

# =============================================================================
# Check for common secret patterns
# =============================================================================

# AWS Access Key ID
if echo "$CONTENT" | grep -qE 'AKIA[0-9A-Z]{16}'; then
    SECRETS_FOUND="${SECRETS_FOUND}AWS Access Key ID, "
fi

# AWS Secret Access Key (40 char base64)
if echo "$CONTENT" | grep -qE '[A-Za-z0-9/+=]{40}' && echo "$CONTENT" | grep -qi 'aws\|secret'; then
    SECRETS_FOUND="${SECRETS_FOUND}Possible AWS Secret Key, "
fi

# GitHub tokens
if echo "$CONTENT" | grep -qE '(ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{22,})'; then
    SECRETS_FOUND="${SECRETS_FOUND}GitHub Token, "
fi

# GitLab tokens
if echo "$CONTENT" | grep -qE 'glpat-[a-zA-Z0-9-]{20,}'; then
    SECRETS_FOUND="${SECRETS_FOUND}GitLab Token, "
fi

# Slack tokens
if echo "$CONTENT" | grep -qE 'xox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*'; then
    SECRETS_FOUND="${SECRETS_FOUND}Slack Token, "
fi

# Private keys
if echo "$CONTENT" | grep -qE '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----'; then
    SECRETS_FOUND="${SECRETS_FOUND}Private Key, "
fi

# Generic API keys
if echo "$CONTENT" | grep -qiE '(api[_-]?key|apikey)["\s:=]+[a-zA-Z0-9_-]{20,}'; then
    SECRETS_FOUND="${SECRETS_FOUND}API Key, "
fi

# JWT tokens
if echo "$CONTENT" | grep -qE 'eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*'; then
    SECRETS_FOUND="${SECRETS_FOUND}JWT Token, "
fi

# Password assignments
if echo "$CONTENT" | grep -qiE '(password|passwd|pwd)["\s:=]+[^${\s][^\s"]{8,}'; then
    SECRETS_FOUND="${SECRETS_FOUND}Hardcoded Password, "
fi

# Database connection strings
if echo "$CONTENT" | grep -qiE '(mysql|postgres|mongodb|redis)://[^@]+:[^@]+@'; then
    SECRETS_FOUND="${SECRETS_FOUND}Database Connection String, "
fi

# =============================================================================
# Output findings
# =============================================================================

if [[ -n "$SECRETS_FOUND" ]]; then
    FILENAME=$(basename "$FILE_PATH")
    echo "{\"systemMessage\": \"🚨 SECURITY: Potential secrets found in ${FILENAME}: ${SECRETS_FOUND%. }. Review and remove before committing!\"}"
fi

exit 0
