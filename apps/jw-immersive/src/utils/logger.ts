// Minimal structured logger utility
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext { [k: string]: any }

function ts() { return new Date().toISOString(); }

function write(level: LogLevel, msg: string, ctx?: LogContext) {
  const rec: any = { level, msg, time: ts() };
  if (ctx) Object.assign(rec, ctx);
  try { console[level === 'debug' ? 'log' : level](JSON.stringify(rec)); } catch { /* ignore */ }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => write('debug', msg, ctx),
  info: (msg: string, ctx?: LogContext) => write('info', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => write('warn', msg, ctx),
  error: (msg: string, ctx?: LogContext) => write('error', msg, ctx)
};
