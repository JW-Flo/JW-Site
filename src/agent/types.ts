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

export type AgentTool = {
  name: string;
  description: string;
  inputSchema?: any; // minimal validation schema (object with required keys)
  superAdminOnly?: boolean;
  execute: (input: any, ctx: AgentToolContext) => Promise<AgentToolResult>;
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
