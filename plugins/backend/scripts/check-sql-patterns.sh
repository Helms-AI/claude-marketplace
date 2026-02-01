#!/bin/bash
# Backend Plugin - SQL Pattern Check
# Checks for SQL injection vulnerabilities in written files
#
# Exit codes:
#   0 = Always (non-blocking)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Only check relevant files
if ! echo "$FILE_PATH" | grep -qiE '\.(ts|js|py|rb|go|java|php)$'; then
    exit 0
fi

# Get absolute path
if [[ "$FILE_PATH" != /* ]]; then
    FILE_PATH="${CWD}/${FILE_PATH}"
fi

if [[ ! -f "$FILE_PATH" ]]; then
    exit 0
fi

CONTENT=$(cat "$FILE_PATH" 2>/dev/null || echo "")
ISSUES=""

# Check for string concatenation in SQL
if echo "$CONTENT" | grep -qE "(SELECT|INSERT|UPDATE|DELETE|WHERE).*\+\s*['\"]?\s*\$|\$\{"; then
    ISSUES="${ISSUES}SQL string concatenation (injection risk), "
fi

# Check for raw queries without parameterization
if echo "$CONTENT" | grep -qiE '(query|execute|raw)\s*\(\s*[`'\''"]\s*(SELECT|INSERT|UPDATE|DELETE)'; then
    if ! echo "$CONTENT" | grep -qiE '\$\d|\?|\:\w+'; then
        ISSUES="${ISSUES}Raw SQL without parameters, "
    fi
fi

# Check for eval() with user input (code injection)
if echo "$CONTENT" | grep -qiE '\beval\s*\('; then
    ISSUES="${ISSUES}eval() usage (code injection risk), "
fi

if [[ -n "$ISSUES" ]]; then
    FILENAME=$(basename "$FILE_PATH")
    echo "{\"systemMessage\": \"🚨 Security patterns in ${FILENAME}: ${ISSUES%. }. Use parameterized queries.\"}"
fi

exit 0
