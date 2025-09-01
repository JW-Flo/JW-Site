// Persistent(ish) rate limiter with KV fallback (AGENT-12)
// Strategy: token bucket per key stored in KV as JSON { remaining, reset }
// If KV unavailable, fall back to in-memory map.

interface BucketState {
  remaining: number;
  reset: number; // epoch ms when window resets
}

const memoryBuckets: Record<string, BucketState> = {};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export interface RateLimitOptions {
  limit: number; // max requests per window
  windowMs: number; // window size
}

async function loadBucket(kv: KVNamespace | undefined, key: string): Promise<BucketState | undefined> {
  if (!kv) return memoryBuckets[key];
  const raw = await kv.get(`rl:${key}`);
  if (!raw) return undefined;
  try { return JSON.parse(raw) as BucketState; } catch { return undefined; }
}
async function saveBucket(kv: KVNamespace | undefined, key: string, bucket: BucketState, ttlSeconds: number) {
  if (!kv) { memoryBuckets[key] = bucket; return; }
  await kv.put(`rl:${key}`, JSON.stringify(bucket), { expirationTtl: ttlSeconds });
}

export async function checkRateLimit(kv: KVNamespace | undefined, key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  let bucket = await loadBucket(kv, key);
  if (!bucket || bucket.reset <= now) {
    bucket = { remaining: opts.limit, reset: now + opts.windowMs };
  }
  if (bucket.remaining <= 0) {
    return { allowed: false, remaining: 0, reset: bucket.reset };
  }
  bucket.remaining -= 1;
  await saveBucket(kv, key, bucket, Math.ceil((bucket.reset - now)/1000));
  return { allowed: true, remaining: bucket.remaining, reset: bucket.reset };
}
