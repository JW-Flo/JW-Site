// KV-backed session storage with in-memory fallback (AGENT-02)
import { AgentSession } from './types.js';

const MEMORY_SESSIONS: Record<string, AgentSession> = {};
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_MESSAGES = 50;

export async function loadSession(env: any, id: string): Promise<AgentSession | null> {
  const kv: KVNamespace | undefined = env?.AGENT_SESSIONS;
  if (kv) {
    const raw = await kv.get(`session:${id}`);
    if (!raw) return null;
    try {
      const parsed: AgentSession = JSON.parse(raw);
      if (parsed.ttl < Date.now()) return null;
      return parsed;
    } catch {
      return null;
    }
  }
  return MEMORY_SESSIONS[id] || null;
}

export async function saveSession(env: any, session: AgentSession) {
  session.updated = Date.now();
  // Trim messages to last MAX_MESSAGES
  if (session.messages.length > MAX_MESSAGES) {
    session.messages = session.messages.slice(-MAX_MESSAGES);
  }
  const kv: KVNamespace | undefined = env?.AGENT_SESSIONS;
  if (kv) {
    await kv.put(`session:${session.id}`, JSON.stringify(session), { expirationTtl: Math.max(60, Math.floor((session.ttl - Date.now())/1000)) });
  } else {
    MEMORY_SESSIONS[session.id] = session;
  }
  return session;
}

export function newSession(id: string): AgentSession {
  const now = Date.now();
  return {
    id,
    messages: [],
    created: now,
    updated: now,
    ttl: now + DEFAULT_TTL_MS
  };
}
