// Minimal structured logging helpers for Workers runtime.
// Usage: log.info('event_name', { detail: 'value' })

type Level = 'info' | 'warn' | 'error' | 'debug';

function emit(level: Level, event: string, data?: Record<string, unknown>) {
  const entry = { ts: new Date().toISOString(), level, event, ...data };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

export const log = {
  info: (event: string, data?: Record<string, unknown>) => emit('info', event, data),
  warn: (event: string, data?: Record<string, unknown>) => emit('warn', event, data),
  error: (event: string, data?: Record<string, unknown>) => emit('error', event, data),
  debug: (event: string, data?: Record<string, unknown>) => emit('debug', event, data)
};
