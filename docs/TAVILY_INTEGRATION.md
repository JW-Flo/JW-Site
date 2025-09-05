# Tavily Research Integration

This project integrates a research capability backed by Tavily.

## 1. MCP (Model Context Protocol) Client Setup (GitHub Copilot)

Add the Tavily MCP server to your Copilot MCP settings file:

File: `~/.github/copilot/mcp.json`

```jsonc
{
  "mcpServers": {
    "Tavily Expert": {
      "serverUrl": "https://tavily.api.tadata.com/mcp/tavily/dog-behold-osmosis-sdi249"
    }
  }
}
```

Restart Copilot after saving. You should then be able to invoke research queries via the Tavily Expert.

## 2. Server-Side API Usage (Planned)

We will expose a `/api/research` endpoint that proxies validated queries to Tavily, applies lightweight caching, and returns structured results with citations.

Planned response shape:

```ts
interface ResearchResult {
  query: string;
  summary: string;
  citations: { title: string; url: string; snippet?: string }[];
  raw?: any; // original Tavily payload (optional for debugging)
  cached: boolean;
  generatedAt: string;
}
```

## 3. Environment Variables

Create/update an `.env` file with (placeholder until key is provisioned):

```bash
TAVILY_API_KEY=REPLACE_ME
```

This will be consumed by a utility at `src/utils/tavily.ts` (to be created) for direct server-side calls.

## 4. Rate Limiting & Validation

The research API will implement:

* Minimum query length (e.g., 8 characters)
* Block obvious prompt-injection attempts (`/system|ignore previous|developer mode/i`)
* Per-IP or session-based rate limiting (burst + sustained)

## 5. Frontend Component

`<ResearchPanel />` will provide:

* Input box + examples
* Loading animation (skeleton + pulse)
* Streaming style reveal (progressive fade-in of paragraphs)
* Citation list with favicons & domain extraction
* Copy summary button

## 6. Testing

Unit tests (Vitest) will mock the Tavily API via `fetch` and assert:

* Proper headers & key usage
* Caching layer is hit on second identical query
* Validation rejects unsafe or too-short queries

## 7. Roadmap Enhancements

* Background enrichment queue
* Follow-up question threading
* Source credibility scoring
* Optional vector store for local semantic recall

---
Document version: 2025-09-03
