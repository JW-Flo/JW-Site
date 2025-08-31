import { describe, it, expect } from 'vitest';
import { ScanStore } from '../utils/scanStore.js';

// Mock environment
const env = { SESSION_SIGNING_KEY: 'test-sign', SCANNER_META: undefined } as any;

function mockRequest(cookie?: string) {
  return new Request('https://example.com', { headers: cookie ? { Cookie: cookie } : {} });
}

describe('Super Admin Elevation', () => {
  it('elevates a session to super admin', async () => {
    const store = new ScanStore(env);
    const { record, cookieHeader } = await store.getOrCreateSession(mockRequest());
    expect(record.role).toBeUndefined();
    store.elevateToSuperAdmin(record);
    expect(record.role).toBe('sa');
    // Subsequent retrieval should keep role
    const req2 = mockRequest(cookieHeader?.split(';')[0]);
    const { record: rec2 } = await store.getOrCreateSession(req2);
    expect(rec2.role).toBe('sa');
  });
});
