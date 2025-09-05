import type { APIRoute } from 'astro';
import { json } from '../../../utils/responses.js';

export const prerender = false;

// Aggregate consent stats (secured). Uses X-Admin-Key header.
export const GET: APIRoute = async ({ request, locals }) => {
  const supplied = request.headers.get('x-admin-key') || request.headers.get('X-Admin-Key');
  const expected = process.env.CONSENT_ADMIN_KEY;
  if (!expected || supplied !== expected) {
    return new Response('Not found', { status: 404 });
  }
  const db: any = (locals as any)?.runtime?.env?.DB || (globalThis as any).DB;
  if (!db || typeof db.prepare !== 'function') {
    return json({ ok: false, error: 'no-db' }, { status: 500 });
  }
  try {
    const totals = await db.prepare(`SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN analytics=1 THEN 1 ELSE 0 END) as analytics_on,
      SUM(CASE WHEN research=1 THEN 1 ELSE 0 END) as research_on,
      SUM(CASE WHEN marketing=1 THEN 1 ELSE 0 END) as marketing_on
    FROM consent_events`).first();
    const recent = await db.prepare(`SELECT session_id, ip_hash, country, created_at, analytics, research, marketing
      FROM consent_events ORDER BY created_at DESC LIMIT 25`).all();
    return json({ ok: true, totals, recent: recent.results });
  } catch (e: any) {
    return json({ ok: false, error: 'query-failed', detail: e?.message }, { status: 500 });
  }
};
