import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Jira client configuration (use environment variables)
const JIRA_HOST = process.env.JIRA_HOST || "";
const JIRA_EMAIL = process.env.JIRA_EMAIL || "";
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || "";

const server = new Server(
  {
    name: "jira-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "jira_create_issue",
        description: "Create a new Jira issue",
        inputSchema: {
          type: "object",
          properties: {
            project: {
              type: "string",
              description: "Project key (e.g., 'PROJ')",
            },
            summary: {
              type: "string",
              description: "Issue summary/title",
            },
            description: {
              type: "string",
              description: "Issue description",
            },
            issueType: {
              type: "string",
              description: "Issue type (e.g., 'Bug', 'Task', 'Story')",
              default: "Task",
            },
          },
          required: ["project", "summary"],
        },
      },
      {
        name: "jira_get_issue",
        description: "Get details of a Jira issue",
        inputSchema: {
          type: "object",
          properties: {
            issueKey: {
              type: "string",
              description: "Issue key (e.g., 'PROJ-123')",
            },
          },
          required: ["issueKey"],
        },
      },
      {
        name: "jira_search",
        description: "Search Jira issues using JQL",
        inputSchema: {
          type: "object",
          properties: {
            jql: {
              type: "string",
              description: "JQL query string",
            },
            maxResults: {
              type: "number",
              description: "Maximum results to return",
              default: 10,
            },
          },
          required: ["jql"],
        },
      },
      {
        name: "jira_update_issue",
        description: "Update an existing Jira issue",
        inputSchema: {
          type: "object",
          properties: {
            issueKey: {
              type: "string",
              description: "Issue key (e.g., 'PROJ-123')",
            },
            summary: {
              type: "string",
              description: "New summary (optional)",
            },
            description: {
              type: "string",
              description: "New description (optional)",
            },
            status: {
              type: "string",
              description: "New status (optional)",
            },
          },
          required: ["issueKey"],
        },
      },
      {
        name: "jira_add_comment",
        description: "Add a comment to a Jira issue",
        inputSchema: {
          type: "object",
          properties: {
            issueKey: {
              type: "string",
              description: "Issue key (e.g., 'PROJ-123')",
            },
            comment: {
              type: "string",
              description: "Comment text",
            },
          },
          required: ["issueKey", "comment"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Validate configuration
  if (!JIRA_HOST || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    return {
      content: [
        {
          type: "text",
          text: "Error: Jira configuration missing. Set JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN environment variables.",
        },
      ],
    };
  }

  const authHeader = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString(
    "base64"
  );

  try {
    switch (name) {
      case "jira_create_issue": {
        const response = await fetch(`${JIRA_HOST}/rest/api/3/issue`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              project: { key: args?.project },
              summary: args?.summary,
              description: {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: args?.description || "" }],
                  },
                ],
              },
              issuetype: { name: args?.issueType || "Task" },
            },
          }),
        });
        const data = await response.json();
        return {
          content: [
            { type: "text", text: `Created issue: ${data.key}\nURL: ${JIRA_HOST}/browse/${data.key}` },
          ],
        };
      }

      case "jira_get_issue": {
        const response = await fetch(
          `${JIRA_HOST}/rest/api/3/issue/${args?.issueKey}`,
          {
            headers: { Authorization: `Basic ${authHeader}` },
          }
        );
        const data = await response.json();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  key: data.key,
                  summary: data.fields?.summary,
                  status: data.fields?.status?.name,
                  assignee: data.fields?.assignee?.displayName,
                  description: data.fields?.description,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "jira_search": {
        const response = await fetch(
          `${JIRA_HOST}/rest/api/3/search?jql=${encodeURIComponent(
            args?.jql || ""
          )}&maxResults=${args?.maxResults || 10}`,
          {
            headers: { Authorization: `Basic ${authHeader}` },
          }
        );
        const data = await response.json();
        const issues = data.issues?.map((issue: any) => ({
          key: issue.key,
          summary: issue.fields?.summary,
          status: issue.fields?.status?.name,
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(issues, null, 2) }],
        };
      }

      case "jira_add_comment": {
        const response = await fetch(
          `${JIRA_HOST}/rest/api/3/issue/${args?.issueKey}/comment`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${authHeader}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              body: {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: args?.comment }],
                  },
                ],
              },
            }),
          }
        );
        const data = await response.json();
        return {
          content: [{ type: "text", text: `Comment added to ${args?.issueKey}` }],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
        };
    }
  } catch (error) {
    return {
      content: [
        { type: "text", text: `Error: ${(error as Error).message}` },
      ],
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Jira MCP server running on stdio");
}

main().catch(console.error);
