// Agent mode core type definitions (AGENT-00/AGENT-01)
export interface AgentToolContext {
  env: any; // Cloudflare env
  ip: string | undefined;
  isSuperAdmin: boolean;
  flags: Record<string, string>; // client-exposed flags
  now: number;
  session: AgentSession;
}

export interface AgentSessionMessage {
  role: 'user' | 'system' | 'tool';
  tool?: string;
  content: string;
  ts: number;
}

export interface AgentSession {
  id: string;
  messages: AgentSessionMessage[];
  created: number;
  updated: number;
  ttl: number; // absolute expiry timestamp (ms)
}

export interface AgentToolResult<T=any> {
  ok: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, any>;
}

// Zod schemas (lazy import in runtime to avoid hard dependency here for types only)
export interface AgentToolSchemas<I = any, O = any> {
  // Allow either a Zod schema or legacy minimal object schema with { type:'object', required: string[] }
  inputSchema?: import('zod').ZodType<I> | { type: 'object'; required?: string[] };
  outputSchema?: import('zod').ZodType<O>;
}

export type AgentTool<I = any, O = any> = {
  name: string;
  description: string;
  superAdminOnly?: boolean;
  // Schemas optional; if provided runtime will validate
  inputSchema?: AgentToolSchemas<I, O>["inputSchema"];
  outputSchema?: AgentToolSchemas<I, O>["outputSchema"];
  execute: (input: I, ctx: AgentToolContext) => Promise<AgentToolResult<O>>;
};

export interface AgentRequestBody {
  sessionId?: string;
  tool: string;
  input?: any;
}

export interface AgentResponseBody {
  sessionId: string;
  ok: boolean;
  tool: string;
  result?: any;
  error?: string;
  latencyMs: number;
}
