// src/utils/tavily.ts
// Server-side utility for calling the Tavily API via MCP server
// Handles API key from env, error normalization, and optional caching interface

import type { ResearchResult } from "../types/research.js";

const TAVILY_API_URL = process.env.TAVILY_API_URL || "https://api.tavily.com/v1/search";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

if (!TAVILY_API_KEY) {
  throw new Error("TAVILY_API_KEY is not set in environment variables");
}

export interface TavilyQueryOptions {
  query: string;
  max_results?: number;
  include_citations?: boolean;
  cache?: {
    get: (key: string) => Promise<ResearchResult | null>;
    set: (key: string, value: ResearchResult) => Promise<void>;
  };
}

export async function fetchTavilyResearch({ query, max_results = 5, include_citations = true, cache }: TavilyQueryOptions): Promise<ResearchResult> {
  const cacheKey = `tavily:${query}:${max_results}:${include_citations}`;
  if (cache) {
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      max_results,
      include_citations,
    }),
  });

  if (!res.ok) {
    let errorMsg = `Tavily API error: ${res.status}`;
    try {
      const err: any = await res.json();
      errorMsg += ` - ${err && typeof err === 'object' && 'message' in err ? err.message : JSON.stringify(err)}`;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await res.json();
  // Basic runtime validation for ResearchResult shape
  const d = data as any;
  if (!d || typeof d !== 'object' || typeof d.answer !== 'string' || !Array.isArray(d.citations)) {
    throw new Error('Invalid Tavily API response shape');
  }
  if (cache) await cache.set(cacheKey, d as ResearchResult);
  return d as ResearchResult;
}
