#!/bin/bash
# Documentation Plugin - Summary
# Summarizes documentation changes
#
# Exit codes:
#   0 = Always

set -euo pipefail

INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

cd "$CWD" 2>/dev/null || exit 0

MODIFIED=$(git diff --name-only 2>/dev/null || true)
if [[ -z "$MODIFIED" ]]; then
    exit 0
fi

SUMMARY=""

# Count changes
MD_COUNT=$(echo "$MODIFIED" | grep -ciE '\.(md|mdx)$' || echo "0")
API_DOCS=$(echo "$MODIFIED" | grep -ci 'api' || echo "0")
README=$(echo "$MODIFIED" | grep -ci 'readme' || echo "0")

if [[ "$MD_COUNT" -gt 0 ]]; then
    SUMMARY="${SUMMARY}📝 ${MD_COUNT} doc file(s). "
fi
if [[ "$README" -gt 0 ]]; then
    SUMMARY="${SUMMARY}📖 README updated. "
fi
if [[ "$API_DOCS" -gt 0 ]]; then
    SUMMARY="${SUMMARY}📡 API docs updated. "
fi

# Word count of changes
if command -v wc &>/dev/null; then
    WORDS_ADDED=$(git diff --stat 2>/dev/null | tail -1 | grep -oE '\d+ insertion' | grep -oE '\d+' || echo "0")
    if [[ "$WORDS_ADDED" -gt 0 ]]; then
        SUMMARY="${SUMMARY}+${WORDS_ADDED} lines. "
    fi
fi

if [[ -n "$SUMMARY" ]]; then
    echo "{\"systemMessage\": \"📚 Documentation: ${SUMMARY}\"}"
fi

exit 0
