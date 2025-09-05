export class Logger {
    context;
    constructor(context = {}) {
        this.context = context;
    }
    formatMessage(level, message, meta) {
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
    debug(message, meta) {
        console.debug(this.formatMessage('debug', message, meta));
    }
    info(message, meta) {
        console.log(this.formatMessage('info', message, meta));
    }
    warn(message, meta) {
        console.warn(this.formatMessage('warn', message, meta));
    }
    error(message, error, meta) {
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
    withContext(context) {
        return new Logger({ ...this.context, ...context });
    }
}
// Global logger instance
export const logger = new Logger();
//# sourceMappingURL=index.js.map