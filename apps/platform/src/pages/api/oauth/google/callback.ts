import type { APIRoute } from 'astro';
import { storeAnalyticsEvent } from '../../../../utils/analytics-server';

const STATE_COOKIE = 'atlasit_oauth_google_state';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  const state = url.searchParams.get('state');
  const cookies = parseCookies(request.headers.get('cookie'));
  const expectedState = cookies[STATE_COOKIE];
  const clientAddress = request.headers.get('x-forwarded-for') || null;
  const redirectBase = '/marketplace/google';
  const correlationId = crypto.randomUUID();

  if (error || errorDescription) {
    const userMessage = buildGoogleErrorMessage(error, errorDescription, correlationId);
    await safeAnalytics({
      timestamp: new Date().toISOString(),
      event: 'google_oauth_callback_failed',
      page: redirectBase,
      details: {
        error,
        errorDescription,
        correlationId,
        clientAddress,
      },
    });
    return redirectWithMessage(redirectBase, 'error', userMessage, true);
  }

  if (!state || !expectedState || state !== expectedState) {
    await safeAnalytics({
      timestamp: new Date().toISOString(),
      event: 'google_oauth_callback_state_mismatch',
      page: redirectBase,
      details: {
        clientAddress,
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
      event: 'google_oauth_callback_missing_code',
      page: redirectBase,
      details: { clientAddress, correlationId },
    });
    return redirectWithMessage(redirectBase, 'error', `Authorization code was not returned by Google. Reference: ${correlationId}`, true);
  }

  await safeAnalytics({
    timestamp: new Date().toISOString(),
    event: 'google_oauth_callback_success',
    page: redirectBase,
    details: {
      clientAddress,
      state,
      correlationId,
      // TODO: Exchange code for tokens and persist credentials securely.
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
 * Convert provider error codes into user-facing copy that keeps sensitive values hidden
 * while surfacing a reference ID users can share with support.
 */
function buildGoogleErrorMessage(error: string | null, errorDescription: string | null, ref: string) {
  const normalizedError = (error || '').toLowerCase();
  if (normalizedError === 'access_denied') {
    return `Google Workspace access was denied. Please approve the requested scopes or try again. Reference: ${ref}`;
  }
  if (normalizedError === 'temporarily_unavailable') {
    return `Google Workspace temporarily reported an outage. Retry the authorization shortly. Reference: ${ref}`;
  }
  if (normalizedError === 'server_error') {
    return `Google Workspace encountered an internal error. Try again in a few minutes. Reference: ${ref}`;
  }
  if (normalizedError === 'invalid_scope') {
    return `The authorization scopes were rejected by Google. Contact AtlasIT support with reference ${ref}.`;
  }
  if (errorDescription) {
    return `${errorDescription} (ref: ${ref})`;
  }
  if (error) {
    return `Google Workspace returned error "${error}". Include reference ${ref} if you contact support.`;
  }
  return `Google Workspace authorization failed. Please try again and reference ${ref} if the issue persists.`;
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
 * Guard analytics mutations so callback UX is resilient even if logging fails.
 */
async function safeAnalytics(event: Parameters<typeof storeAnalyticsEvent>[0]) {
  try {
    await storeAnalyticsEvent(event);
  } catch (error) {
    console.error('[oauth:google:callback]', 'analytics_error', error);
  }
}
