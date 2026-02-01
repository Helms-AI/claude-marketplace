#!/bin/bash
# Frontend Plugin - Lint Check
# Runs linting on modified frontend files after Write/Edit
#
# Exit codes:
#   0 = Lint passed or not a lintable file
#   (Never blocks - just provides warnings)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract file info
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Get file extension
FILENAME=$(basename "$FILE_PATH")
EXTENSION="${FILENAME##*.}"

# Only lint frontend files
case "$EXTENSION" in
    ts|tsx|js|jsx|vue|svelte|css|scss)
        ;;
    *)
        exit 0
        ;;
esac

# Check if we're in a directory with linting configured
cd "$CWD" 2>/dev/null || exit 0

WARNINGS=""
LINT_AVAILABLE=false

# Check for ESLint
if [[ -f "node_modules/.bin/eslint" ]] || command -v eslint &>/dev/null; then
    LINT_AVAILABLE=true
    
    # Run ESLint on the file (non-blocking)
    if [[ -f ".eslintrc.js" ]] || [[ -f ".eslintrc.json" ]] || [[ -f "eslint.config.js" ]]; then
        LINT_OUTPUT=$(npx eslint "$FILE_PATH" --format compact 2>&1 || true)
        
        if echo "$LINT_OUTPUT" | grep -q "error"; then
            ERROR_COUNT=$(echo "$LINT_OUTPUT" | grep -c "error" || echo "0")
            WARNINGS="${WARNINGS}ESLint: ${ERROR_COUNT} error(s). "
        fi
        
        if echo "$LINT_OUTPUT" | grep -q "warning"; then
            WARN_COUNT=$(echo "$LINT_OUTPUT" | grep -c "warning" || echo "0")
            WARNINGS="${WARNINGS}ESLint: ${WARN_COUNT} warning(s). "
        fi
    fi
fi

# Check for Prettier formatting
if [[ -f "node_modules/.bin/prettier" ]] || command -v prettier &>/dev/null; then
    if [[ -f ".prettierrc" ]] || [[ -f ".prettierrc.json" ]] || [[ -f "prettier.config.js" ]]; then
        # Check if file needs formatting
        if ! npx prettier --check "$FILE_PATH" &>/dev/null; then
            WARNINGS="${WARNINGS}Prettier: File needs formatting. "
        fi
    fi
fi

# Check for TypeScript errors (if .ts/.tsx file)
if [[ "$EXTENSION" == "ts" ]] || [[ "$EXTENSION" == "tsx" ]]; then
    if [[ -f "node_modules/.bin/tsc" ]] && [[ -f "tsconfig.json" ]]; then
        # Quick type check (non-blocking)
        TS_OUTPUT=$(npx tsc --noEmit --skipLibCheck 2>&1 | grep "$FILE_PATH" || true)
        if [[ -n "$TS_OUTPUT" ]]; then
            TS_ERROR_COUNT=$(echo "$TS_OUTPUT" | wc -l | tr -d ' ')
            WARNINGS="${WARNINGS}TypeScript: ${TS_ERROR_COUNT} issue(s). "
        fi
    fi
fi

# Output warnings if any
if [[ -n "$WARNINGS" ]]; then
    echo "{\"systemMessage\": \"⚠️ Quality check for ${FILENAME}: ${WARNINGS}Run 'npm run lint:fix' to auto-fix.\"}"
elif $LINT_AVAILABLE; then
    # Silently pass if no issues
    :
fi

exit 0
