# NexusBridge MCP Server

An MCP (Model Context Protocol) server that gives AI agents access to 10+ brokered AI services through a unified API. Pay-per-call credits system with automatic routing to the best upstream providers.

## Available Services

| Service | Slug | Price/Call | Description |
|---------|------|-----------|-------------|
| LLM Chat | `llm-chat` | $0.005 | GPT-4o, Claude, Gemini, DeepSeek, 200+ models |
| Code Generation | `llm-code` | $0.008 | Optimized for code with top coding models |
| Image Generation | `image-gen` | $0.05 | DALL-E 3, SDXL, Flux models |
| Text Embedding | `text-embedding` | $0.001 | Vector embeddings for RAG pipelines |
| Web Search | `web-search` | $0.01 | Structured web results with snippets |
| Document Parser | `doc-parser` | $0.02 | OCR + structured data extraction |
| Sentiment Analysis | `sentiment` | $0.003 | Multi-language, entity-level granularity |
| Translation | `translation` | $0.005 | 100+ languages, neural MT |
| Summarization | `summarize` | $0.008 | Configurable-length text summaries |
| Code Execution | `code-exec` | $0.015 | Sandboxed Python, Node.js, Go |

## Tools

### `nexusbridge_catalog`
List all available services with pricing and your credit balance.

### `nexusbridge_execute`
Execute any service. Credits are deducted automatically.

**Parameters:**
- `slug` (string, required) — Service slug from the catalog
- `params` (object, optional) — Service-specific parameters

**Examples:**
```json
// LLM Chat
{ "slug": "llm-chat", "params": { "messages": [{"role": "user", "content": "Hello"}] } }

// Sentiment Analysis
{ "slug": "sentiment", "params": { "text": "I love this product!" } }

// Web Search
{ "slug": "web-search", "params": { "query": "latest AI news" } }
```

### `nexusbridge_balance`
Check your current credit balance.

## Setup

### Get an API Key
1. Visit [NexusBridge](https://nexusbridge.io)
2. Create an API key from the dashboard
3. Buy credits via Stripe checkout

### Claude Desktop
Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nexusbridge": {
      "command": "npx",
      "args": ["tsx", "/path/to/nexusbridge-mcp-server/index.ts"],
      "env": {
        "NEXUSBRIDGE_API_KEY": "nb_sk_your_key_here",
        "NEXUSBRIDGE_BASE_URL": "https://nexusbridge.io"
      }
    }
  }
}
```

### Smithery
This server is available on [Smithery](https://smithery.ai). Search for "nexusbridge" and configure your API key.

### Manual Installation
```bash
git clone https://github.com/YOUR_USERNAME/nexusbridge-mcp-server.git
cd nexusbridge-mcp-server
npm install
NEXUSBRIDGE_API_KEY=nb_sk_your_key npm start
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXUSBRIDGE_API_KEY` | Yes | — | Your NexusBridge API key |
| `NEXUSBRIDGE_BASE_URL` | No | `https://nexusbridge.io` | Base URL of NexusBridge |

## How It Works

NexusBridge operates as an API brokerage — a single unified endpoint that routes requests to the best upstream providers (OpenRouter for AI models, specialized APIs for tools). You pay per call with credits, and NexusBridge handles routing, failover, and billing.

## License

MIT
