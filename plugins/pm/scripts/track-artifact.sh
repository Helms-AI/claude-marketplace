#!/bin/bash
# PM Plugin - Artifact Tracking
# Records artifacts created during workflow execution
#
# Exit codes:
#   0 = Always (tracking is non-blocking)

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract file info from tool input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

# Find active changeset
CHANGESET_DIR="${CWD}/.claude/changesets"
if [[ ! -d "$CHANGESET_DIR" ]]; then
    exit 0
fi

# Find most recent active changeset
ACTIVE_CHANGESET=""
for changeset in "$CHANGESET_DIR"/*; do
    if [[ -d "$changeset" ]] && [[ -f "$changeset/changeset.json" ]]; then
        STATUS=$(jq -r '.status // "unknown"' "$changeset/changeset.json" 2>/dev/null || echo "unknown")
        if [[ "$STATUS" == "active" ]]; then
            ACTIVE_CHANGESET="$changeset"
            break
        fi
    fi
done

if [[ -z "$ACTIVE_CHANGESET" ]]; then
    exit 0
fi

CHANGESET_JSON="$ACTIVE_CHANGESET/changeset.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Determine artifact type from file extension
FILENAME=$(basename "$FILE_PATH")
EXTENSION="${FILENAME##*.}"

case "$EXTENSION" in
    md|mdx)
        ARTIFACT_TYPE="documentation"
        ;;
    ts|tsx|js|jsx|vue|svelte)
        ARTIFACT_TYPE="component"
        ;;
    css|scss|less)
        ARTIFACT_TYPE="styles"
        ;;
    json|yaml|yml)
        ARTIFACT_TYPE="config"
        ;;
    sql)
        ARTIFACT_TYPE="database"
        ;;
    sh|bash)
        ARTIFACT_TYPE="script"
        ;;
    test.ts|test.js|spec.ts|spec.js)
        ARTIFACT_TYPE="test"
        ;;
    *)
        ARTIFACT_TYPE="other"
        ;;
esac

# Detect domain from file path
if echo "$FILE_PATH" | grep -qiE '(component|ui|frontend)'; then
    DOMAIN="frontend"
elif echo "$FILE_PATH" | grep -qiE '(api|backend|server)'; then
    DOMAIN="backend"
elif echo "$FILE_PATH" | grep -qiE '(test|spec|__tests__)'; then
    DOMAIN="testing"
elif echo "$FILE_PATH" | grep -qiE '(docs|documentation)'; then
    DOMAIN="documentation"
else
    DOMAIN="unknown"
fi

# Create artifact entry
ARTIFACT_ENTRY=$(jq -n \
    --arg name "$FILENAME" \
    --arg path "$FILE_PATH" \
    --arg type "$ARTIFACT_TYPE" \
    --arg domain "$DOMAIN" \
    --arg ts "$TIMESTAMP" \
    '{name: $name, path: $path, type: $type, domain: $domain, created_at: $ts}')

# Add to changeset artifacts array
jq --argjson artifact "$ARTIFACT_ENTRY" '.artifacts += [$artifact]' "$CHANGESET_JSON" > "${CHANGESET_JSON}.tmp"
mv "${CHANGESET_JSON}.tmp" "$CHANGESET_JSON"

exit 0
