import { AtlasITError, logger as sharedLogger } from '@atlasit/shared';
export class ApiKeyAuthenticator {
    allowedKeys;
    optional;
    logger;
    description;
    constructor(options) {
        this.allowedKeys = Object.freeze([...options.allowedKeys]);
        this.optional = options.optional ?? this.allowedKeys.length === 0;
        this.description = options.description ?? 'api-key';
        this.logger = (options.logger ?? sharedLogger).withContext({
            component: 'api-key-authenticator',
            description: this.description,
        });
    }
    static fromEnv(raw, options) {
        const allowedKeys = parseAllowedApiKeys(raw);
        return new ApiKeyAuthenticator({
            allowedKeys,
            optional: allowedKeys.length === 0,
            logger: options?.logger,
            description: options?.description,
        });
    }
    static redact(apiKey) {
        if (!apiKey) {
            return '***missing***';
        }
        const trimmed = apiKey.trim();
        if (trimmed.length <= 6) {
            return `${trimmed[0] ?? '*'}***${trimmed[trimmed.length - 1] ?? '*'}`;
        }
        return `${trimmed.substring(0, 4)}***${trimmed.substring(trimmed.length - 2)}`;
    }
    async verify(providedKey) {
        if (this.optional) {
            return { status: 'skipped' };
        }
        if (!providedKey) {
            this.logger.warn('Missing API key');
            return { status: 'missing' };
        }
        for (const key of this.allowedKeys) {
            if (await this.matches(key, providedKey)) {
                const actor = key.label ?? ApiKeyAuthenticator.redact(providedKey);
                this.logger.info('API key authenticated', { actor });
                return {
                    status: 'valid',
                    actor,
                    matchedKey: key,
                };
            }
        }
        this.logger.warn('Invalid API key attempt', {
            provided: ApiKeyAuthenticator.redact(providedKey),
        });
        return { status: 'invalid' };
    }
    async matches(allowed, provided) {
        if (allowed.hashed) {
            const hashedProvided = await sha256(provided.trim());
            return timingSafeEqual(hashedProvided, allowed.value);
        }
        return timingSafeEqual(provided.trim(), allowed.value);
    }
}
export function parseAllowedApiKeys(raw) {
    if (!raw) {
        return [];
    }
    const entries = raw
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    return entries.map((entry) => parseAllowedApiKey(entry));
}
function parseAllowedApiKey(entry) {
    const [labelPart, valuePart] = entry.includes('=') ? entry.split('=', 2) : [undefined, entry];
    const trimmedValue = (valuePart ?? '').trim();
    if (!trimmedValue) {
        throw new AtlasITError('AUTH_CONFIG_INVALID', 'API key entry is empty');
    }
    const isHashed = trimmedValue.startsWith('sha256:');
    const secret = isHashed ? trimmedValue.substring('sha256:'.length) : trimmedValue;
    if (isHashed && !/^[a-f0-9]{64}$/i.test(secret)) {
        throw new AtlasITError('AUTH_CONFIG_INVALID', 'Hashed API key must be a 64 character hex string');
    }
    return {
        label: labelPart?.trim() || undefined,
        value: secret,
        hashed: isHashed,
    };
}
async function sha256(value) {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return bufferToHex(hashBuffer);
    }
    // Node.js fallback
    const nodeCrypto = await import('node:crypto');
    return nodeCrypto.createHash('sha256').update(value).digest('hex');
}
function bufferToHex(buffer) {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}
function timingSafeEqual(a, b) {
    const aBytes = new TextEncoder().encode(a);
    const bBytes = new TextEncoder().encode(b);
    const length = Math.max(aBytes.length, bBytes.length);
    let diff = aBytes.length === bBytes.length ? 0 : 1;
    for (let i = 0; i < length; i++) {
        const aByte = i < aBytes.length ? aBytes[i] : 0;
        const bByte = i < bBytes.length ? bBytes[i] : 0;
        diff |= aByte ^ bByte;
    }
    return diff === 0;
}
