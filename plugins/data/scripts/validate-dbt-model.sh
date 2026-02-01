#!/bin/bash
# Data Plugin - dbt Model Validation
# Validates dbt models after Write/Edit
#
# Exit codes:
#   0 = Always (non-blocking)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Only check dbt SQL files
if ! echo "$FILE_PATH" | grep -qiE '/(models|macros)/.*\.sql$'; then
    exit 0
fi

FILENAME=$(basename "$FILE_PATH")
ISSUES=""

# Read file content
CONTENT=$(cat "$FILE_PATH" 2>/dev/null || echo "")

# Check for SELECT * (bad practice in dbt)
if echo "$CONTENT" | grep -qiE '\bSELECT\s+\*\s+FROM\b'; then
    ISSUES="${ISSUES}SELECT * (explicitly select columns), "
fi

# Check for missing ref() or source()
if echo "$CONTENT" | grep -qiE '\bFROM\s+[a-z_]+\b' && ! echo "$CONTENT" | grep -qiE '(\{\{.*ref.*\}\}|\{\{.*source.*\}\})'; then
    ISSUES="${ISSUES}Missing ref()/source() (use jinja), "
fi

# Check for hardcoded schemas
if echo "$CONTENT" | grep -qiE '\bFROM\s+(prod|stg|raw)\.[a-z_]+'; then
    ISSUES="${ISSUES}Hardcoded schema (use variables), "
fi

if [[ -n "$ISSUES" ]]; then
    echo "{\"systemMessage\": \"📊 dbt model ${FILENAME}: ${ISSUES%. }\"}"
fi

exit 0
