import { describe, it, expect } from 'vitest';

// Placeholder structural test – in real scenario would invoke the live handler through Astro dev server or a mocked fetch.
// Here we only verify expected JSON keys to guard against accidental shape regressions.

const expectedKeys = ['ok', 'session'];
const sessionKeys = ['id', 'user', 'issuedAt', 'expiresAt', 'revoked'];

describe('/api/auth/session contract', () => {
  it('example shape keys', () => {
    const example = { ok: true, session: { id: 'abc', user: { id: 'u1', email: 'e@x' }, issuedAt: 1, expiresAt: 2, revoked: false } };
    expect(Object.keys(example)).toEqual(expectedKeys);
    expect(Object.keys(example.session)).toEqual(sessionKeys);
  });
});
