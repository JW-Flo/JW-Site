import { describe, it, expect } from 'vitest';
import { generateRandomString, createStateCookie, parseCookie, noStoreHeaders, jsonResponse } from '../index.js';

describe('edge-utils', () => {
  it('generateRandomString', () => {
    const str = generateRandomString(16);
    expect(str).toHaveLength(32); // 16 bytes * 2 hex chars
    expect(str).toMatch(/^[0-9a-f]+$/);
  });

  it('createStateCookie', () => {
    const cookie = createStateCookie('test-state');
    expect(cookie).toContain('oauth_state=test-state');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
  });

  it('parseCookie', () => {
    const header = 'oauth_state=abc123; other=value';
    expect(parseCookie(header, 'oauth_state')).toBe('abc123');
    expect(parseCookie(header, 'missing')).toBeNull();
    expect(parseCookie(null, 'oauth_state')).toBeNull();
  });

  it('noStoreHeaders', () => {
    const headers = noStoreHeaders();
    expect(headers['Cache-Control']).toContain('no-store');
    expect(headers['Pragma']).toBe('no-cache');
  });

  it('jsonResponse', () => {
    const res = jsonResponse({ test: 'data' }, 201, { 'X-Custom': 'value' });
    expect(res.status).toBe(201);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('X-Custom')).toBe('value');
  });
});
