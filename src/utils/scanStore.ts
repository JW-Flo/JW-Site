/**
 * Ephemeral per-session scan storage with minimal metadata persistence.
 * Tied to consent: Only persists minimal metadata if analytics or research consent granted.
 */

export interface ScanSummaryMeta {
  url: string;
  timestamp: number;
  mode: string;
  findings: number;
  critical: number;
  score?: number;
  country?: string;
  uaHash?: string;
}

interface SessionRecord {
  id: string;
  created: number;
  scans: ScanSummaryMeta[];
  last: number;
  role?: 'sa'; // super-admin role flag when elevated
}

const sessions = new Map<string, SessionRecord>();

const SESSION_COOKIE = 'escan_s';
const SESSION_TTL_MS = 1000 * 60 * 60; // 1 hour
const MAX_SCANS_STORED = 5;

function randomId(len = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}

async function hmacSign(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function verifySignature(secret: string, value: string, sig: string): Promise<boolean> {
  const expected = await hmacSign(secret, value);
  if (expected.length !== sig.length) return false;
  let res = 0;
  for (let i=0;i<expected.length;i++) res |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return res === 0;
}

export interface ConsentState { analytics: boolean; research: boolean; }

function parseConsentCookie(cookieHeader: string | null): ConsentState {
  if (!cookieHeader) return { analytics: false, research: false };
  const parts = cookieHeader.split(/;\s*/);
  const pref = parts.find(p => p.startsWith('cc_prefs='));
  if (!pref) return { analytics: false, research: false };
  try {
    const val = decodeURIComponent(pref.split('=')[1]);
    const obj: ConsentState = { analytics: false, research: false };
    val.split('|').forEach(pair => {
      const [k,v] = pair.split(':');
      if (k === 'a') obj.analytics = v === '1';
      if (k === 'r') obj.research = v === '1';
    });
    return obj;
  } catch { return { analytics: false, research: false }; }
}

export class ScanStore {
  private readonly signingKey: string;
  private readonly roleSigningKey: string;
  private readonly kv: KVNamespace | undefined;
  constructor(env: any) {
    this.signingKey = env.SESSION_SIGNING_KEY || 'dev-signing-key';
    this.roleSigningKey = env.ROLE_SIGNING_KEY || this.signingKey;
    this.kv = env.SCANNER_META; // optional
  }
  private async parseRole(cookie: string): Promise<'sa' | undefined> {
    const roleMatch = /escan_role=([^;]+)/.exec(cookie);
    if (!roleMatch) return undefined;
    try {
      const raw = decodeURIComponent(roleMatch[1]);
      const [roleVal, expStr, sig] = raw.split('.');
      if (roleVal !== 'sa' || !expStr || !sig) return undefined;
      const base = roleVal + '.' + expStr;
      if (!await verifySignature(this.roleSigningKey, base, sig)) return undefined;
      const exp = parseInt(expStr, 10);
      if (isNaN(exp) || Date.now() >= exp) return undefined;
      return 'sa';
    } catch { return undefined; }
  }
  async getOrCreateSession(request: Request): Promise<{ record: SessionRecord; cookieHeader?: string; consent: ConsentState; }> {
    const cookie = request.headers.get('Cookie') || '';
    const consent = parseConsentCookie(cookie);
    const role = await this.parseRole(cookie);
    const match = /escan_s=([^;]+)/.exec(cookie);
    if (match) {
      const raw = decodeURIComponent(match[1]);
      const [id, sig] = raw.split('.');
      if (id && sig && await verifySignature(this.signingKey, id, sig)) {
        const rec = sessions.get(id);
        if (rec && (Date.now() - rec.last) < SESSION_TTL_MS) {
          if (role && !rec.role) rec.role = role; // hydrate from role cookie
          return { record: rec, consent };
        }
      }
    }
    const id = randomId();
    const sig = await hmacSign(this.signingKey, id);
    const rec: SessionRecord = { id, created: Date.now(), last: Date.now(), scans: [] };
    if (role) rec.role = role;
    sessions.set(id, rec);
    const newCookies: string[] = [];
    newCookies.push(`${SESSION_COOKIE}=${encodeURIComponent(id+'.'+sig)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${60*60}`);
    if (role) {
      const exp = Date.now() + 1000*60*60; // 1h
      const base = `sa.${exp}`;
      const rsig = await hmacSign(this.roleSigningKey, base);
      newCookies.push(`escan_role=${encodeURIComponent(base+'.'+rsig)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${60*60}`);
    }
    const cookieHeader = newCookies.join(', ');
    return { record: rec, cookieHeader, consent };
  }
  elevateToSuperAdmin(record: SessionRecord) {
    record.role = 'sa';
    record.last = Date.now();
  }
  async addScan(record: SessionRecord, meta: ScanSummaryMeta, consent: ConsentState) {
    record.last = Date.now();
    record.scans.push(meta);
    if (record.scans.length > MAX_SCANS_STORED) record.scans.shift();
    if (this.kv && (consent.analytics || consent.research)) {
      const key = `s:${record.id}:${meta.timestamp}`;
      const packet: any = { u: meta.url, t: meta.timestamp, m: meta.mode, f: meta.findings, c: meta.critical, s: meta.score };
      if (consent.research) {
        if (meta.country) packet.co = meta.country;
        if (meta.uaHash) packet.ua = meta.uaHash;
      }
      try { await this.kv.put(key, JSON.stringify(packet), { expirationTtl: 60*60*24 }); } catch(e) { console.warn('KV put failed', e); }
    }
  }
}

export function hashUA(ua: string): string { let h = 0; for (let i=0;i<ua.length;i++) { h = (h*31 + ua.charCodeAt(i)) >>> 0; } return h.toString(16); }
export function sanitizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    let path = u.pathname;
    if (path.length > 60) path = path.slice(0,57) + '...';
    return u.origin + path;
  } catch {
    return raw.slice(0,80);
  }
}

setInterval(() => { const now = Date.now(); for (const [id, rec] of sessions.entries()) { if ((now - rec.last) > SESSION_TTL_MS) sessions.delete(id); } }, 60_000);
