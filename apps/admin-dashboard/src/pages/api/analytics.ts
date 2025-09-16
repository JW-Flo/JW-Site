// API route for admin dashboard analytics widgets

import type { APIRoute } from 'astro';


export const GET: APIRoute = async ({ request, locals }) => {
  // Get tenantId from query params
  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenantId');

  // Access D1 binding (Cloudflare Pages/Workers)
  // For Astro on Cloudflare, D1 binding is available via request.env.D1
  // For local dev, fallback to globalThis.D1
  const db = (request as any).env?.D1 || (globalThis as any).D1;
  if (!db) {
    return new Response(JSON.stringify({ error: 'D1 database not available', events: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build query
  let sql = 'SELECT * FROM analytics_events';
  const params: any[] = [];
  if (tenantId) {
    sql += ' WHERE user = ?';
    params.push(tenantId);
  }
  sql += ' ORDER BY timestamp DESC LIMIT 100';

  let events: any[] = [];
  try {
    const result = await db.prepare(sql).bind(...params).all();
    events = result.results || [];
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), events: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ events }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
