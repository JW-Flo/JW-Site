import type { APIRoute } from 'astro';
import { storeAnalyticsEvent } from '../../../../utils/analytics-server';

const STATE_COOKIE = 'atlasit_oauth_m365_state';

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const state = url.searchParams.get('state');
  const cookies = parseCookies(request.headers.get('cookie'));
  const expectedState = cookies[STATE_COOKIE];
  const tenantId = locals?.runtime?.env?.M365_OAUTH_TENANT_ID || process.env.M365_OAUTH_TENANT_ID || 'common';
  const clientAddress = request.headers.get('x-forwarded-for') || null;
  const redirectBase = '/marketplace/microsoft365';
  const correlationId = crypto.randomUUID();

  if (error || errorDescription) {
    const userMessage = buildEntraErrorMessage(error, errorDescription, correlationId);
    await safeAnalytics({
      timestamp: new Date().toISOString(),
      event: 'm365_oauth_callback_failed',
      page: redirectBase,
      details: {
        error,
        errorDescription,
        clientAddress,
        tenantId,
        correlationId,
      },
    });
    return redirectWithMessage(redirectBase, 'error', userMessage, true);
  }

  if (!state || !expectedState || state !== expectedState) {
    await safeAnalytics({
      timestamp: new Date().toISOString(),
      event: 'm365_oauth_callback_state_mismatch',
      page: redirectBase,
      details: {
        clientAddress,
        tenantId,
        correlationId,
        providedState: state,
        expectedState,
      },
    });
    return redirectWithMessage(redirectBase, 'error', `OAuth state validation failed. Please try again. Reference: ${correlationId}`, true);
  }

  if (!code) {
    await safeAnalytics({
      timestamp: new Date().toISOString(),
      event: 'm365_oauth_callback_missing_code',
      page: redirectBase,
      details: { clientAddress, tenantId, correlationId },
    });
    return redirectWithMessage(redirectBase, 'error', `Authorization code was not returned by Microsoft. Reference: ${correlationId}`, true);
  }

  await safeAnalytics({
    timestamp: new Date().toISOString(),
    event: 'm365_oauth_callback_success',
    page: redirectBase,
    details: {
      clientAddress,
      tenantId,
      state,
      correlationId,
      // TODO: Exchange authorization code for tokens and persist securely.
    },
  });

  return new Response(null, {
    status: 303,
    headers: {
      Location: `${redirectBase}?oauth=success`,
      'Set-Cookie': `${STATE_COOKIE}=deleted; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
      'Cache-Control': 'no-store, max-age=0',
      Pragma: 'no-cache',
    },
  });
};

/**
 * Provide actionable messaging for Microsoft OAuth callbacks while defending against
 * leaking raw error payloads to the browser.
 */
function buildEntraErrorMessage(error: string | null, errorDescription: string | null, ref: string) {
  const normalizedError = (error || '').toLowerCase();
  if (normalizedError === 'access_denied') {
    return `Microsoft 365 access was denied. Please confirm the requested permissions. Reference: ${ref}`;
  }
  if (normalizedError === 'authorization_pending') {
    return `Authorization is still pending in Microsoft. Complete the consent prompt and retry. Reference: ${ref}`;
  }
  if (normalizedError === 'invalid_client' || normalizedError === 'unauthorized_client') {
    return `Microsoft rejected the application configuration. Contact your AtlasIT administrator with reference ${ref}.`;
  }
  if (normalizedError === 'interaction_required') {
    return `Microsoft requires additional interaction (like MFA). Retry the sign-in flow. Reference: ${ref}`;
  }
  if (normalizedError === 'server_error' || normalizedError === 'temporarily_unavailable') {
    return `Microsoft reported a temporary service issue. Try again shortly. Reference: ${ref}`;
  }
  if (errorDescription) {
    return `${errorDescription} (ref: ${ref})`;
  }
  if (error) {
    return `Microsoft returned error "${error}". Include reference ${ref} if you contact support.`;
  }
  return `Microsoft 365 authorization failed. Please try again and provide reference ${ref} if the issue continues.`;
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const [key, ...rest] = part.trim().split('=');
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

function redirectWithMessage(base: string, status: 'success' | 'error', message: string, clearState = false) {
  const headers: Record<string, string> = {
    Location: `${base}?oauth=${status}&message=${encodeURIComponent(message)}`,
    'Cache-Control': 'no-store, max-age=0',
    Pragma: 'no-cache',
  };
  if (clearState) {
    headers['Set-Cookie'] = `${STATE_COOKIE}=deleted; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
  }
  return new Response(null, { status: 303, headers });
}

/**
 * Protect the callback UX from analytics pipeline issues.
 */
async function safeAnalytics(event: Parameters<typeof storeAnalyticsEvent>[0]) {
  try {
    await storeAnalyticsEvent(event);
  } catch (error) {
    console.error('[oauth:m365:callback]', 'analytics_error', error);
  }
}
