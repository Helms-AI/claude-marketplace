#!/bin/bash
# Architecture Plugin - ADR Validation
# Validates Architecture Decision Records
#
# Exit codes:
#   0 = Always (non-blocking)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Only check ADR files
if ! echo "$FILE_PATH" | grep -qiE '(adr|decisions)/.*\.md$'; then
    exit 0
fi

CONTENT=$(cat "$FILE_PATH" 2>/dev/null || echo "")
ISSUES=""

# Check for required ADR sections
if ! echo "$CONTENT" | grep -qiE '^#+\s*(status|context|decision|consequences)'; then
    ISSUES="${ISSUES}Missing ADR sections (Status/Context/Decision/Consequences). "
fi

# Check for status field
if ! echo "$CONTENT" | grep -qiE '\bstatus:\s*(proposed|accepted|deprecated|superseded)\b'; then
    ISSUES="${ISSUES}Missing or invalid status. "
fi

# Check for date
if ! echo "$CONTENT" | grep -qiE '\bdate:\s*\d{4}'; then
    ISSUES="${ISSUES}Missing date. "
fi

if [[ -n "$ISSUES" ]]; then
    FILENAME=$(basename "$FILE_PATH")
    echo "{\"systemMessage\": \"📄 ADR ${FILENAME}: ${ISSUES}\"}"
fi

exit 0
