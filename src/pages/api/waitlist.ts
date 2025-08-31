import type { APIRoute } from 'astro';
import { json, methodNotAllowed, badRequest, forbidden } from '../../../utils/responses.ts';
import { buildIpPrivacyRecord } from '../../utils/ipPrivacy.ts';

export const prerender = false;

function validateEmail(email: string): boolean {
  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
}

async function getCount(DB: any) {
  try {
    const stmt = DB.prepare('SELECT COUNT(*) as count FROM waitlist_signups');
    const row = await stmt.first();
    return (row && (row.count || row.COUNT || row.cnt)) ?? 0;
  } catch (e) {
    console.warn('waitlist count failed', e);
    return 0;
  }
}

export const GET: APIRoute = async ({ request }) => {
  if (process.env.FEATURE_WAITLIST !== 'true') return forbidden('Waitlist disabled');
  const DB = (globalThis as any).DB || (request as any).locals?.runtime?.env?.DB || (request as any).locals?.DB || (request as any).locals?.env?.DB;
  if (!DB) return json({ ok: true, count: 0 });
  const count = await getCount(DB);
  return json({ ok: true, count });
};

export const POST: APIRoute = async ({ request }) => {
  if (process.env.FEATURE_WAITLIST !== 'true') return forbidden('Waitlist disabled');
  let body: any;
  try {
    body = await request.json();
  } catch {
    return badRequest('Invalid JSON');
  }
  const email = (body.email || '').trim();
  if (!validateEmail(email)) return badRequest('Invalid email');
  const source = typeof body.source === 'string' ? body.source.slice(0,100) : null;
  const marketing = body.marketing === true ? 1 : 0;

  const DB = (globalThis as any).DB || (request as any).locals?.runtime?.env?.DB || (request as any).locals?.DB || (request as any).locals?.env?.DB;
  let duplicate = false;
  let ipHash: string | undefined; let hashAlgo: string | undefined;
  if (DB) {
    try {
      // attempt privacy hash (best-effort)
      try {
        const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || request.headers.get('X-Real-IP') || '0.0.0.0';
        const secret = process.env.GEO_HASH_KEY || 'dev-secret';
        const priv = await buildIpPrivacyRecord(clientIP, request, secret);
        ipHash = priv.ipHash; hashAlgo = priv.hashAlgo;
      } catch {}

      const stmt = DB.prepare(`INSERT INTO waitlist_signups (email, source, marketing_consent, ip_hash, hash_algo)
        VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(email) DO NOTHING`);
      await stmt.bind(email, source, marketing, ipHash, hashAlgo).run();
      // If already existed mark duplicate by counting existing entries for email (cheap)
      const check = await DB.prepare('SELECT 1 as ok FROM waitlist_signups WHERE email = ?1').bind(email).first();
      duplicate = !!check && marketing === 0; // approximate duplicate flag
    } catch (e) {
      console.warn('waitlist insert failed', e);
    }
  }
  const count = DB ? await getCount(DB) : 0;
  return json({ ok: true, duplicate, count });
};

export const ALL: APIRoute = async ({ request }) => methodNotAllowed(request.method, ['GET','POST']);
