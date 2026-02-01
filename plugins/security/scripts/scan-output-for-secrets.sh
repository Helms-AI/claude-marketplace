#!/bin/bash
# Secret Output Scanner
# Scans command output for accidentally exposed secrets
# 
# This is a PostToolUse hook - it cannot block, only warn

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Get the tool output (this contains the command result)
# Note: In PostToolUse, tool_result contains the output
OUTPUT=$(echo "$INPUT" | jq -r '.tool_result // empty')

if [[ -z "$OUTPUT" ]]; then
    exit 0
fi

# =============================================================================
# Check for common secret patterns in output
# =============================================================================

WARNINGS=""

# AWS Access Key pattern (AKIA...)
if echo "$OUTPUT" | grep -qE 'AKIA[0-9A-Z]{16}'; then
    WARNINGS="${WARNINGS}AWS Access Key ID detected in output. "
fi

# AWS Secret Key pattern (40 char base64)
if echo "$OUTPUT" | grep -qE '[A-Za-z0-9/+=]{40}' && echo "$OUTPUT" | grep -qi 'secret'; then
    WARNINGS="${WARNINGS}Possible AWS Secret Key in output. "
fi

# GitHub/GitLab tokens
if echo "$OUTPUT" | grep -qE '(ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9-]{20})'; then
    WARNINGS="${WARNINGS}GitHub/GitLab token detected. "
fi

# Generic API key patterns
if echo "$OUTPUT" | grep -qiE '(api[_-]?key|apikey|api[_-]?secret)["\s:=]+[a-zA-Z0-9]{20,}'; then
    WARNINGS="${WARNINGS}API key pattern detected. "
fi

# Private key headers
if echo "$OUTPUT" | grep -qE '-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----'; then
    WARNINGS="${WARNINGS}Private key exposed in output! "
fi

# JWT tokens
if echo "$OUTPUT" | grep -qE 'eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*'; then
    WARNINGS="${WARNINGS}JWT token in output. "
fi

# Password patterns
if echo "$OUTPUT" | grep -qiE '(password|passwd|pwd)["\s:=]+[^\s"]{8,}'; then
    WARNINGS="${WARNINGS}Password pattern detected. "
fi

# =============================================================================
# Output warning if secrets detected
# =============================================================================

if [[ -n "$WARNINGS" ]]; then
    echo "{\"systemMessage\": \"🚨 SECURITY WARNING: ${WARNINGS}Review output carefully and rotate any exposed credentials.\"}"
fi

exit 0
