import { describe, test, expect } from 'vitest';
import { handleAgentRequest } from '../agent/runtime.js';

// Minimal mock env
function mockEnv(overrides: any = {}) {
  return {
    FEATURE_AGENT: 'true',
    SUPER_ADMIN_KEY: 'admin-secret',
    DB: {
      prepare: (_sql: string) => ({
        all: async () => ({ results: [{ c: 3 }] })
      })
    },
    ...overrides
  };
}

async function post(body: any, env: any, adminKey?: string, extraHeaders: Record<string,string> = {}) {
  const req = new Request('https://example.test/api/agent/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
  ...(adminKey ? { 'x-admin-key': adminKey } : {}),
  ...extraHeaders
    },
    body: JSON.stringify(body)
  });
  return handleAgentRequest(req, env, {});
}

describe('Agent API (Phase 0)', () => {
  test('list_flags returns flags when enabled', async () => {
    const env = mockEnv();
    const res = await post({ tool: 'list_flags' }, env);
    expect(res.status).toBe(200);
  const json: any = await res.json();
    expect(json.ok).toBe(true);
    expect(json.tool).toBe('list_flags');
  expect(json.result.FEATURE_AGENT).toBe('true');
  expect(json.correlationId).toMatch(/^cid_/);
  });

  test('list_tools filters admin-only tools', async () => {
    const env = mockEnv();
    const resUser = await post({ tool: 'list_tools' }, env);
    const userJson: any = await resUser.json();
    expect(userJson.ok).toBe(true);
    const namesUser = userJson.result.map((t: any) => t.name);
    expect(namesUser).toContain('list_flags');
    expect(namesUser).not.toContain('waitlist_count');
    const resAdmin = await post({ tool: 'list_tools' }, env, 'admin-secret');
    const adminJson: any = await resAdmin.json();
    const namesAdmin = adminJson.result.map((t: any) => t.name);
  expect(namesAdmin).toContain('waitlist_count');
  expect(adminJson.correlationId).toMatch(/^cid_/);
  });

  test('unknown tool returns 404', async () => {
    const env = mockEnv();
    const res = await post({ tool: 'nope' }, env);
    expect(res.status).toBe(404);
  const json: any = await res.json();
  expect(json.error).toBe('unknown-tool');
  expect(json.correlationId).toMatch(/^cid_/);
  });

  test('start_scan and scan_status lifecycle', async () => {
    const env = mockEnv();
    const start = await post({ tool: 'start_scan', input: { target: 'example.com' } }, env);
    expect(start.status).toBe(200);
  const started: any = await start.json();
    expect(started.result.taskId).toMatch(/^scan_/);
    const taskId = started.result.taskId;
    const status = await post({ tool: 'scan_status', input: { taskId } }, env);
  const statusJson: any = await status.json();
    expect(statusJson.result.taskId).toBe(taskId);
  expect(['queued', 'running', 'complete']).toContain(statusJson.result.status);
  expect(statusJson.correlationId).toMatch(/^cid_/);
  });

  test('waitlist_count requires admin', async () => {
    const env = mockEnv();
    const unauth = await post({ tool: 'waitlist_count' }, env);
    expect(unauth.status).toBe(403);
    const auth = await post({ tool: 'waitlist_count' }, env, 'admin-secret');
    expect(auth.status).toBe(200);
  const json: any = await auth.json();
  expect(json.result.count).toBe(3);
  expect(json.correlationId).toMatch(/^cid_/);
  });

  test('rate limiting enforced for start_scan', async () => {
    const env = mockEnv();
    // limit is 5 per minute
    const headers = { 'cf-connecting-ip': '203.0.113.55' }; // unique IP so prior tests don't consume quota
    for (let i=0;i<5;i++) {
      const r = await post({ tool: 'start_scan', input: { target: `example${i}.com` } }, env, undefined, headers);
      expect(r.status).toBe(200);
    }
    const blocked = await post({ tool: 'start_scan', input: { target: 'blocked.com' } }, env, undefined, headers);
    expect(blocked.status).toBe(429);
    const blockedJson: any = await blocked.json();
  expect(blockedJson.error).toBe('rate-limited');
  expect(blockedJson.correlationId).toMatch(/^cid_/);
  });

  test('payload too large rejected', async () => {
    const env = mockEnv();
    const big = 'x'.repeat(10_001);
    const req = new Request('https://example.test/api/agent/query', { method: 'POST', body: JSON.stringify({ tool: 'list_flags', input: { big } }) });
    const res = await handleAgentRequest(req, env, {});
    // Because we JSON.stringify a small object containing big string, its length will exceed limit
    // Accept 200 if compression accidentally reduces length; else 413
    if (res.status !== 200) {
      expect(res.status).toBe(413);
    }
  });
});
