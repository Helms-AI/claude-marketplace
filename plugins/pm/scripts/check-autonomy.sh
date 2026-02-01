#!/bin/bash
# PM Plugin - Autonomy Check
# Checks autonomy settings before executing actions
#
# Exit codes:
#   0 = Action allowed (auto or user confirmed)
#   2 = Action blocked (requires confirmation in current profile)

set -euo pipefail

INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')
TOOL=$(echo "$INPUT" | jq -r '.tool // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Find autonomy config
AUTONOMY_FILE="${CWD}/.claude/autonomy.json"
if [[ ! -f "$AUTONOMY_FILE" ]]; then
    # No config = use default (assisted)
    PROFILE="assisted"
else
    PROFILE=$(jq -r '.profile // "assisted"' "$AUTONOMY_FILE")
fi

# Determine action type
ACTION_TYPE="write"
if [[ "$TOOL" == "Bash" ]]; then
    # Check for destructive commands
    if echo "$COMMAND" | grep -qiE '\b(rm|delete|drop|truncate|destroy)\b'; then
        ACTION_TYPE="delete"
    elif echo "$COMMAND" | grep -qiE '\b(deploy|kubectl apply|helm install)\b'; then
        ACTION_TYPE="deploy"
    elif echo "$COMMAND" | grep -qiE '\bprod(uction)?\b'; then
        ACTION_TYPE="production"
    fi
fi

# Check profile rules
case "$PROFILE" in
    supervised)
        # Everything requires confirmation
        echo '{"systemMessage": "⚠️ Supervised mode: This action requires confirmation."}'
        exit 0  # Let the system handle confirmation
        ;;
    assisted)
        # Delete, deploy, production require confirmation
        case "$ACTION_TYPE" in
            delete|deploy|production)
                echo '{"systemMessage": "⚠️ Assisted mode: This action requires confirmation."}'
                exit 0
                ;;
        esac
        ;;
    autonomous)
        # Only production requires confirmation
        if [[ "$ACTION_TYPE" == "production" ]]; then
            echo '{"systemMessage": "⚠️ Production action: Confirmation required even in autonomous mode."}'
            exit 0
        fi
        ;;
esac

# Action is allowed
exit 0
