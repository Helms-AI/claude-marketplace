#!/bin/bash
# Security Plugin - Output Secret Scanner
# Scans command output for accidentally exposed secrets
#
# Exit codes:
#   0 = Always (scanning is non-blocking)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)
OUTPUT=$(echo "$INPUT" | jq -r '.tool_result // empty')

if [[ -z "$OUTPUT" ]]; then
    exit 0
fi

SECRETS_FOUND=""

# AWS Access Key ID
if echo "$OUTPUT" | grep -qE 'AKIA[0-9A-Z]{16}'; then
    SECRETS_FOUND="${SECRETS_FOUND}AWS Key, "
fi

# GitHub/GitLab tokens
if echo "$OUTPUT" | grep -qE '(ghp_|gho_|glpat-)[a-zA-Z0-9_-]{20,}'; then
    SECRETS_FOUND="${SECRETS_FOUND}Git Token, "
fi

# Private key headers
if echo "$OUTPUT" | grep -qE '-----BEGIN.*PRIVATE KEY-----'; then
    SECRETS_FOUND="${SECRETS_FOUND}Private Key, "
fi

# JWT tokens
if echo "$OUTPUT" | grep -qE 'eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.'; then
    SECRETS_FOUND="${SECRETS_FOUND}JWT, "
fi

# Database URLs with credentials
if echo "$OUTPUT" | grep -qiE '(mysql|postgres|mongodb)://[^:]+:[^@]+@'; then
    SECRETS_FOUND="${SECRETS_FOUND}DB URL, "
fi

if [[ -n "$SECRETS_FOUND" ]]; then
    echo "{\"systemMessage\": \"🚨 SECURITY: Secrets in output: ${SECRETS_FOUND%. }. Rotate exposed credentials!\"}"
fi

exit 0
