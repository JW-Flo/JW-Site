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
