import { describe, it, expect } from 'vitest';
import { GET as compliance } from '../src/routes/api/reports/compliance/+server';

describe('Compliance reports API', () => {
  it('returns 401 when unauthorized', async () => {
    const res = await compliance({ request: new Request('https://atlasit.app/api/reports/compliance') } as any);
    expect(res.status).toBe(401);
  });

  it('returns report when authorized', async () => {
    const res = await compliance({
      request: new Request('https://atlasit.app/api/reports/compliance?framework=gdpr'),
      locals: { user: { id: 'u1', email: 'admin@atlasit.pro' } },
    } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.framework).toBe('GDPR');
    expect(Array.isArray(json.sections)).toBe(true);
  });
});
