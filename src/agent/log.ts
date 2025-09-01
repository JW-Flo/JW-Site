// Lightweight structured logging for agent actions (AGENT Phase 1)
interface LogEntry {
  level: 'info' | 'error';
  msg: string;
  tool?: string;
  sessionId?: string;
  ip?: string;
  latencyMs?: number;
  error?: string;
  remaining?: number;
  reset?: number;
}

export function logAgent(entry: LogEntry) {
  try {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ t: Date.now(), src: 'agent', ...entry }));
  } catch {
    // swallow
  }
}
