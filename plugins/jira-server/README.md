# Jira MCP Server

Model Context Protocol server for Jira integration. Enables Claude to create, update, and query Jira issues.

## Installation

1. **Install dependencies**:
   ```bash
   cd mcp-servers/jira-server
   npm install
   npm run build
   ```

2. **Configure environment variables**:
   ```bash
   export JIRA_HOST="https://your-domain.atlassian.net"
   export JIRA_EMAIL="your-email@company.com"
   export JIRA_API_TOKEN="your-api-token"
   ```

   Generate an API token at: https://id.atlassian.com/manage-profile/security/api-tokens

3. **Add to Claude settings** (`~/.claude/settings.json`):
   ```json
   {
     "mcpServers": {
       "jira": {
         "command": "node",
         "args": ["/path/to/claude-marketplace/mcp-servers/jira-server/dist/index.js"],
         "env": {
           "JIRA_HOST": "https://your-domain.atlassian.net",
           "JIRA_EMAIL": "your-email@company.com",
           "JIRA_API_TOKEN": "your-api-token"
         }
       }
     }
   }
   ```

## Available Tools

| Tool | Description |
|------|-------------|
| `jira_create_issue` | Create a new Jira issue |
| `jira_get_issue` | Get details of an issue |
| `jira_search` | Search issues using JQL |
| `jira_update_issue` | Update an existing issue |
| `jira_add_comment` | Add a comment to an issue |

## Usage Examples

Once configured, Claude can use these tools:

```
Create a bug ticket in PROJ for the login timeout issue
```

```
Show me all open bugs assigned to me
```

```
Add a comment to PROJ-123 about the fix being deployed
```

## JQL Examples

The `jira_search` tool accepts JQL queries:

- `project = PROJ AND status = "In Progress"`
- `assignee = currentUser() AND resolution = Unresolved`
- `created >= -7d AND type = Bug`

## Security

- API tokens are stored in environment variables
- Never commit tokens to version control
- Use Jira's project permissions to limit access

## Author

Platform Team - platform@helms-ai.com
