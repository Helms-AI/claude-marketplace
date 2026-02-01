#!/bin/bash
# Documentation Plugin - Markdown Validation
# Validates markdown files after Write/Edit
#
# Exit codes:
#   0 = Always (non-blocking)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Only check markdown files
if ! echo "$FILE_PATH" | grep -qiE '\.(md|mdx)$'; then
    exit 0
fi

if [[ ! -f "$FILE_PATH" ]]; then
    exit 0
fi

CONTENT=$(cat "$FILE_PATH" 2>/dev/null || echo "")
FILENAME=$(basename "$FILE_PATH")
ISSUES=""

# Check for broken internal links (common pattern)
BROKEN_LINKS=$(echo "$CONTENT" | grep -oE '\[.*\]\(\.?\.?/[^)]+\)' | while read link; do
    TARGET=$(echo "$link" | grep -oE '\(\.?\.?/[^)]+\)' | tr -d '()')
    if [[ -n "$TARGET" ]] && [[ "$TARGET" != http* ]] && [[ ! -f "$TARGET" ]]; then
        echo "$TARGET"
    fi
done | head -3)

if [[ -n "$BROKEN_LINKS" ]]; then
    ISSUES="${ISSUES}Possible broken links. "
fi

# Check for TODO/FIXME comments
TODO_COUNT=$(echo "$CONTENT" | grep -ciE '\b(TODO|FIXME|XXX)\b' || echo "0")
if [[ "$TODO_COUNT" -gt 0 ]]; then
    ISSUES="${ISSUES}${TODO_COUNT} TODO(s) remaining. "
fi

# Check for empty sections
if echo "$CONTENT" | grep -qE '^#+\s+\S+\s*$' && echo "$CONTENT" | grep -A1 '^#+' | grep -q '^$'; then
    ISSUES="${ISSUES}Empty sections detected. "
fi

if [[ -n "$ISSUES" ]]; then
    echo "{\"systemMessage\": \"📝 ${FILENAME}: ${ISSUES}\"}"
fi

exit 0
