// Scan target validation & safety utilities
// Provides normalization, private network / SSRF safeguards, and classification codes.

export interface ScanValidationResult {
  ok: boolean;
  normalized?: string;
  host?: string;
  code?: string; // reason code when not ok
  reason?: string;
  port?: number | null;
}

const MAX_URL_LENGTH = 2048;
const MAX_HOST_LENGTH = 253;
const DISALLOWED_TLDS = ['local', 'localhost', 'internal', 'intranet', 'home', 'corp'];
const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const STANDARD_PORTS = new Set([80, 443]);

// Regex for IPv4 detection
const ipv4Regex = /^(\d{1,3})(?:\.(\d{1,3})){3}$/;

// Simplistic IPv6 private/loopback/link-local detection
function isPrivateIPv6(host: string): boolean {
  const lower = host.toLowerCase();
  return lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80') || lower.startsWith('::ffff:127.') || lower.startsWith('::ffff:10.') || lower.startsWith('::ffff:192.168.') || lower.startsWith('::ffff:172.');
}

function isIPv4(host: string): boolean { return ipv4Regex.test(host); }

function isPrivateIPv4(host: string): boolean {
  if (!isIPv4(host)) return false;
  const parts = host.split('.').map(n => parseInt(n, 10));
  if (parts.some(p => p > 255)) return true; // treat invalid octet as disallowed
  const [a,b] = parts;
  if (a === 10) return true;
  if (a === 127) return true; // loopback
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true; // link-local
  return false;
}

function hasDisallowedTld(host: string): boolean {
  const last = host.split('.').pop()?.toLowerCase();
  return !!last && DISALLOWED_TLDS.includes(last);
}

export interface ValidateOptions {
  superAdmin?: boolean;
  allowNonStandardPort?: boolean; // internal use
}

export function validateScanTarget(input: string, opts: ValidateOptions = {}): ScanValidationResult {
  if (!input?.trim()) return { ok: false, code: 'MISSING', reason: 'No target provided' };
  let raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw; // default scheme
  if (raw.length > MAX_URL_LENGTH) return { ok: false, code: 'TOO_LONG', reason: 'URL exceeds max length' };
  let url: URL;
  try { url = new URL(raw); } catch { return { ok: false, code: 'INVALID_URL', reason: 'Invalid URL format' }; }
  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) return { ok: false, code: 'DISALLOWED_SCHEME', reason: 'Only http/https allowed' };
  if (!url.hostname) return { ok: false, code: 'MISSING_HOST', reason: 'Missing host' };
  if (url.username || url.password) return { ok: false, code: 'CREDENTIALS_PRESENT', reason: 'Userinfo not allowed' };
  const host = url.hostname;
  if (host.length > MAX_HOST_LENGTH) return { ok: false, code: 'HOST_TOO_LONG', reason: 'Host length exceeds limit' };
  if (host === 'localhost') return { ok: false, code: 'LOCALHOST', reason: 'Localhost disallowed' };
  if (hasDisallowedTld(host)) return { ok: false, code: 'DISALLOWED_TLD', reason: 'Disallowed TLD' };
  if (isPrivateIPv4(host) || isPrivateIPv6(host)) return { ok: false, code: 'PRIVATE_ADDRESS', reason: 'Private / internal address disallowed' };
  // Basic metadata service guard
  if (host === '169.254.169.254') return { ok: false, code: 'METADATA_ADDRESS', reason: 'Metadata IP disallowed' };
  const port = url.port ? parseInt(url.port, 10) : null;
  if (port && !STANDARD_PORTS.has(port) && !(opts.superAdmin || opts.allowNonStandardPort)) {
    return { ok: false, code: 'DISALLOWED_PORT', reason: 'Port not permitted' };
  }
  // Strip query + fragment for normalization
  url.hash = '';
  url.search = '';
  const normalized = url.toString();
  return { ok: true, normalized, host, port };
}

export function reasonMessage(code?: string): string | undefined {
  const map: Record<string,string> = {
    MISSING: 'Target required',
    TOO_LONG: 'URL too long',
    INVALID_URL: 'Invalid URL',
    DISALLOWED_SCHEME: 'Only http/https supported',
    MISSING_HOST: 'Host missing',
    CREDENTIALS_PRESENT: 'Embedded credentials not allowed',
    HOST_TOO_LONG: 'Host too long',
    LOCALHOST: 'Localhost not permitted',
    DISALLOWED_TLD: 'Domain TLD not allowed',
    PRIVATE_ADDRESS: 'Private/internal address blocked',
    METADATA_ADDRESS: 'Metadata IP blocked',
    DISALLOWED_PORT: 'Port not allowed'
  };
  return code ? map[code] : undefined;
}
