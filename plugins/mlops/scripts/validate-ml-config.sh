#!/bin/bash
set -euo pipefail
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
[[ -z "$FILE_PATH" ]] && exit 0
if echo "$FILE_PATH" | grep -qiE '(model|train|config).*\.(yaml|yml|json)$'; then
    echo '{"systemMessage": "🧠 ML config modified. Validate before training."}'
fi
exit 0
