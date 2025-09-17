import { describe, it, expect } from 'vitest';
import { getConfig } from '../index.js';

describe('config', () => {
  it('getConfig', () => {
    const mockEnv = {
      D1_DB: {} as any,
      KV_ATLASIT: {} as any,
      R2_BUCKET: {} as any,
      OAUTH_GOOGLE_CLIENT_ID: 'google-id',
      OAUTH_GOOGLE_CLIENT_SECRET: 'google-secret',
      OAUTH_ENTRA_CLIENT_ID: 'entra-id',
      OAUTH_ENTRA_CLIENT_SECRET: 'entra-secret',
      SITE_URL: 'https://test.com'
    };
    const config = getConfig(mockEnv);
    expect(config.SITE_URL).toBe('https://test.com');
    expect(config.OAUTH_GOOGLE_CLIENT_ID).toBe('google-id');
  });
});
