export function rateLimiter(env: any, { windowSec = 60, max = 20 } = {}) {
  let kv = env?.SESSION || (globalThis as any).__atlasitTestKV;
  if (!kv) {
    // minimal in-memory fallback for tests
    const map = new Map<string, { v: string; exp?: number }>();
    kv = {
      async get(key: string) {
        const e = map.get(key);
        if (!e) return null;
        if (e.exp && e.exp < Date.now()) { map.delete(key); return null; }
        return e.v;
      },
      async put(key: string, value: string, options?: { expirationTtl?: number }) {
        const exp = options?.expirationTtl ? Date.now() + options.expirationTtl * 1000 : undefined;
        map.set(key, { v: value, exp });
      }
    } as any;
  }
  const prefix = 'rl:';
  return {
    async check(key: string) {
      const now = Math.floor(Date.now() / 1000);
      const bucket = `${prefix}${key}:${Math.floor(now / windowSec)}`;
      const raw = await kv.get(bucket);
      const count = raw ? parseInt(raw, 10) : 0;
      if (count >= max) return false;
      await kv.put(bucket, String(count + 1), { expirationTtl: windowSec });
      return true;
    }
  };
}
