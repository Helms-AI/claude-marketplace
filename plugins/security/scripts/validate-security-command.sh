#!/bin/bash
# Security Plugin - Command Validation
# Validates commands for security issues before execution
#
# Exit codes:
#   0 = Safe to execute
#   2 = Blocked (security risk)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [[ -z "$COMMAND" ]]; then
    exit 0
fi

# =============================================================================
# BLOCKED: Commands that expose credentials
# =============================================================================

# Environment variables with secrets
if echo "$COMMAND" | grep -qiE '\b(printenv|env)\b.*\b(SECRET|KEY|TOKEN|PASSWORD|CREDENTIALS)\b'; then
    echo "BLOCKED: Command may expose secrets via environment variables." >&2
    exit 2
fi

# Reading credential files
if echo "$COMMAND" | grep -qiE '\b(cat|less|more|head|tail)\b.*\b(\.env|credentials|secrets?\.ya?ml|\.pem|\.key|id_rsa)\b'; then
    echo "BLOCKED: Attempting to read credential file directly." >&2
    exit 2
fi

# Curl with inline credentials
if echo "$COMMAND" | grep -qiE '\bcurl\b.*(-u|--user|Authorization:\s*Bearer)'; then
    echo "BLOCKED: Curl with inline credentials. Use environment variables." >&2
    exit 2
fi

# Vault administrative operations
if echo "$COMMAND" | grep -qiE '\bvault\b.*(unseal|generate-root|operator\s+init)'; then
    echo "BLOCKED: Vault administrative operation requires authorized personnel." >&2
    exit 2
fi

# AWS credential file access
if echo "$COMMAND" | grep -qiE '\b(cat|cp|mv)\b.*\.(aws/credentials|boto)'; then
    echo "BLOCKED: Direct access to cloud credential files." >&2
    exit 2
fi

# =============================================================================
# BLOCKED: Dangerous network operations
# =============================================================================

# Downloading and executing scripts
if echo "$COMMAND" | grep -qiE 'curl.*\|\s*(bash|sh|python|ruby|perl)'; then
    echo "BLOCKED: Downloading and executing remote scripts is a security risk." >&2
    exit 2
fi

# Netcat listeners
if echo "$COMMAND" | grep -qiE '\bnc\b.*-l.*-e'; then
    echo "BLOCKED: Netcat with execution is a security risk." >&2
    exit 2
fi

# =============================================================================
# WARNINGS: Potentially risky operations
# =============================================================================

# Vault secret operations (allow but warn)
if echo "$COMMAND" | grep -qiE '\bvault\s+(read|write|kv)\b'; then
    echo '{"systemMessage": "⚠️ Vault operation detected. Ensure audit logging is enabled."}'
    exit 0
fi

# SSH key generation
if echo "$COMMAND" | grep -qiE '\bssh-keygen\b'; then
    echo '{"systemMessage": "⚠️ SSH key generation. Ensure keys are secured with strong passphrases."}'
    exit 0
fi

# AWS secret operations
if echo "$COMMAND" | grep -qiE '\baws\s+secretsmanager\b'; then
    echo '{"systemMessage": "⚠️ AWS Secrets Manager operation. Verify you have appropriate access."}'
    exit 0
fi

exit 0
