// src/types/research.ts
// Types for Tavily research API responses

export interface ResearchCitation {
  url: string;
  title: string;
  snippet: string;
}

export interface ResearchResult {
  answer: string;
  citations: ResearchCitation[];
  query: string;
  raw?: any;
}
