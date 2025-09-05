export interface LogContext {
  requestId?: string;
  actor?: string;
  tenantId?: string;
  [key: string]: any;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private readonly context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...(meta && { meta })
    };
    return JSON.stringify(logEntry);
  }

  debug(message: string, meta?: any): void {
    console.debug(this.formatMessage('debug', message, meta));
  }

  info(message: string, meta?: any): void {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, error?: unknown, meta?: any): void {
    const errorMeta = error ? {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      ...meta
    } : meta;

    console.error(this.formatMessage('error', message, errorMeta));
  }

  withContext(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context });
  }
}

// Global logger instance
export const logger = new Logger();
