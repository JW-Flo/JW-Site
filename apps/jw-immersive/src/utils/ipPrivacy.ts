// Utilities for privacy-preserving IP handling & geo classification
// Hashing: HMAC-SHA-256 with secret salt, truncate for minimal storage.

export interface IpPrivacyOptions {
  secret: string;        // HMAC secret
  truncate?: number;     // hex chars to keep (default 16 = 64 bits)
}

export interface GeoInfo {
  country?: string;
  city?: string;
  region?: string; // ISO subdivision
  colo?: string;   // Cloudflare colo code
}

export interface HashedIpResult {
  hash: string;     // truncated hash
  fullHash: string; // full hex hash (avoid persisting long-term)
  algo: string;     // algorithm metadata
}

export async function hashIp(ip: string, opts: IpPrivacyOptions): Promise<HashedIpResult> {
  const { secret, truncate = 16 } = opts;
  const enc = new TextEncoder();
  if (!isCryptoAvailable()) {
    // Fallback: simple hash (NOT CRYPTOGRAPHIC) - for local tests only
    const simple = Array.from(enc.encode(ip + secret)).reduce((a, b) => (a + b) % 0xffffffff, 0);
    const fullHex = simple.toString(16).padStart(8, '0');
    return { hash: fullHex.slice(0, truncate), fullHash: fullHex, algo: `simple:${truncate}` };
  }
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, enc.encode(ip));
  const bytes = new Uint8Array(digest);
  const fullHex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return {
    hash: fullHex.slice(0, truncate),
    fullHash: fullHex,
    algo: `hmac-sha256:${truncate}`
  };
}

export function extractGeo(request: Request): GeoInfo {
  const headers = request.headers;
  return {
    country: headers.get('CF-IPCountry') || undefined,
    city: headers.get('CF-IPCity') || undefined,
    region: headers.get('CF-IPRegion') || undefined,
    colo: headers.get('CF-RAY')?.split('-').pop() || undefined,
  };
}

export async function buildIpPrivacyRecord(ip: string, request: Request, secret: string) {
  const [hashResult, geo] = await Promise.all([
    hashIp(ip, { secret }),
    Promise.resolve(extractGeo(request))
  ]);
  return { ipHash: hashResult.hash, hashAlgo: hashResult.algo, geo };
}

export function isCryptoAvailable() {
  return typeof crypto !== 'undefined' && !!crypto.subtle;
}
