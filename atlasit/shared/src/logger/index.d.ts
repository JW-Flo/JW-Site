export interface LogContext {
    requestId?: string;
    actor?: string;
    tenantId?: string;
    [key: string]: any;
}
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare class Logger {
    private readonly context;
    constructor(context?: LogContext);
    private formatMessage;
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, error?: unknown, meta?: any): void;
    withContext(context: LogContext): Logger;
}
export declare const logger: Logger;
//# sourceMappingURL=index.d.ts.map