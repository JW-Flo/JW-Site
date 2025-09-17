import type { APIRoute } from 'astro';
import { storeAnalyticsEvent } from '../../../../utils/analytics-server';

export const GET: APIRoute = async ({ locals, request }) => {
  const env = locals?.runtime?.env ?? {};
  const clientId = env.M365_OAUTH_CLIENT_ID || process.env.M365_OAUTH_CLIENT_ID;
  const tenantId = env.M365_OAUTH_TENANT_ID || process.env.M365_OAUTH_TENANT_ID || 'common';
  const redirectUri = env.M365_OAUTH_REDIRECT_URL || process.env.M365_OAUTH_REDIRECT_URL;
  const scope = env.M365_OAUTH_SCOPE || 'https://graph.microsoft.com/.default offline_access';

  if (!clientId || !redirectUri) {
    await safeAnalytics({
      timestamp: new Date().toISOString(),
      event: 'm365_oauth_start_failed',
      page: '/marketplace/microsoft365',
      details: {
        reason: 'missing_configuration',
        clientAddress: request.headers.get('x-forwarded-for') || null,
      },
    });

    return new Response(
      JSON.stringify({
        error: 'Microsoft 365 integration is not configured yet.',
        instructions: 'Set M365_OAUTH_CLIENT_ID and M365_OAUTH_REDIRECT_URL to enable production OAuth.',
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
    response_type: 'code',
    redirect_uri: redirectUri,
    scope,
    state,
    prompt: 'consent',
  });

  const cookie = `atlasit_oauth_m365_state=${state}; Path=/; HttpOnly; Secure; Max-Age=300; SameSite=Lax`;

  await safeAnalytics({
    timestamp: new Date().toISOString(),
    event: 'm365_oauth_start',
    page: '/marketplace/microsoft365',
    details: {
      state,
      tenantId,
      clientAddress: request.headers.get('x-forwarded-for') || null,
    },
  });

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
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
    console.error('[oauth:m365]', 'analytics_error', error);
  }
}
