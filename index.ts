#!/usr/bin/env node
/**
 * NexusBridge MCP Server
 *
 * A standalone Model Context Protocol server that exposes NexusBridge
 * services as MCP tools. Designed for deployment on Smithery.
 *
 * Environment Variables:
 *   NEXUSBRIDGE_API_KEY  — Your NexusBridge API key (nb_sk_...)
 *   NEXUSBRIDGE_BASE_URL — Base URL of the NexusBridge instance (default: https://nexusbridge.io)
 *
 * Tools Exposed:
 *   nexusbridge_catalog  — List available services and pricing
 *   nexusbridge_execute  — Execute a brokered service (LLM, search, etc.)
 *   nexusbridge_balance  — Check current credit balance
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_KEY = process.env.NEXUSBRIDGE_API_KEY || "";
const BASE_URL = (process.env.NEXUSBRIDGE_BASE_URL || "https://nexusbridge.io").replace(/\/$/, "");

if (!API_KEY) {
  console.error("Error: NEXUSBRIDGE_API_KEY environment variable is required.");
  process.exit(1);
}

async function apiCall(endpoint: string, body?: Record<string, unknown>) {
  const response = await fetch(`${BASE_URL}/api/v1${endpoint}`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

// Create MCP Server
const server = new McpServer({
  name: "nexusbridge",
  version: "1.0.0",
});

// Tool: nexusbridge_catalog — List available services
server.tool(
  "nexusbridge_catalog",
  "List all available NexusBridge services with their pricing and descriptions. Returns the full service catalog and your current credit balance.",
  {},
  async () => {
    try {
      const data = await apiCall("/catalog");
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching catalog: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: nexusbridge_execute — Execute a service
server.tool(
  "nexusbridge_execute",
  "Execute a NexusBridge service. For LLM services, pass messages array. For other services, pass relevant params. Credits are deducted automatically.",
  {
    slug: z.string().describe("Service slug (e.g., 'llm-chat', 'web-search', 'sentiment', 'summarize')"),
    params: z.record(z.unknown()).optional().describe("Service parameters. For llm-chat: {messages, model?, max_tokens?}. For sentiment: {text}. For web-search: {query}."),
  },
  async ({ slug, params }) => {
    try {
      const data = await apiCall("/execute", { slug, params: params || {} });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error executing service: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: nexusbridge_balance — Check credit balance
server.tool(
  "nexusbridge_balance",
  "Check your current NexusBridge credit balance.",
  {},
  async () => {
    try {
      const data = await apiCall("/catalog");
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              creditBalance: data.creditBalance,
              serviceCount: data.services?.length || 0,
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error checking balance: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("NexusBridge MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
