#!/bin/bash
# Backend Plugin - Database Command Validation
# Validates database commands before execution
#
# Exit codes:
#   0 = Safe to execute
#   2 = Blocked (dangerous operation)

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [[ -z "$COMMAND" ]]; then
    exit 0
fi

# Block destructive operations on production
if echo "$COMMAND" | grep -qiE '\b(psql|mysql|mongo)\b.*\b(DROP|DELETE|TRUNCATE)\b.*\b(prod|production)\b'; then
    echo "BLOCKED: Destructive database operation on production." >&2
    exit 2
fi

# Block raw SQL without migrations
if echo "$COMMAND" | grep -qiE '\b(psql|mysql)\b.*(-c|-e).*\b(ALTER|DROP|CREATE)\b'; then
    echo '{"systemMessage": "⚠️ Direct schema change detected. Consider using migrations instead."}'
    exit 0
fi

# Warn about migration commands
if echo "$COMMAND" | grep -qiE '(prisma|knex|drizzle|typeorm).*migrate'; then
    echo '{"systemMessage": "⚠️ Migration command detected. Ensure backup exists before running on production."}'
    exit 0
fi

exit 0
