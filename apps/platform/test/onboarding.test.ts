import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as OnboardingPOST } from '../src/pages/api/onboarding';

const analyticsMock = vi.fn();
vi.mock('../src/utils/analytics-server', () => ({
  storeAnalyticsEvent: (event: any) => {
    analyticsMock(event);
    return Promise.resolve();
  },
}));

describe('Onboarding API', () => {
  beforeEach(() => {
    analyticsMock.mockClear();
  });

  it('returns error for invalid tenant id', async () => {
    const request = new Request('http://localhost/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenantId: 'invalid id', name: 'Example', industry: 'technology' }),
    });

    const response = await OnboardingPOST({ request } as any);
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toContain('letters, numbers, dashes');
  });

  it('processes onboarding successfully and logs analytics', async () => {
    const request = new Request('http://localhost/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenantId: 'acme-2025', name: 'Acme Corp', industry: 'technology' }),
    });

    const response = await OnboardingPOST({ request } as any);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.configuration.defaultApplications).toBeTruthy();
    expect(analyticsMock).toHaveBeenCalledWith(expect.objectContaining({ event: 'onboarding_started' }));
  });

  it('returns 400 for invalid JSON payload', async () => {
    const request = new Request('http://localhost/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    });

    const response = await OnboardingPOST({ request } as any);
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.code).toBe('INVALID_JSON');
    expect(analyticsMock).not.toHaveBeenCalled();
  });

  it('captures analytics failures without breaking onboarding flow', async () => {
    analyticsMock.mockImplementationOnce(() => Promise.reject(new Error('tracking down')));

    const request = new Request('http://localhost/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenantId: 'acme-2025', name: 'Acme Corp', industry: 'technology' }),
    });

    const response = await OnboardingPOST({ request, clientAddress: '203.0.113.10' } as any);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.requestId).toBeTruthy();
  });

  it('validates missing company name', async () => {
    const request = new Request('http://localhost/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenantId: 'tenant-01', name: '', industry: 'technology' }),
    });

    const response = await OnboardingPOST({ request } as any);
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toContain('Company name is required');
  });
});
