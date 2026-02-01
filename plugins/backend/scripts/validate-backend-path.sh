#!/bin/bash
# Backend Plugin - Path Validation
# Validates backend file paths before Write/Edit
#
# Exit codes:
#   0 = Safe
#   2 = Blocked

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

FILENAME=$(basename "$FILE_PATH")

# Block direct edits to migration files (should be created, not edited)
if echo "$FILE_PATH" | grep -qiE '/migrations/.*\.(sql|ts|js)$' && [[ -f "$FILE_PATH" ]]; then
    echo "BLOCKED: Cannot edit existing migration files. Create a new migration instead." >&2
    exit 2
fi

# Warn about database seed files
if echo "$FILE_PATH" | grep -qiE '/(seed|seeds)/'; then
    echo '{"systemMessage": "⚠️ Modifying seed data. Verify data integrity."}'
fi

# Warn about auth-related files
if echo "$FILENAME" | grep -qiE '(auth|passport|jwt|session)'; then
    echo '{"systemMessage": "🔒 Modifying authentication code. Review security implications."}'
fi

exit 0
