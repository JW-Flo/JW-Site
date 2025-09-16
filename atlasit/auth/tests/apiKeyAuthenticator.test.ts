import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'node:crypto';
import {
  ApiKeyAuthenticator,
  parseAllowedApiKeys,
} from '../src/apiKeyAuthenticator';
import type { Logger } from '@atlasit/shared';

function createStubLogger() {
  const record = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const logger: Logger = {
    ...record,
    withContext: vi.fn(() => logger),
  } as unknown as Logger;

  return { logger, record };
}

describe('ApiKeyAuthenticator', () => {
  it('skips verification when no allowed keys are provided', async () => {
    const authenticator = ApiKeyAuthenticator.fromEnv(undefined);
    const result = await authenticator.verify(undefined);
    expect(result.status).toBe('skipped');
  });

  it('authenticates a valid API key and records actor label', async () => {
    const { logger, record } = createStubLogger();
    const authenticator = ApiKeyAuthenticator.fromEnv('service-key=abc123', {
      logger,
    });

    const result = await authenticator.verify('abc123');

    expect(result.status).toBe('valid');
    expect(result.actor).toBe('service-key');
    expect(record.info).toHaveBeenCalledWith('API key authenticated', {
      actor: 'service-key',
    });
  });

  it('authenticates a hashed API key using SHA-256 comparison', async () => {
    const hash = createHash('sha256').update('super-secret').digest('hex');
    const authenticator = ApiKeyAuthenticator.fromEnv(`hashed=sha256:${hash}`);

    const result = await authenticator.verify('super-secret');
    expect(result.status).toBe('valid');
    expect(result.actor).toBe('hashed');
  });

  it('flags missing API key when authentication is required', async () => {
    const { record, logger } = createStubLogger();
    const authenticator = ApiKeyAuthenticator.fromEnv('alpha=one', { logger });

    const result = await authenticator.verify(undefined);

    expect(result.status).toBe('missing');
    expect(record.warn).toHaveBeenCalledWith('Missing API key');
  });

  it('redacts invalid API key attempts in logs', async () => {
    const { record, logger } = createStubLogger();
    const authenticator = ApiKeyAuthenticator.fromEnv('alpha=one', { logger });

    const result = await authenticator.verify('attack-secret');

    expect(result.status).toBe('invalid');
    expect(record.warn).toHaveBeenCalledWith('Invalid API key attempt', {
      provided: expect.stringMatching(/^atta\*\*\*et$/),
    });
  });

  it('redacts secrets and validates configuration parsing', () => {
    const hashed = parseAllowedApiKeys('a=sha256:deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
    expect(hashed).toHaveLength(1);
    expect(hashed[0]).toMatchObject({
      label: 'a',
      hashed: true,
    });

    expect(ApiKeyAuthenticator.redact('supersecret')).toBe('supe***et');

    expect(() => parseAllowedApiKeys('broken=sha256:not-hex')).toThrowError(
      /64 character hex string/
    );
  });
});
