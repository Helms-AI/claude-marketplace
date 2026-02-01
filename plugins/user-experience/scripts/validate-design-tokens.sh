#!/bin/bash
# User Experience Plugin - Design Token Validation
# Validates design tokens and style files
#
# Exit codes:
#   0 = Always (non-blocking)

set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

FILENAME=$(basename "$FILE_PATH")
ISSUES=""

# Check design token files
if echo "$FILE_PATH" | grep -qiE '(tokens?|design-system|theme)\.(json|ya?ml|ts|js)$'; then
    if [[ -f "$FILE_PATH" ]]; then
        CONTENT=$(cat "$FILE_PATH" 2>/dev/null || echo "")
        
        # Check for hardcoded hex colors (should use semantic tokens)
        HEX_COUNT=$(echo "$CONTENT" | grep -coE '#[0-9a-fA-F]{6}' || echo "0")
        if [[ "$HEX_COUNT" -gt 5 ]]; then
            ISSUES="${ISSUES}${HEX_COUNT} hardcoded colors (prefer semantic tokens). "
        fi
        
        # Check for px values (consider using rem)
        PX_COUNT=$(echo "$CONTENT" | grep -coE '\d+px' || echo "0")
        if [[ "$PX_COUNT" -gt 10 ]]; then
            ISSUES="${ISSUES}${PX_COUNT} px values (consider rem for scalability). "
        fi
    fi
fi

# Check CSS files for accessibility
if echo "$FILENAME" | grep -qiE '\.(css|scss|less)$'; then
    if [[ -f "$FILE_PATH" ]]; then
        CONTENT=$(cat "$FILE_PATH" 2>/dev/null || echo "")
        
        # Check for focus removal (accessibility issue)
        if echo "$CONTENT" | grep -qiE 'outline:\s*none|:focus\s*\{[^}]*outline:\s*0'; then
            ISSUES="${ISSUES}⚠️ Focus styles removed (accessibility issue). "
        fi
        
        # Check for small text
        if echo "$CONTENT" | grep -qE 'font-size:\s*(0\.[0-9]+rem|1[0-1]px)'; then
            ISSUES="${ISSUES}Very small text detected. "
        fi
    fi
fi

if [[ -n "$ISSUES" ]]; then
    echo "{\"systemMessage\": \"🎨 UX validation: ${ISSUES}\"}"
fi

exit 0
