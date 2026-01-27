import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Confluence configuration
const CONFLUENCE_HOST = process.env.CONFLUENCE_HOST || "";
const CONFLUENCE_EMAIL = process.env.CONFLUENCE_EMAIL || "";
const CONFLUENCE_API_TOKEN = process.env.CONFLUENCE_API_TOKEN || "";

const server = new Server(
  {
    name: "confluence-server",
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
        name: "confluence_search",
        description: "Search Confluence for pages and content",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (CQL or text)",
            },
            space: {
              type: "string",
              description: "Space key to limit search (optional)",
            },
            maxResults: {
              type: "number",
              description: "Maximum results to return",
              default: 10,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "confluence_get_page",
        description: "Get the content of a Confluence page",
        inputSchema: {
          type: "object",
          properties: {
            pageId: {
              type: "string",
              description: "Page ID",
            },
          },
          required: ["pageId"],
        },
      },
      {
        name: "confluence_create_page",
        description: "Create a new Confluence page",
        inputSchema: {
          type: "object",
          properties: {
            space: {
              type: "string",
              description: "Space key",
            },
            title: {
              type: "string",
              description: "Page title",
            },
            content: {
              type: "string",
              description: "Page content (HTML or storage format)",
            },
            parentId: {
              type: "string",
              description: "Parent page ID (optional)",
            },
          },
          required: ["space", "title", "content"],
        },
      },
      {
        name: "confluence_update_page",
        description: "Update an existing Confluence page",
        inputSchema: {
          type: "object",
          properties: {
            pageId: {
              type: "string",
              description: "Page ID to update",
            },
            title: {
              type: "string",
              description: "New title (optional, keeps existing if not provided)",
            },
            content: {
              type: "string",
              description: "New content (HTML or storage format)",
            },
          },
          required: ["pageId", "content"],
        },
      },
      {
        name: "confluence_list_spaces",
        description: "List available Confluence spaces",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "Space type filter: 'global' or 'personal'",
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!CONFLUENCE_HOST || !CONFLUENCE_EMAIL || !CONFLUENCE_API_TOKEN) {
    return {
      content: [
        {
          type: "text",
          text: "Error: Confluence configuration missing. Set CONFLUENCE_HOST, CONFLUENCE_EMAIL, and CONFLUENCE_API_TOKEN.",
        },
      ],
    };
  }

  const authHeader = Buffer.from(
    `${CONFLUENCE_EMAIL}:${CONFLUENCE_API_TOKEN}`
  ).toString("base64");

  const headers = {
    Authorization: `Basic ${authHeader}`,
    "Content-Type": "application/json",
  };

  try {
    switch (name) {
      case "confluence_search": {
        let cql = `text ~ "${args?.query}"`;
        if (args?.space) {
          cql += ` AND space = "${args.space}"`;
        }
        const response = await fetch(
          `${CONFLUENCE_HOST}/wiki/rest/api/content/search?cql=${encodeURIComponent(
            cql
          )}&limit=${args?.maxResults || 10}`,
          { headers }
        );
        const data = await response.json();
        const results = data.results?.map((page: any) => ({
          id: page.id,
          title: page.title,
          type: page.type,
          space: page._expandable?.space,
          url: `${CONFLUENCE_HOST}/wiki${page._links?.webui}`,
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "confluence_get_page": {
        const response = await fetch(
          `${CONFLUENCE_HOST}/wiki/rest/api/content/${args?.pageId}?expand=body.storage,version`,
          { headers }
        );
        const data = await response.json();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: data.id,
                  title: data.title,
                  version: data.version?.number,
                  content: data.body?.storage?.value,
                  url: `${CONFLUENCE_HOST}/wiki${data._links?.webui}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "confluence_create_page": {
        const body: any = {
          type: "page",
          title: args?.title,
          space: { key: args?.space },
          body: {
            storage: {
              value: args?.content,
              representation: "storage",
            },
          },
        };
        if (args?.parentId) {
          body.ancestors = [{ id: args.parentId }];
        }
        const response = await fetch(
          `${CONFLUENCE_HOST}/wiki/rest/api/content`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          }
        );
        const data = await response.json();
        return {
          content: [
            {
              type: "text",
              text: `Created page: ${data.title}\nID: ${data.id}\nURL: ${CONFLUENCE_HOST}/wiki${data._links?.webui}`,
            },
          ],
        };
      }

      case "confluence_update_page": {
        // First get current version
        const getResponse = await fetch(
          `${CONFLUENCE_HOST}/wiki/rest/api/content/${args?.pageId}?expand=version`,
          { headers }
        );
        const current = await getResponse.json();

        const body = {
          version: { number: current.version.number + 1 },
          title: args?.title || current.title,
          type: "page",
          body: {
            storage: {
              value: args?.content,
              representation: "storage",
            },
          },
        };

        const response = await fetch(
          `${CONFLUENCE_HOST}/wiki/rest/api/content/${args?.pageId}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify(body),
          }
        );
        const data = await response.json();
        return {
          content: [
            {
              type: "text",
              text: `Updated page: ${data.title}\nVersion: ${data.version?.number}`,
            },
          ],
        };
      }

      case "confluence_list_spaces": {
        let url = `${CONFLUENCE_HOST}/wiki/rest/api/space?limit=50`;
        if (args?.type) {
          url += `&type=${args.type}`;
        }
        const response = await fetch(url, { headers });
        const data = await response.json();
        const spaces = data.results?.map((space: any) => ({
          key: space.key,
          name: space.name,
          type: space.type,
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(spaces, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
        };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Confluence MCP server running on stdio");
}

main().catch(console.error);
