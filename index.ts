#!/usr/bin/env node
/**
 * NexusBridge MCP Server
 *
 * A Model Context Protocol server that exposes NexusBridge
 * services as MCP tools. Supports both stdio and HTTP transports.
 *
 * Environment Variables:
 *   NEXUSBRIDGE_API_KEY  — Your NexusBridge API key (nb_sk_...)
 *   NEXUSBRIDGE_BASE_URL — Base URL of the NexusBridge instance
 *   PORT                 — HTTP port (default: 8000, used by Smithery)
 *
 * Tools Exposed:
 *   nexusbridge_catalog  — List available services and pricing
 *   nexusbridge_execute  — Execute a brokered service (LLM, search, etc.)
 *   nexusbridge_balance  — Check current credit balance
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { createServer } from "http";

const API_KEY = process.env.NEXUSBRIDGE_API_KEY || "";
const BASE_URL = (process.env.NEXUSBRIDGE_BASE_URL || "https://syntss.com").replace(/\/$/, "");
const PORT = parseInt(process.env.PORT || "8000", 10);

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

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "nexusbridge",
    version: "1.0.0",
    description:
      "NexusBridge is a unified AI API brokerage. Use this server to access 200+ AI models and 10 service categories — LLM chat completions, code generation, image generation, text embeddings, web search, document parsing, sentiment analysis, translation, summarization, and sandboxed code execution — through a single API key with transparent per-call pricing. Credits never expire. No subscriptions required. Call nexusbridge_catalog first to discover available services and check your credit balance, then use nexusbridge_execute to run any service by its slug.",
  });

  // Tool: nexusbridge_catalog — List available services
  server.tool(
    "nexusbridge_catalog",
    "Retrieve the full NexusBridge service catalog. Returns every available service with its slug, name, category, description, and per-call price in USD. Also returns your current credit balance. Call this tool first before executing any service to discover what is available and confirm you have sufficient credits. The response includes an array of service objects and a creditBalance number.",
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
    "Execute a NexusBridge service by its slug. Credits are deducted from your balance automatically based on the service's per-call price. Returns the upstream provider's response wrapped in a standard envelope with fields: success (boolean), service (slug used), charged (USD amount deducted), remainingBalance (credits left), and result (the upstream response object). For LLM services, pass a messages array in params. For search, pass a query string. For sentiment/summarization, pass a text string. Call nexusbridge_catalog first if you are unsure which slug to use or what params a service accepts.",
    {
      slug: z
        .string()
        .describe(
          "The service slug to execute. Must match a slug from the catalog. Common values: 'llm-chat' for chat completions with 200+ models, 'llm-code' for code generation, 'image-gen' for image creation, 'text-embedding' for vector embeddings, 'web-search' for structured web results, 'doc-parser' for document extraction, 'sentiment' for sentiment analysis, 'translation' for language translation, 'summarize' for text summarization, 'code-exec' for sandboxed code execution."
        ),
      params: z
        .record(z.unknown())
        .optional()
        .describe(
          "Service-specific parameters as a JSON object. For 'llm-chat': {messages: [{role: 'user', content: '...'}], model?: 'deepseek/deepseek-chat-v3-0324', max_tokens?: 1024}. For 'sentiment': {text: '...'}. For 'web-search': {query: '...'}. For 'summarize': {text: '...'}. For 'translation': {text: '...', from?: 'auto', to: 'en'}. For 'llm-code': {prompt: '...', model?: '...'}. For 'image-gen': {prompt: '...'}. For 'text-embedding': {text: '...'}. For 'doc-parser': {text: '...' or url: '...'}. For 'code-exec': {language: 'python', code: '...'}. Omit or pass {} to use defaults."
        ),
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
    "Check your current NexusBridge credit balance in USD and the number of active services available. Use this tool to verify you have enough credits before executing expensive operations, or to monitor spending after a batch of calls. Returns creditBalance (number in USD) and serviceCount (integer).",
    {},
    async () => {
      try {
        const data = await apiCall("/catalog");
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  creditBalance: data.creditBalance,
                  serviceCount: data.services?.length || 0,
                },
                null,
                2
              ),
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

  return server;
}

// Start the server — HTTP mode for Smithery, stdio for local/Claude Desktop
async function main() {
  const transport = process.argv.includes("--stdio") ? "stdio" : "http";

  if (transport === "stdio") {
    const server = createMcpServer();
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    console.error("NexusBridge MCP Server running on stdio");
  } else {
    // HTTP mode for Smithery hosted deployment
    const httpServer = createServer(async (req, res) => {
      // Health check
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }

      // MCP endpoint
      if (req.url === "/mcp" || req.url === "/") {
        try {
          if (req.method === "DELETE") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          const server = createMcpServer();
          const httpTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
          });
          await server.connect(httpTransport);

          // For POST, read and parse body first
          if (req.method === "POST") {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk as Buffer);
            }
            const body = JSON.parse(Buffer.concat(chunks).toString());
            await httpTransport.handleRequest(req, res, body);
          } else {
            await httpTransport.handleRequest(req, res);
          }
        } catch (error: any) {
          console.error("MCP endpoint error:", error);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "MCP transport error", message: error.message }));
          }
        }
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    });

    httpServer.listen(PORT, () => {
      console.error(`NexusBridge MCP Server running on HTTP port ${PORT}`);
    });
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
