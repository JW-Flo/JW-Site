// Common types used across AtlasIT services
// Error types
export class AtlasITError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.name = 'AtlasITError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}
//# sourceMappingURL=index.js.map