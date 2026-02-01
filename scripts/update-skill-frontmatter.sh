#!/bin/bash
# Update skill frontmatter with modern Claude Code features
# Usage: ./update-skill-frontmatter.sh <skill-path> <argument-hint> <user-invocable> [dynamic-context-cmd]

set -euo pipefail

SKILL_PATH="$1"
ARG_HINT="$2"
USER_INVOCABLE="$3"
DYNAMIC_CONTEXT="${4:-}"

if [[ ! -f "$SKILL_PATH" ]]; then
    echo "Error: $SKILL_PATH not found"
    exit 1
fi

# Extract current frontmatter
CONTENT=$(cat "$SKILL_PATH")
FRONTMATTER=$(echo "$CONTENT" | sed -n '/^---$/,/^---$/p' | head -n -1 | tail -n +2)
BODY=$(echo "$CONTENT" | sed -n '/^---$/,/^---$/d; p' | tail -n +2)

# Get existing fields
NAME=$(echo "$FRONTMATTER" | grep -E '^name:' | sed 's/^name: *//' || echo "")
DESC=$(echo "$FRONTMATTER" | grep -E '^description:' | sed 's/^description: *//' || echo "")

# Build new frontmatter
NEW_FRONT="---
name: $NAME
description: $DESC"

if [[ -n "$ARG_HINT" && "$ARG_HINT" != "none" ]]; then
    NEW_FRONT="$NEW_FRONT
argument-hint: \"$ARG_HINT\""
fi

if [[ "$USER_INVOCABLE" == "false" ]]; then
    NEW_FRONT="$NEW_FRONT
user-invocable: false"
fi

NEW_FRONT="$NEW_FRONT
---"

# Add dynamic context if provided
if [[ -n "$DYNAMIC_CONTEXT" ]]; then
    NEW_FRONT="$NEW_FRONT

# Dynamic Context

\`\`\`
$DYNAMIC_CONTEXT
\`\`\`"
fi

# Write new file
echo "$NEW_FRONT" > "$SKILL_PATH"
echo "$BODY" >> "$SKILL_PATH"

echo "Updated: $SKILL_PATH"
