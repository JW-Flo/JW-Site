import { describe, it, expect } from 'vitest';
import { loadFlags, projectClientFlags } from '../config/flags.js';

// Basic unit tests for flag projection & CSP header presence via mock middleware
import { onRequest } from '../middleware.js';

function mockEnv(overrides: any = {}) {
  return { FEATURE_CONSENT_D1: 'true', FEATURE_GEO_CLASSIFICATION: 'false', FEATURE_WAITLIST: 'true', ...overrides };
}

describe('Feature flags projection', () => {
  it('projects expected flag keys as strings', () => {
    const flags = loadFlags(mockEnv());
    const projected = projectClientFlags(flags);
    expect(projected).toHaveProperty('FEATURE_CONSENT_D1', 'true');
    expect(projected).toHaveProperty('FEATURE_GEO_CLASSIFICATION', 'false');
    expect(projected).toHaveProperty('FEATURE_WAITLIST', 'true');
  });
});

describe('CSP middleware', () => {
  it('adds CSP header', async () => {
    const req = new Request('https://example.test/');
  const r = await onRequest({ request: req, locals: {}, url: new URL(req.url) } as any, async () => new Response('ok')) as Response;
  expect(r instanceof Response).toBe(true);
  expect(r.headers.get('Content-Security-Policy')).toBeTruthy();
  expect(r.headers.get('X-Frame-Options')).toBe('DENY');
  });
});
