# Confluence MCP Server

Model Context Protocol server for Confluence integration. Enables Claude to search, read, and create documentation.

## Installation

1. **Install dependencies**:
   ```bash
   cd mcp-servers/confluence-server
   npm install
   npm run build
   ```

2. **Configure environment variables**:
   ```bash
   export CONFLUENCE_HOST="https://your-domain.atlassian.net"
   export CONFLUENCE_EMAIL="your-email@company.com"
   export CONFLUENCE_API_TOKEN="your-api-token"
   ```

3. **Add to Claude settings** (`~/.claude/settings.json`):
   ```json
   {
     "mcpServers": {
       "confluence": {
         "command": "node",
         "args": ["/path/to/claude-marketplace/mcp-servers/confluence-server/dist/index.js"],
         "env": {
           "CONFLUENCE_HOST": "https://your-domain.atlassian.net",
           "CONFLUENCE_EMAIL": "your-email@company.com",
           "CONFLUENCE_API_TOKEN": "your-api-token"
         }
       }
     }
   }
   ```

## Available Tools

| Tool | Description |
|------|-------------|
| `confluence_search` | Search for pages and content |
| `confluence_get_page` | Get page content by ID |
| `confluence_create_page` | Create a new page |
| `confluence_update_page` | Update existing page |
| `confluence_list_spaces` | List available spaces |

## Usage Examples

```
Search Confluence for API documentation
```

```
Create a new page in the ENGINEERING space with our deployment runbook
```

```
Update the onboarding page with the new setup instructions
```

## Security

- Uses Atlassian API tokens (not passwords)
- Respects Confluence space permissions
- Store credentials securely, never in code

## Author

Platform Team - platform@helms-ai.com
