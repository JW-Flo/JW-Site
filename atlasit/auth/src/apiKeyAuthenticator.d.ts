import { Logger } from '@atlasit/shared';
export type ApiKeyVerificationStatus = 'valid' | 'missing' | 'invalid' | 'skipped';
export interface ApiKeyVerificationResult {
    status: ApiKeyVerificationStatus;
    actor?: string;
    matchedKey?: AllowedApiKey;
}
export interface AllowedApiKey {
    label?: string;
    value: string;
    hashed: boolean;
}
export interface ApiKeyAuthenticatorOptions {
    allowedKeys: AllowedApiKey[];
    optional?: boolean;
    logger?: Logger;
    description?: string;
}
export declare class ApiKeyAuthenticator {
    private readonly allowedKeys;
    private readonly optional;
    private readonly logger;
    private readonly description;
    constructor(options: ApiKeyAuthenticatorOptions);
    static fromEnv(raw: string | undefined, options?: {
        logger?: Logger;
        description?: string;
    }): ApiKeyAuthenticator;
    static redact(apiKey: string | undefined): string;
    verify(providedKey: string | undefined): Promise<ApiKeyVerificationResult>;
    private matches;
}
export declare function parseAllowedApiKeys(raw: string | undefined): AllowedApiKey[];
//# sourceMappingURL=apiKeyAuthenticator.d.ts.map