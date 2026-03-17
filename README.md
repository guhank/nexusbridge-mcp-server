# NexusBridge MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI agents access to 200+ AI models and 10 service categories through a unified, metered API. One API key, one integration, transparent per-call pricing.

**API Base:** [https://syntss.com](https://syntss.com)  
**Smithery:** [smithery.ai/servers/guhank/nexusbridge-mcp-server](https://smithery.ai/servers/guhank/nexusbridge-mcp-server)  
**GitHub:** [github.com/guhank/nexusbridge-mcp-server](https://github.com/guhank/nexusbridge-mcp-server)

## Tools

| Tool | Description |
|------|-------------|
| `nexusbridge_catalog` | Retrieve the full service catalog with slugs, descriptions, per-call prices, and your current credit balance. Call this first to discover available services. |
| `nexusbridge_execute` | Execute any NexusBridge service by its slug. Pass service-specific parameters. Credits are deducted automatically. Returns the upstream provider's response. |
| `nexusbridge_balance` | Check your current credit balance (USD) and the number of active services available. Use before expensive operations to verify sufficient funds. |

### nexusbridge_catalog

Returns every available service with its slug, name, category, description, and per-call price in USD. Also returns your current credit balance.

**Parameters:** None

**Example response:**
```json
{
  "services": [
    { "slug": "llm-chat", "name": "LLM Chat", "category": "ai", "pricePerCall": 0.005 },
    { "slug": "web-search", "name": "Web Search", "category": "search", "pricePerCall": 0.01 }
  ],
  "creditBalance": 24.50
}
```

### nexusbridge_execute

Execute a service by passing its slug and service-specific parameters.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Service slug from the catalog (e.g., `llm-chat`, `web-search`, `sentiment`) |
| `params` | object | No | Service-specific parameters (see examples below) |

**Examples:**

```json
// LLM Chat — use any of 200+ models
{ "slug": "llm-chat", "params": { "messages": [{"role": "user", "content": "Explain quantum computing"}], "model": "deepseek/deepseek-chat-v3-0324" } }

// Sentiment Analysis
{ "slug": "sentiment", "params": { "text": "I love this product! Best purchase I've ever made." } }

// Web Search
{ "slug": "web-search", "params": { "query": "latest AI news March 2026" } }

// Text Summarization
{ "slug": "summarize", "params": { "text": "Long article text here..." } }

// Translation
{ "slug": "translation", "params": { "text": "Hello world", "to": "es" } }

// Code Generation
{ "slug": "llm-code", "params": { "prompt": "Write a Python function to calculate fibonacci numbers" } }

// Image Generation
{ "slug": "image-gen", "params": { "prompt": "A serene mountain landscape at sunset" } }

// Text Embedding
{ "slug": "text-embedding", "params": { "text": "semantic search query" } }
```

**Example response:**
```json
{
  "success": true,
  "service": "llm-chat",
  "charged": 0.005,
  "remainingBalance": 24.495,
  "result": {
    "choices": [{ "message": { "content": "Quantum computing uses..." } }]
  }
}
```

### nexusbridge_balance

Returns your credit balance and the count of active services.

**Parameters:** None

**Example response:**
```json
{
  "creditBalance": 24.50,
  "serviceCount": 10
}
```

## Available Services

| Service | Slug | Price/Call | Description |
|---------|------|-----------|-------------|
| LLM Chat | `llm-chat` | $0.005 | Chat completions with GPT-4o, Claude, Gemini, DeepSeek, Llama, and 200+ models via OpenRouter |
| Code Generation | `llm-code` | $0.008 | Code generation, refactoring, and completion optimized for development tasks |
| Image Generation | `image-gen` | $0.05 | Create images from text prompts using DALL-E, SDXL, and Flux models |
| Text Embedding | `text-embedding` | $0.001 | Vector embeddings for RAG pipelines, semantic search, and clustering |
| Web Search | `web-search` | $0.01 | Structured web search results with titles, URLs, and snippets |
| Document Parser | `doc-parser` | $0.02 | Extract text and structured data from PDFs, images, and documents |
| Sentiment Analysis | `sentiment` | $0.003 | Classify text sentiment (positive/negative/neutral) with confidence scores and emotion detection |
| Translation | `translation` | $0.005 | Neural machine translation across 100+ languages |
| Summarization | `summarize` | $0.008 | Configurable-length text summaries from long documents |
| Code Execution | `code-exec` | $0.015 | Run code in sandboxed Python, Node.js, and Go environments |

## Installation

### Smithery (Recommended)

Install directly from [Smithery](https://smithery.ai/servers/guhank/nexusbridge-mcp-server) with one click. Configure your NexusBridge API key when prompted.

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nexusbridge": {
      "command": "npx",
      "args": ["-y", "nexusbridge-mcp-server", "--stdio"],
      "env": {
        "NEXUSBRIDGE_API_KEY": "nb_sk_your_key_here"
      }
    }
  }
}
```

### Cursor / Windsurf / Other MCP Clients

Use the same configuration pattern — set `NEXUSBRIDGE_API_KEY` as an environment variable and run via `npx -y nexusbridge-mcp-server --stdio`.

### Docker

```bash
docker build -t nexusbridge-mcp .
docker run -p 8000:8000 \
  -e NEXUSBRIDGE_API_KEY=nb_sk_your_key \
  nexusbridge-mcp
```

### Manual

```bash
git clone https://github.com/guhank/nexusbridge-mcp-server.git
cd nexusbridge-mcp-server
npm install
NEXUSBRIDGE_API_KEY=nb_sk_your_key npm start
```

## Usage

1. **Get an API key** — Purchase credits at [syntss.com](https://syntss.com). Credits start at $10. You'll receive an `nb_sk_...` API key.

2. **Install the MCP server** — Use Smithery, Claude Desktop config, or run manually (see Installation above).

3. **Discover services** — Your AI agent calls `nexusbridge_catalog` to see all available services, pricing, and your credit balance.

4. **Execute services** — Call `nexusbridge_execute` with the service slug and parameters. Credits are deducted per call.

5. **Monitor spending** — Call `nexusbridge_balance` to check remaining credits at any time.

### Typical Agent Workflow

```
Agent → nexusbridge_catalog           → "I see 10 services, balance is $24.50"
Agent → nexusbridge_execute(llm-chat) → "Got response from DeepSeek, charged $0.005"
Agent → nexusbridge_execute(sentiment)→ "Text is positive (0.94 confidence), charged $0.003"
Agent → nexusbridge_balance           → "Balance is $24.492"
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXUSBRIDGE_API_KEY` | Yes | — | Your NexusBridge API key (starts with `nb_sk_`) |
| `NEXUSBRIDGE_BASE_URL` | No | `https://syntss.com` | Base URL of the NexusBridge API |
| `PORT` | No | `8000` | HTTP port for Smithery/hosted mode |

## Transport Modes

| Mode | Flag | Use Case |
|------|------|----------|
| **HTTP** | (default) | Smithery hosted deployment, remote MCP clients |
| **stdio** | `--stdio` | Claude Desktop, Cursor, local MCP clients |

## Getting API Credits

| Tier | Credits | Approx. LLM Calls |
|------|---------|-------------------|
| Starter | $10 | ~2,000 |
| Builder | $25 | ~5,000 |
| Pro | $50 | ~10,000 |
| Scale | $100 | ~20,000 |

Purchase at [syntss.com](https://syntss.com) or via [Stripe](https://buy.stripe.com/5kQ4gsgVo9Rm04JgkR93y00). Credits never expire.

## License

MIT
