import { describe, it, expect } from 'vitest';

describe('Route smoke tests', () => {
  it('onboarding page module exists', async () => {
    const mod = await import('../src/routes/onboarding/+page.svelte');
    expect(mod).toBeTruthy();
  });
  it('marketplace page module exists', async () => {
    const mod = await import('../src/routes/marketplace/+page.svelte');
    expect(mod).toBeTruthy();
  });
  it('orchestrator page module exists', async () => {
    const mod = await import('../src/routes/orchestrator/+page.svelte');
    expect(mod).toBeTruthy();
  });
  it('api-manager page module exists', async () => {
    const mod = await import('../src/routes/api-manager/+page.svelte');
    expect(mod).toBeTruthy();
  });
  it('dashboard guard exists', async () => {
    const mod = await import('../src/routes/dashboard/+page.server');
    expect(mod).toHaveProperty('load');
  });
});
