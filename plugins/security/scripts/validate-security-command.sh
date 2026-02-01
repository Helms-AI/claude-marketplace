#!/bin/bash
# Security Command Validator
# Validates commands that could expose or compromise credentials
#
# Exit codes:
#   0 = Allow command
#   2 = Block command (with reason on stderr)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [[ -z "$COMMAND" ]]; then
    exit 0
fi

# =============================================================================
# CRITICAL: Commands that expose secrets
# =============================================================================

# Printing environment variables that might contain secrets
if echo "$COMMAND" | grep -qiE '\b(printenv|env)\b.*\b(SECRET|KEY|TOKEN|PASSWORD|CREDENTIALS)\b'; then
    echo "BLOCKED: Command may expose secrets via environment variables. Use a secrets manager instead." >&2
    exit 2
fi

# Cat/echo of credential files
if echo "$COMMAND" | grep -qiE '\b(cat|less|more|head|tail)\b.*\b(\.env|credentials|secrets?\.ya?ml|\.pem|\.key)\b'; then
    echo "BLOCKED: Attempting to read credential file directly. Access secrets through a vault or secrets manager." >&2
    exit 2
fi

# Curl with credentials in URL or headers
if echo "$COMMAND" | grep -qiE '\bcurl\b.*(-u|--user|Authorization)'; then
    echo "BLOCKED: Curl with inline credentials detected. Use environment variables or a credential helper." >&2
    exit 2
fi

# Vault unseal or root token operations
if echo "$COMMAND" | grep -qiE '\bvault\b.*(unseal|generate-root|operator\s+init)'; then
    echo "BLOCKED: Vault administrative operation. This should be done by authorized personnel only." >&2
    exit 2
fi

# AWS/GCP credential file access
if echo "$COMMAND" | grep -qiE '\b(cat|cp|mv)\b.*\.(aws/credentials|boto|gcloud)'; then
    echo "BLOCKED: Direct access to cloud credential files. Use cloud CLI auth commands instead." >&2
    exit 2
fi

# =============================================================================
# WARNING: Potentially risky operations
# =============================================================================

# Vault secret commands (allow but warn)
if echo "$COMMAND" | grep -qiE '\bvault\s+(read|write|kv)\b'; then
    echo '{"systemMessage": "⚠️ Vault secret operation. Ensure you have appropriate access and audit logging is enabled."}'
    exit 0
fi

# AWS Secrets Manager operations
if echo "$COMMAND" | grep -qiE '\baws\s+secretsmanager\b'; then
    echo '{"systemMessage": "⚠️ AWS Secrets Manager operation. Verify the secret name and ensure rotation is configured."}'
    exit 0
fi

# SSH key operations
if echo "$COMMAND" | grep -qiE '\bssh-keygen\b|\bssh-add\b'; then
    echo '{"systemMessage": "⚠️ SSH key operation. Ensure keys are properly secured and never committed to repos."}'
    exit 0
fi

# GPG/PGP operations
if echo "$COMMAND" | grep -qiE '\bgpg\b.*(--export|--import|--gen-key)'; then
    echo '{"systemMessage": "⚠️ GPG key operation. Protect private keys and use strong passphrases."}'
    exit 0
fi

exit 0
