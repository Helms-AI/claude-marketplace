#!/bin/bash
# Mobile Plugin - File Validation
set -euo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')

if [[ -z "$FILE_PATH" ]]; then
    exit 0
fi

FILENAME=$(basename "$FILE_PATH")
MESSAGES=""

# Check Swift files
if echo "$FILENAME" | grep -qE '\.swift$'; then
    MESSAGES="${MESSAGES}📱 Swift file modified. Run tests with Xcode. "
fi

# Check Kotlin files
if echo "$FILENAME" | grep -qE '\.kt$'; then
    MESSAGES="${MESSAGES}📱 Kotlin file modified. Run tests with Gradle. "
fi

# Check Dart files
if echo "$FILENAME" | grep -qE '\.dart$'; then
    MESSAGES="${MESSAGES}📱 Dart file modified. Run 'flutter test'. "
fi

if [[ -n "$MESSAGES" ]]; then
    echo "{\"systemMessage\": \"${MESSAGES}\"}"
fi

exit 0
