// D1 binding DB expected; Turnstile secret TURNSTILE_SECRET_KEY as env var.
interface GuestbookEntry { id: number; name: string; message: string; created_at: number; }

async function verifyTurnstile(token: string, secret: string) {
  const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ response: token, secret }),
  });
  const data = await resp.json() as any;
  return data && data.success === true;
}

export const onRequestGet: PagesFunction = async (context) => {
  const { env } = context as any;
  const { results } = await env.DB.prepare('SELECT id, name, message, created_at FROM entries ORDER BY id DESC LIMIT 25').all();
  return new Response(JSON.stringify(results), { headers: { 'content-type': 'application/json' } });
};

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context as any;
  try {
    const body = await request.json();
    const name = (body.name || 'Anon').toString().slice(0, 40);
    const message = (body.message || '').toString().slice(0, 500);
    const token = body.turnstileToken;
    if (!message) return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400 });

    if (!token || !env.TURNSTILE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Missing captcha' }), { status: 400 });
    }
    const ok = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY);
    if (!ok) return new Response(JSON.stringify({ error: 'Bot check failed' }), { status: 403 });

    const now = Date.now();
    await env.DB.prepare('INSERT INTO entries (name, message, created_at) VALUES (?1, ?2, ?3)')
      .bind(name, message, now)
      .run();
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Invalid JSON', detail: e?.message }), { status: 400 });
  }
};
