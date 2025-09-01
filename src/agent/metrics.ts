// Simple in-memory metrics collector (AGENT-11)
// For Phase 2 baseline; future phases may persist or aggregate across instances.

export interface AgentMetricsSnapshot {
  startedAt: number;
  toolCalls: Record<string, number>;
  toolErrors: Record<string, number>;
  rateLimited: Record<string, number>; // per tool
  validationErrors: Record<string, number>; // per tool (input or output schema validation failures)
  totalCalls: number;
  totalErrors: number;
  totalRateLimited: number;
  totalValidationErrors: number;
}

const state: AgentMetricsSnapshot = {
  startedAt: Date.now(),
  toolCalls: {},
  toolErrors: {},
  rateLimited: {},
  validationErrors: {},
  totalCalls: 0,
  totalErrors: 0,
  totalRateLimited: 0,
  totalValidationErrors: 0
};

export function incrToolCall(tool: string) {
  state.totalCalls++;
  state.toolCalls[tool] = (state.toolCalls[tool] || 0) + 1;
}
export function incrToolError(tool: string) {
  state.totalErrors++;
  state.toolErrors[tool] = (state.toolErrors[tool] || 0) + 1;
}
export function incrRateLimited(tool: string) {
  state.totalRateLimited++;
  state.rateLimited[tool] = (state.rateLimited[tool] || 0) + 1;
}
export function incrValidationError(tool: string) {
  state.totalValidationErrors++;
  state.validationErrors[tool] = (state.validationErrors[tool] || 0) + 1;
}
export function snapshotMetrics(): AgentMetricsSnapshot {
  // Return shallow clone to avoid mutation from outside
  return JSON.parse(JSON.stringify(state));
}
export function resetMetrics() {
  state.startedAt = Date.now();
  state.toolCalls = {};
  state.toolErrors = {};
  state.rateLimited = {};
  state.validationErrors = {};
  state.totalCalls = 0;
  state.totalErrors = 0;
  state.totalRateLimited = 0;
  state.totalValidationErrors = 0;
}

// ---- Persistence (Phase upgrade) ----
const PERSIST_KEY = 'agent:metrics:v1';
let loadedFromKV = false;

function mergeMetrics(from: AgentMetricsSnapshot) {
  // Keep earliest startedAt to represent span of aggregation
  state.startedAt = Math.min(state.startedAt || Date.now(), from.startedAt || Date.now());
  for (const [k,v] of Object.entries(from.toolCalls||{})) state.toolCalls[k] = (state.toolCalls[k]||0)+v;
  for (const [k,v] of Object.entries(from.toolErrors||{})) state.toolErrors[k] = (state.toolErrors[k]||0)+v;
  for (const [k,v] of Object.entries(from.rateLimited||{})) state.rateLimited[k] = (state.rateLimited[k]||0)+v;
  for (const [k,v] of Object.entries(from.validationErrors||{})) state.validationErrors[k] = (state.validationErrors[k]||0)+v;
  state.totalCalls += from.totalCalls||0;
  state.totalErrors += from.totalErrors||0;
  state.totalRateLimited += from.totalRateLimited||0;
  state.totalValidationErrors += from.totalValidationErrors||0;
}

async function ensureLoaded(env: any) {
  if (loadedFromKV) return;
  loadedFromKV = true;
  try {
    if (!env?.AGENT_METRICS) return;
    const raw = await env.AGENT_METRICS.get(PERSIST_KEY);
    if (!raw) return;
    const parsed: AgentMetricsSnapshot = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') mergeMetrics(parsed);
  } catch (e:any) {
    // swallow; optionally log in future: console.debug('metrics load failed', e?.message);
  }
}

export async function persistMetricsIfNeeded(env: any) {
  try {
    if (env?.FEATURE_AGENT_METRICS_PERSIST !== 'true') return;
    if (!env?.AGENT_METRICS) return;
    await ensureLoaded(env);
    await env.AGENT_METRICS.put(PERSIST_KEY, JSON.stringify(state));
  } catch (e:any) {
    // ignore; optionally log: console.debug('metrics persist failed', e?.message);
  }
}

export async function loadPersistedMetrics(env: any) {
  await ensureLoaded(env);
  return snapshotMetrics();
}

export async function resetAndPersist(env: any) {
  resetMetrics();
  if (env?.FEATURE_AGENT_METRICS_PERSIST === 'true' && env?.AGENT_METRICS) {
    await env.AGENT_METRICS.put(PERSIST_KEY, JSON.stringify(state));
  }
  return snapshotMetrics();
}
