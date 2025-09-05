import type { APIRoute } from 'astro';
import { json } from '../../../utils/responses.js';

export const GET: APIRoute = async ({ request, locals, params }) => {
  const env: any = (locals as any)?.runtime?.env || (globalThis as any)?.process?.env || {};

  try {
    // Validate API key if configured
    const apiKey = request.headers.get('x-api-key');
    let actor = 'anonymous';

    if (env.API_ALLOWED_KEYS) {
      const allowedKeys = env.API_ALLOWED_KEYS.split(',');
      if (!apiKey || !allowedKeys.includes(apiKey)) {
        return json({
          error: 'Unauthorized',
          code: 'AUTH-001',
          requestId: crypto.randomUUID()
        }, { status: 401 });
      }
      actor = apiKey;
    }

    const tenantId = params.tenantId;

    if (!tenantId) {
      return json({
        error: 'Tenant ID required',
        code: 'ONB-005',
        requestId: crypto.randomUUID(),
        actor
      }, { status: 400 });
    }

    // Retrieve onboarding state from KV
    const key = `onboarding:${tenantId}`;
    const data = await env.KV?.get(key);

    if (!data) {
      return json({
        error: 'Onboarding not found',
        code: 'ONB-006',
        requestId: crypto.randomUUID(),
        actor
      }, { status: 404 });
    }

    const onboardingState = JSON.parse(data);

    return json({
      ...onboardingState,
      requestId: crypto.randomUUID(),
      actor
    }, { status: 200 });

  } catch (error) {
    console.error('Onboarding status retrieval error:', error);
    return json({
      error: 'Unknown error',
      code: 'ONB-999',
      requestId: crypto.randomUUID()
    }, { status: 500 });
  }
};
