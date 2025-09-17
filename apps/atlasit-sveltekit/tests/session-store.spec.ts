import { describe, it, expect } from 'vitest';
import { sessionStore } from '../src/lib/server/sessionStore';

// Minimal KV mock
class KVMock {
  private readonly map = new Map<string, { v: string; exp?: number }>();
  async put(key: string, value: string, options?: { expirationTtl?: number }) {
    const exp = options?.expirationTtl ? Date.now() + options.expirationTtl * 1000 : undefined;
    this.map.set(key, { v: value, exp });
  }
  async get(key: string) {
    const e = this.map.get(key);
    if (!e) return null;
    if (e.exp && e.exp < Date.now()) { this.map.delete(key); return null; }
    return e.v;
  }
  async delete(key: string) { this.map.delete(key); }
}

// Minimal D1 mock backed by in-memory object
class D1Mock {
  sessions = new Map<string, any>();
  prepare(sql: string) {
    const self = this;
    const obj = {
      _sql: sql,
      _binds: [] as any[],
      bind(...args: any[]) { this._binds = args; return this; },
      async run() {
        if (/INSERT INTO sessions/i.test(sql)) {
          const [id, user_id, email, tenant_id, refresh_hash, , expires_at, ip, ua] = this._binds;
          self.sessions.set(id, { id, user_id, email, tenant_id, refresh_token_hash: refresh_hash, created_at: new Date().toISOString(), expires_at: new Date(expires_at).toISOString(), revoked_at: null, ip, user_agent: ua });
        } else if (/UPDATE sessions SET refresh_token_hash/i.test(sql)) {
          const [hash, id] = this._binds;
          const s = self.sessions.get(id);
          if (s) { s.refresh_token_hash = hash; }
        } else if (/UPDATE sessions SET revoked_at/i.test(sql)) {
          const [id] = this._binds;
          const s = self.sessions.get(id);
          if (s) { s.revoked_at = new Date().toISOString(); }
        }
        return { success: true } as any;
      },
      async first() {
        if (/FROM sessions WHERE id = \?1/i.test(sql)) {
          const [id] = this._binds;
          return self.sessions.get(id) || null;
        }
        return null;
      },
    };
    return obj as any;
  }
}

describe('sessionStore', () => {
  it('creates, gets, rotates, and revokes sessions', async () => {
    const env: any = { SESSION: new KVMock(), D1_DB: new D1Mock() };
    const store = sessionStore(env);

    const { id, refreshToken } = await store.createSession({ id: 'u1', email: 'a@b.com', tenantId: 't1' }, { ttlSeconds: 60 });
    const s1 = await store.getSession(id);
    expect(s1?.user_id).toBe('u1');

    const rotated = await store.rotateRefresh(id, refreshToken);
    expect(rotated?.refreshToken).toBeTruthy();
    const rotatedFail = await store.rotateRefresh(id, refreshToken);
    expect(rotatedFail).toBeNull();

    await store.revoke(id);
    const s2 = await store.getSession(id);
    expect(s2?.revoked_at).toBeTruthy();
  });
});
