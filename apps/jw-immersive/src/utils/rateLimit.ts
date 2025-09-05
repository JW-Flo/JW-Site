/* Simple token bucket rate limiting using KV. Each key has a bucket with a capacity and refill interval.
 * KV schema (per user key): JSON: { tokens: number, updated: epoch_ms }
 */

export interface RateLimitOptions {
  kv: KVNamespace;
  key: string; // unique identifier (e.g., ip or ip:route)
  max: number; // capacity
  windowMs: number; // refill window for full bucket
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number; // epoch ms when bucket considered full again
}

export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { kv, key, max, windowMs } = opts;
  const now = Date.now();
  const raw = await kv.get(key);
  let tokens = max;
  let updated = now;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { tokens: number; updated: number };
      tokens = parsed.tokens;
      updated = parsed.updated;
    } catch (err) {
      console.debug('rateLimit: parse error', err);
    }
  }
  // Refill logic: proportion of time elapsed since last update
  const elapsed = now - updated;
  if (elapsed > 0) {
    const refill = (elapsed / windowMs) * max;
    tokens = Math.min(max, tokens + refill);
  }
  let allowed = false;
  if (tokens >= 1) {
    allowed = true;
    tokens -= 1;
  }
  await kv.put(key, JSON.stringify({ tokens, updated: now }), { expirationTtl: Math.ceil(windowMs / 1000) * 2 });
  const reset = now + ((max - tokens) / max) * windowMs;
  return { allowed, remaining: Math.floor(tokens), reset };
}
