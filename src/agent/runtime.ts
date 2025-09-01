// Runtime dispatcher (AGENT-01/AGENT-05)
import { getTool, validateInput } from './registry.js';
import { AgentRequestBody, AgentResponseBody } from './types.js';
import { newSession, loadSession, saveSession } from './sessionStore.js';
import { projectClientFlags, loadFlags } from '../config/flags.js';
import { logAgent } from './log.js';
import { incrToolCall, incrToolError, incrRateLimited } from './metrics.js';
import { checkRateLimit } from './rateLimit.js';

// Simple UUID-ish generator (not RFC4122 strict but sufficient for correlation)
function correlationId() {
  return 'cid_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function randomId() { return Math.random().toString(36).slice(2, 10); }

// Rate limiting constants
const RL_WINDOW_MS = 60_000; // 1 minute window
const RL_LIMIT_PER_TOOL = 30;
const RL_LIMIT_START_SCAN = 5;

export async function handleAgentRequest(req: Request, env: any, _locals: any): Promise<Response> {
  const start = Date.now();
  const cid = correlationId();
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  }
  const flags = projectClientFlags(loadFlags(env));
  if (flags.FEATURE_AGENT !== 'true') {
    return new Response(JSON.stringify({ ok: false, error: 'agent-disabled' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  const body = await parseBody(req, start, env);
  if ('errorResponse' in body) return body.errorResponse;
  const { toolName, session, sessionId, input, isSuperAdmin } = body;
  const tool = getTool(toolName);
  if (!tool) {
    logAgent({ level: 'error', msg: 'unknown-tool', sessionId, tool: toolName, correlationId: cid });
    return jsonError('unknown-tool', 404, start, sessionId, cid);
  }
  if (tool.superAdminOnly && !isSuperAdmin) {
    logAgent({ level: 'error', msg: 'forbidden', sessionId, tool: toolName, correlationId: cid });
    return jsonError('forbidden', 403, start, sessionId, cid);
  }
  // Rate limiting per IP+tool
  const ip = req.headers.get('cf-connecting-ip') || 'unknown';
  const rlKey = `agent:${toolName}:${ip}`;
  const limit = toolName === 'start_scan' ? RL_LIMIT_START_SCAN : RL_LIMIT_PER_TOOL;
  const rlStore: KVNamespace | undefined = env.AGENT_RL;
  const rl = await checkRateLimit(rlStore, rlKey, { limit, windowMs: RL_WINDOW_MS });
  if (!rl.allowed) {
    const ra = Math.ceil((rl.reset - Date.now())/1000);
  incrRateLimited(toolName);
  logAgent({ level: 'error', msg: 'rate-limited', tool: toolName, sessionId, ip, remaining: rl.remaining, reset: rl.reset, correlationId: cid });
    return new Response(JSON.stringify({ ok: false, error: 'rate-limited', sessionId, tool: toolName, retryAfter: ra, correlationId: cid }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': ra.toString() } });
  }
  const validationErr = validateInput(tool, input);
  if (validationErr) return jsonError(`invalid-input:${validationErr}`, 400, start, sessionId, cid);
  const ctx = {
    env,
    ip: ip || undefined,
    isSuperAdmin,
    flags,
    now: Date.now(),
    session
  };
  let result;
  try {
    result = await tool.execute(input, ctx as any);
  } catch (e:any) {
  incrToolError(toolName);
  logAgent({ level: 'error', msg: 'tool-error', tool: toolName, sessionId, ip, error: e?.message, correlationId: cid });
    return jsonError('tool-error', 500, start, sessionId, cid);
  }
  session.messages.push({ role: 'user', content: JSON.stringify({ tool: toolName, input }), ts: Date.now() });
  await saveSession(env, session);
  const response: AgentResponseBody = {
    sessionId: session.id,
    ok: result.ok,
    tool: toolName,
    result: result.ok ? result.data : undefined,
    error: result.ok ? undefined : result.error || 'error',
    latencyMs: Date.now() - start
  };
  incrToolCall(toolName);
  logAgent({ level: 'info', msg: 'tool-exec', tool: toolName, sessionId: session.id, ip, latencyMs: response.latencyMs, correlationId: cid });
  return new Response(JSON.stringify({ ...response, correlationId: cid }), { status: result.ok ? 200 : 400, headers: { 'Content-Type': 'application/json' } });
}

async function parseBody(req: Request, start: number, env: any): Promise<any> {
  const raw = await req.text();
  if (raw.length > 10_000) return { errorResponse: new Response(JSON.stringify({ ok: false, error: 'payload-too-large' }), { status: 413, headers: { 'Content-Type': 'application/json' } }) };
  let parsed: AgentRequestBody;
  try { parsed = JSON.parse(raw); } catch { return { errorResponse: jsonError('invalid-json', 400, start, 'unknown') }; }
  if (!parsed || typeof parsed !== 'object') return { errorResponse: jsonError('invalid-body', 400, start, 'unknown') };
  const toolName = parsed.tool;
  if (typeof toolName !== 'string' || !toolName) return { errorResponse: jsonError('missing-tool', 400, start, 'unknown') };
  const sessionId: string = parsed.sessionId || `sess_${randomId()}`;
  let session = await loadSession(env, sessionId);
  session ??= newSession(sessionId);
  const superAdminKey = env.SUPER_ADMIN_KEY;
  const providedKey = req.headers.get('x-admin-key') || undefined;
  const isSuperAdmin = !!(superAdminKey && providedKey && providedKey === superAdminKey);
  const input = parsed.input || {};
  return { toolName, session, sessionId, input, isSuperAdmin };
}

function jsonError(code: string, status: number, start: number, sessionId: string, correlationId?: string) {
  const body = { sessionId, ok: false, tool: 'unknown', error: code, latencyMs: Date.now() - start, correlationId };
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
