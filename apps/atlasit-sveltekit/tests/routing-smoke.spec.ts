import { describe, it, expect } from 'vitest';

describe('Routing smoke', () => {
  it('public pages import without error', async () => {
    await import('../src/routes/login/+page.svelte');
    await import('../src/routes/onboarding/+page.svelte');
    await import('../src/routes/marketplace/+page.svelte');
    await import('../src/routes/orchestrator/+page.svelte');
    await import('../src/routes/api-manager/+page.svelte');
    expect(true).toBe(true);
  });
});
