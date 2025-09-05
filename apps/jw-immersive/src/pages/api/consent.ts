import type { APIRoute } from 'astro';
import { json, methodNotAllowed } from '../../utils/responses.js';
import { applyRateLimit, rateLimitHeaders } from '../../utils/applyRateLimit.js';

export const prerender = false;

interface ConsentPayload {
  sessionId: string;
  essential: boolean;
  analytics: boolean;
  research: boolean;
  marketing: boolean;
  timestamp: number; // ms epoch
  ipHash?: string;
  hashAlgo?: string;
  geo?: Record<string, any>;
  version?: string;
}

function validatePayload(body: any): { ok: true; data: ConsentPayload } | { ok: false; res: Response } {
  if (!body?.sessionId) {
    return { ok: false, res: json({ ok: false, error: 'missing-sessionId' }, { status: 400 }) };
  }
  const { sessionId, essential, analytics, research, marketing, timestamp } = body as ConsentPayload;
  if (typeof sessionId !== 'string' || sessionId.length > 64) {
    return { ok: false, res: json({ ok: false, error: 'invalid-sessionId' }, { status: 400 }) };
  }
  if (![essential, analytics, research, marketing].every(v => typeof v === 'boolean')) {
    return { ok: false, res: json({ ok: false, error: 'invalid-flags' }, { status: 400 }) };
  }
  if (typeof timestamp !== 'number') {
    return { ok: false, res: json({ ok: false, error: 'invalid-timestamp' }, { status: 400 }) };
  }
  return { ok: true, data: body };
}

async function insertConsent(db: any, body: ConsentPayload) {
  if (!db || typeof db.prepare !== 'function') return;
  const { sessionId, essential, analytics, research, marketing } = body;
  const stmt = db.prepare(`INSERT INTO consent_events (
    session_id, created_at, ip_hash, hash_algo, country, city, region, colo,
    essential, analytics, research, marketing, version
  ) VALUES (?1, datetime('now'), ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`);
  await stmt.bind(
    sessionId,
    body.ipHash || null,
    body.hashAlgo || null,
    body.geo?.country || null,
    body.geo?.city || null,
    body.geo?.region || null,
    body.geo?.colo || null,
    essential ? 1 : 0,
    analytics ? 1 : 0,
    research ? 1 : 0,
    marketing ? 1 : 0,
    body.version || 'v1'
  ).run();
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const featureEnabled = process.env.FEATURE_CONSENT_D1 === 'true';
  if (!featureEnabled) {
    return json({ ok: false, reason: 'feature-disabled' }, { status: 403 });
  }
  const env: any = (locals as any)?.runtime?.env || (globalThis as any)?.process?.env || {};
  const rl = await applyRateLimit({ env, key: `consent:${clientAddress || 'unknown'}`, max: 10, windowMs: 5*60_000 });
  if (!rl.allowed) {
    return json({ ok: false, error: 'rate-limited' }, { status: 429, headers: rateLimitHeaders(rl) });
  }
  let body: ConsentPayload | undefined;
  try {
    body = await request.json();
  } catch (e: any) {
    const _errMsg = e?.message; // reference variable to satisfy linter
    return json({ ok: false, error: 'invalid-json' }, { status: 400 });
  }
  const validated = validatePayload(body);
  if (!validated.ok) return validated.res;
  const { data } = validated;
  try {
    const db: any = (locals as any)?.runtime?.env?.DB || (globalThis as any).DB;
    await insertConsent(db, data);
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: 'storage-failure', detail: e?.message });
  }
};

export const ALL: APIRoute = async ({ request }) => methodNotAllowed(request.method, ['POST']);
