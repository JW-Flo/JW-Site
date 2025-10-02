import { describe, it, expect } from 'vitest';
import { GET as GuestbookGET } from '../pages/api/guestbook.ts';

// Minimal mocks for locals/runtime/env
function makeLocals(overrides: any = {}) {
  return {
    runtime: { env: { DB: { prepare: () => ({ all: async () => ({ results: [] }) }) }, ...overrides } }
  } as any;
}

describe('Guestbook dynamic mode flag', () => {
  it('falls back to legacy when no flag set', async () => {
    delete process.env.GUESTBOOK_DYNAMIC_MODE;
    const resp = await GuestbookGET({ locals: makeLocals(), clientAddress: '1.1.1.1' } as any);
  const data: any[] = await resp.json();
    // Legacy nonProd heuristics likely true in test env, dynamic entry should appear
    const hasPlaywright = data.some((e: any) => e.name === 'Playwright Test User');
    expect(hasPlaywright).toBe(true);
  });

  it('disables dynamic test entry when flag false', async () => {
    process.env.GUESTBOOK_DYNAMIC_MODE = 'false';
    const resp = await GuestbookGET({ locals: makeLocals(), clientAddress: '2.2.2.2' } as any);
  const data: any[] = await resp.json();
    const hasPlaywright = data.some((e: any) => e.name === 'Playwright Test User' && e.id === 999999);
    expect(hasPlaywright).toBe(false);
  });

  it('enables dynamic test entry when flag true', async () => {
    process.env.GUESTBOOK_DYNAMIC_MODE = 'true';
    const resp = await GuestbookGET({ locals: makeLocals(), clientAddress: '3.3.3.3' } as any);
  const data: any[] = await resp.json();
    const hasPlaywright = data.some((e: any) => e.name === 'Playwright Test User' && e.id === 999999);
    expect(hasPlaywright).toBe(true);
  });
});
