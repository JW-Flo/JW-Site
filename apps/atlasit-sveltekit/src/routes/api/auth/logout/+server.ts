import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionStore } from '$lib/server/sessionStore';

export const POST: RequestHandler = async ({ request, platform }) => {
  const sessionId = request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('atlasit_session='))?.split('=')[1];
  if (sessionId) {
    try { await sessionStore(platform!.env as any).revoke(sessionId); } catch {}
  }
  const siteUrl = platform?.env?.SITE_URL as string | undefined;
  const domain = siteUrl ? new URL(siteUrl).host : undefined;
  const domainAttr = domain ? `; Domain=${domain}` : '';
  return json({ ok: true }, {
    headers: [
      ['Set-Cookie', `atlasit_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0${domainAttr}`],
      ['Set-Cookie', `atlasit_refresh=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0${domainAttr}`],
      ['Cache-Control', 'no-store, max-age=0'],
      ['Pragma', 'no-cache'],
    ],
  });
};
