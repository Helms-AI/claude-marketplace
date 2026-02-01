#!/bin/bash
# Frontend Plugin - Path Validation
# Validates file paths before Write/Edit to prevent accidental overwrites
#
# Exit codes:
#   0 = Path is safe
#   2 = Path is dangerous (blocks the operation)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract file info
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Get absolute path
if [[ "$FILE_PATH" != /* ]]; then
    FILE_PATH="${CWD}/${FILE_PATH}"
fi

# Normalize path
FILE_PATH=$(realpath -m "$FILE_PATH" 2>/dev/null || echo "$FILE_PATH")

# =============================================================================
# BLOCKED: Critical paths that should never be modified
# =============================================================================

# Block writes to node_modules
if echo "$FILE_PATH" | grep -q '/node_modules/'; then
    echo "BLOCKED: Cannot write to node_modules directory. Install packages via npm/yarn instead." >&2
    exit 2
fi

# Block writes to .git directory
if echo "$FILE_PATH" | grep -q '/\.git/'; then
    echo "BLOCKED: Cannot write to .git directory." >&2
    exit 2
fi

# Block writes to lock files
if echo "$FILE_PATH" | grep -qE '(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$'; then
    echo "BLOCKED: Cannot directly modify lock files. Use npm/yarn/pnpm to manage dependencies." >&2
    exit 2
fi

# Block writes to build output directories
if echo "$FILE_PATH" | grep -qE '/(dist|build|\.next|\.nuxt|\.svelte-kit)/'; then
    echo "BLOCKED: Cannot write to build output directories. These are auto-generated." >&2
    exit 2
fi

# =============================================================================
# WARNINGS: Sensitive paths that should be flagged
# =============================================================================

WARNINGS=""

# Warn about package.json changes
if echo "$FILE_PATH" | grep -qE '/package\.json$'; then
    WARNINGS="Modifying package.json - remember to run npm install after. "
fi

# Warn about config file changes
if echo "$FILE_PATH" | grep -qE '/(tsconfig|tailwind\.config|vite\.config|next\.config|eslint)'; then
    WARNINGS="${WARNINGS}Modifying build/lint config - may require restart. "
fi

# Warn about test file changes
if echo "$FILE_PATH" | grep -qE '\.(test|spec)\.(ts|tsx|js|jsx)$'; then
    WARNINGS="${WARNINGS}Modifying test file - run tests to verify. "
fi

if [[ -n "$WARNINGS" ]]; then
    echo "{\"systemMessage\": \"⚠️ ${WARNINGS}\"}"
fi

exit 0
