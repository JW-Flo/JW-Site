import { generateRandomString } from '@atlasit/edge-utils';

export interface SessionRecord {
  id: string;
  user_id: string;
  email?: string;
  tenant_id?: string;
  refresh_token_hash: string;
  created_at: string; // ISO
  expires_at: string; // ISO
  revoked_at?: string | null;
  ip?: string | null;
  user_agent?: string | null;
}

function toIso(ts: number) { return new Date(ts).toISOString(); }

async function sha256(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function sessionStore(env: any) {
  // Fallbacks for local tests/dev when bindings are absent
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
            if (/WHERE user_id = \?1/i.test(sql)) {
              const [userId] = this._binds;
              const now = new Date().toISOString();
              for (const s of self.sessions.values()) {
                if (s.user_id === userId) s.revoked_at = now;
              }
            } else if (/WHERE id = \?1/i.test(sql)) {
              const [id] = this._binds;
              const s = self.sessions.get(id);
              if (s) { s.revoked_at = new Date().toISOString(); }
            }
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
        async all() {
          if (/FROM sessions WHERE user_id = \?1/i.test(sql)) {
            const [userId] = this._binds;
            const results = Array.from(self.sessions.values()).filter((s: any) => s.user_id === userId)
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return { results } as any;
          }
          return { results: [] } as any;
        }
      };
      return obj as any;
    }
  }

  const g: any = globalThis as any;
  if (!env?.SESSION) {
    g.__atlasitTestKV = g.__atlasitTestKV || new KVMock();
  }
  if (!env?.D1_DB) {
    g.__atlasitTestD1 = g.__atlasitTestD1 || new D1Mock();
  }
  const kv = env?.SESSION ?? g.__atlasitTestKV;
  const db = env?.D1_DB ?? g.__atlasitTestD1;

  const KV_PREFIX = 'sess:';
  const ABSOLUTE_DEFAULT_SECONDS = 60 * 60 * 8; // 8 hours
  const IDLE_DEFAULT_SECONDS = 60 * 30; // 30 minutes

  async function cachePut(session: SessionRecord, ttlSeconds: number) {
    await kv.put(KV_PREFIX + session.id, JSON.stringify(session), { expirationTtl: ttlSeconds });
  }
  async function cacheGet(id: string): Promise<SessionRecord | null> {
    const raw = await kv.get(KV_PREFIX + id);
    if (!raw) return null;
    try { return JSON.parse(raw) as SessionRecord; } catch { return null; }
  }
  async function cacheDelete(id: string) { await kv.delete(KV_PREFIX + id); }

  return {
    async createSession(user: { id: string; email?: string; tenantId?: string }, opts: { ttlSeconds?: number; ip?: string; ua?: string } = {}) {
      const id = generateRandomString(32);
      const refresh = generateRandomString(48);
      const refreshHash = await sha256(refresh);
      const now = Date.now();
      const absoluteTtl = opts.ttlSeconds ?? ABSOLUTE_DEFAULT_SECONDS;
      const expires = now + absoluteTtl * 1000;

      await db.prepare(
        `INSERT INTO sessions (id, user_id, email, tenant_id, refresh_token_hash, created_at, expires_at, ip, user_agent)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime(?6/1000, 'unixepoch'), ?7, ?8)`
      ).bind(id, user.id, user.email ?? null, user.tenantId ?? null, refreshHash, expires, opts.ip ?? null, opts.ua ?? null).run();

      const record: SessionRecord = {
        id,
        user_id: user.id,
        email: user.email,
        tenant_id: user.tenantId,
        refresh_token_hash: refreshHash,
        created_at: toIso(now),
        expires_at: toIso(expires),
        revoked_at: null,
        ip: opts.ip ?? null,
        user_agent: opts.ua ?? null,
      };
      // Cache with idle TTL (do not exceed absolute)
      const initialTtl = Math.min(IDLE_DEFAULT_SECONDS, Math.floor((expires - now) / 1000));
      await cachePut(record, initialTtl);
      return { id, refreshToken: refresh, record };
    },

    async getSession(id: string): Promise<SessionRecord | null> {
      // Try KV first
      const cached = await cacheGet(id);
      if (cached) {
        const remaining = Math.max(1, Math.floor((new Date(cached.expires_at).getTime() - Date.now()) / 1000));
        const ttl = Math.min(IDLE_DEFAULT_SECONDS, remaining);
        await cachePut(cached, ttl);
        return cached;
      }
      // Fallback to D1
  const row = await db.prepare(
        `SELECT id, user_id, email, tenant_id, refresh_token_hash, created_at, expires_at, revoked_at, ip, user_agent
         FROM sessions WHERE id = ?1`
  ).bind(id).first().then((r: any) => r as SessionRecord);
      if (!row) return null;
      // Rehydrate cache with remaining TTL
      const remaining = Math.max(1, Math.floor((new Date(row.expires_at).getTime() - Date.now()) / 1000));
      const ttl = Math.min(IDLE_DEFAULT_SECONDS, remaining);
      await cachePut(row, ttl);
      return row;
    },

    async rotateRefresh(id: string, providedRefresh: string, opts: { ttlSeconds?: number } = {}) {
      const session = await this.getSession(id);
      if (!session || session.revoked_at) return null;
      const now = Date.now();
      if (new Date(session.expires_at).getTime() <= now) return null;
      const providedHash = await sha256(providedRefresh);
      if (providedHash !== session.refresh_token_hash) return null;
      // Generate new refresh and extend expiry
      const newRefresh = generateRandomString(48);
      const newHash = await sha256(newRefresh);
      const remaining = Math.max(1, Math.floor((new Date(session.expires_at).getTime() - now) / 1000));
      const ttlSeconds = Math.min(IDLE_DEFAULT_SECONDS, remaining);
      await db.prepare(`UPDATE sessions SET refresh_token_hash = ?1 WHERE id = ?2`).bind(newHash, id).run();
      const updated: SessionRecord = { ...session, refresh_token_hash: newHash };
      await cachePut(updated, ttlSeconds);
      return { session: updated, refreshToken: newRefresh };
    },

    async revoke(id: string) {
      await db.prepare(`UPDATE sessions SET revoked_at = datetime('now') WHERE id = ?1`).bind(id).run();
      await cacheDelete(id);
    },

    async listForUser(userId: string): Promise<SessionRecord[]> {
      const rows = await db.prepare(
        `SELECT id, user_id, email, tenant_id, refresh_token_hash, created_at, expires_at, revoked_at, ip, user_agent
         FROM sessions WHERE user_id = ?1 ORDER BY datetime(created_at) DESC LIMIT 100`
      ).bind(userId).all().then((r: any) => (r?.results ?? r) as SessionRecord[]);
      return rows || [];
    },

    async revokeAllForUser(userId: string) {
      await db.prepare(`UPDATE sessions SET revoked_at = datetime('now') WHERE user_id = ?1`).bind(userId).run();
      // Purge KV cache for this user's sessions
      const rows = await db.prepare(`SELECT id FROM sessions WHERE user_id = ?1`).bind(userId).all().then((r: any) => (r?.results ?? r) as any[]);
      for (const r of rows) {
        if (r?.id) await cacheDelete(r.id);
      }
    }
  };
}
