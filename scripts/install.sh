#!/bin/bash
# Claude Marketplace Installation Script
# Usage: ./install.sh <component-type> <component-name>

set -e

MARKETPLACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLAUDE_DIR="${CLAUDE_DIR:-$HOME/.claude}"

usage() {
    echo "Usage: $0 <component-type> <component-name>"
    echo ""
    echo "Component types:"
    echo "  skill      - Install a skill"
    echo "  subagent   - Show subagent configuration"
    echo "  hook       - Show hook configuration"
    echo "  mcp-server - Install and configure MCP server"
    echo ""
    echo "Examples:"
    echo "  $0 skill code-review"
    echo "  $0 mcp-server jira-server"
    exit 1
}

install_skill() {
    local name="$1"
    local source="$MARKETPLACE_DIR/skills/$name/skill.md"
    local dest="$CLAUDE_DIR/skills"

    if [ ! -f "$source" ]; then
        echo "Error: Skill '$name' not found at $source"
        exit 1
    fi

    mkdir -p "$dest"
    cp "$source" "$dest/$name.md"
    echo "✓ Installed skill '$name' to $dest/$name.md"
}

show_subagent_config() {
    local name="$1"
    local path="$MARKETPLACE_DIR/subagents/$name/agent.md"

    if [ ! -f "$path" ]; then
        echo "Error: Subagent '$name' not found at $path"
        exit 1
    fi

    echo "Add to your ~/.claude/settings.json:"
    echo ""
    cat <<EOF
{
  "subagents": {
    "$name": {
      "path": "$path",
      "description": "$(head -10 "$path" | grep 'description:' | cut -d: -f2 | xargs)"
    }
  }
}
EOF
}

show_hook_config() {
    local name="$1"
    local path="$MARKETPLACE_DIR/hooks/$name/hook.json"

    if [ ! -f "$path" ]; then
        echo "Error: Hook '$name' not found at $path"
        exit 1
    fi

    echo "Hook configuration from $path:"
    echo ""
    cat "$path"
    echo ""
    echo "See the README.md in the hook directory for installation instructions."
}

install_mcp_server() {
    local name="$1"
    local server_dir="$MARKETPLACE_DIR/mcp-servers/$name"

    if [ ! -d "$server_dir" ]; then
        echo "Error: MCP server '$name' not found at $server_dir"
        exit 1
    fi

    echo "Installing MCP server '$name'..."

    if [ -f "$server_dir/package.json" ]; then
        (cd "$server_dir" && npm install && npm run build)
        echo "✓ Built MCP server"
    fi

    echo ""
    echo "Add to your ~/.claude/settings.json:"
    echo ""
    cat <<EOF
{
  "mcpServers": {
    "$name": {
      "command": "node",
      "args": ["$server_dir/dist/index.js"],
      "env": {
        // See README.md for required environment variables
      }
    }
  }
}
EOF
}

# Main
if [ $# -lt 2 ]; then
    usage
fi

TYPE="$1"
NAME="$2"

case "$TYPE" in
    skill)
        install_skill "$NAME"
        ;;
    subagent)
        show_subagent_config "$NAME"
        ;;
    hook)
        show_hook_config "$NAME"
        ;;
    mcp-server)
        install_mcp_server "$NAME"
        ;;
    *)
        echo "Error: Unknown component type '$TYPE'"
        usage
        ;;
esac
