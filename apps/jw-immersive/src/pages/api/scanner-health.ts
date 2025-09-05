import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  const started = Date.now();
  let env: any = {};
  try { env = (locals as any)?.runtime?.env || {}; } catch {}
  const exposed = {
    SUPER_ADMIN_KEY_PRESENT: !!env.SUPER_ADMIN_KEY || !!env.SUPER_ADMIN_KEY_DEV,
    NVD_API_KEY_PRESENT: !!env.NVD_API_KEY,
    OPENCVE_ENRICH: (env.OPENCVE_ENRICH || '').toString(),
    VIRUSTOTAL_API_KEY_PRESENT: !!env.VIRUSTOTAL_API_KEY,
    SESSION_SIGNING_KEY_PRESENT: !!env.SESSION_SIGNING_KEY,
    KV_BOUND: !!env.SCANNER_META,
  };
  return new Response(JSON.stringify({ ok: true, ts: started, env: exposed }), { headers: { 'Content-Type': 'application/json' } });
};

export const prerender = false;
