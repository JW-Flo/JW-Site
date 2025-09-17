import type { APIRoute } from 'astro';
import { storeAnalyticsEvent } from '../../../../utils/analytics-server';

export const GET: APIRoute = async ({ locals, request }) => {
  const env = locals?.runtime?.env ?? {};
  const clientId = env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = env.GOOGLE_OAUTH_REDIRECT_URL || process.env.GOOGLE_OAUTH_REDIRECT_URL;
  const scope = env.GOOGLE_OAUTH_SCOPE || 'https://www.googleapis.com/auth/admin.directory.user';

  if (!clientId || !redirectUri) {
    await safeAnalytics({
      timestamp: new Date().toISOString(),
      event: 'google_oauth_start_failed',
      page: '/marketplace/google',
      details: {
        reason: 'missing_configuration',
        clientAddress: request.headers.get('x-forwarded-for') || null,
      },
    });

    return new Response(
      JSON.stringify({
        error: 'Google Workspace integration is not configured yet.',
        instructions: 'Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_REDIRECT_URL to enable production OAuth.',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
        },
      },
    );
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    scope,
    state,
    prompt: 'consent',
    include_granted_scopes: 'true',
  });

  const cookie = `atlasit_oauth_google_state=${state}; Path=/; HttpOnly; Secure; Max-Age=300; SameSite=Lax`;

  await safeAnalytics({
    timestamp: new Date().toISOString(),
    event: 'google_oauth_start',
    page: '/marketplace/google',
    details: {
      state,
      clientAddress: request.headers.get('x-forwarded-for') || null,
    },
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return new Response(JSON.stringify({ url, state }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
      'Cache-Control': 'no-store, max-age=0',
      Pragma: 'no-cache',
    },
  });
};

async function safeAnalytics(event: Parameters<typeof storeAnalyticsEvent>[0]) {
  try {
    await storeAnalyticsEvent(event);
  } catch (error) {
    console.error('[oauth:google]', 'analytics_error', error);
  }
}
