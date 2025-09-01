import { rateLimit } from './rateLimit.js';

export interface ApplyRateLimitOptions {
  env: any; // Cloudflare env (provides RATE_LIMIT KV)
  key: string; // unique key (already includes route prefix)
  max?: number; // default 20
  windowMs?: number; // default 60000 (1m)
}

export async function applyRateLimit(opts: ApplyRateLimitOptions) {
  const { env, key, max = 20, windowMs = 60_000 } = opts;
  const kv: KVNamespace | undefined = env?.RATE_LIMIT;
  if (!kv) {
    // If KV not bound, allow all (development fallback)
    return { allowed: true, remaining: max, reset: Date.now() + windowMs };
  }
  return rateLimit({ kv, key, max, windowMs });
}

export function rateLimitHeaders(result: { remaining: number; reset: number }) {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
    'Retry-After': Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)).toString()
  };
}
