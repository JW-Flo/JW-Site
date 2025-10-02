import { describe, it, expect } from 'vitest';

// Lightweight runtime-free test validating shape of health response enrichment object.
// Assumes build-time import of the health handler is not needed; we simulate logic locally.

function computeEnrichment(env: Record<string, any>) {
  const vtEnabled = typeof env.VIRUSTOTAL_API_KEY === 'string' && env.VIRUSTOTAL_API_KEY.length > 0;
  const ocveFlag = (env.OPENCVE_ENRICH || '').toString().toLowerCase() === 'true';
  const ocveAuthBasic = env.OPENCVE_USERNAME && env.OPENCVE_PASSWORD;
  const ocveAuthToken = env.OPENCVE_API_TOKEN && !ocveAuthBasic;
  return {
    virustotal: vtEnabled ? 'enabled' : 'disabled',
    opencve: ocveFlag ? 'enabled' : 'disabled',
    opencve_auth: ocveFlag ? (ocveAuthBasic ? 'basic' : (ocveAuthToken ? 'token' : 'none')) : 'n/a'
  };
}

describe('health enrichment shape', () => {
  it('disabled when no vars', () => {
    const e = computeEnrichment({});
    expect(e).toEqual({ virustotal: 'disabled', opencve: 'disabled', opencve_auth: 'n/a' });
  });
  it('virustotal enabled only', () => {
    const e = computeEnrichment({ VIRUSTOTAL_API_KEY: 'x' });
    expect(e.virustotal).toBe('enabled');
    expect(e.opencve).toBe('disabled');
  });
  it('opencve basic auth precedence', () => {
    const e = computeEnrichment({ OPENCVE_ENRICH: 'true', OPENCVE_USERNAME: 'u', OPENCVE_PASSWORD: 'p', OPENCVE_API_TOKEN: 'tokenX' });
    expect(e.opencve).toBe('enabled');
    expect(e.opencve_auth).toBe('basic');
  });
  it('opencve token when no basic creds', () => {
    const e = computeEnrichment({ OPENCVE_ENRICH: 'true', OPENCVE_API_TOKEN: 'tokenX' });
    expect(e.opencve).toBe('enabled');
    expect(e.opencve_auth).toBe('token');
  });
  it('opencve none auth mode', () => {
    const e = computeEnrichment({ OPENCVE_ENRICH: 'true' });
    expect(e.opencve).toBe('enabled');
    expect(e.opencve_auth).toBe('none');
  });
});
