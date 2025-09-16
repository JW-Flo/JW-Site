import type { APIRoute } from 'astro';
import { json } from '../../../../utils/responses.js';
import { resetIamAutomationDemoData } from '../../../../atlasit/ui/api/iam-automation';

async function clearOnboardingKv(env: any) {
  if (!env?.KV || typeof env.KV.list !== 'function' || typeof env.KV.delete !== 'function') {
    return { cleared: 0, supported: false };
  }

  let cleared = 0;
  try {
    const list = await env.KV.list({ prefix: 'onboarding:' });
    if (list?.keys) {
      for (const key of list.keys) {
        await env.KV.delete(key.name);
        cleared += 1;
      }
    }
  } catch (error) {
    return { cleared, supported: true, error: (error as Error).message };
  }

  return { cleared, supported: true };
}

export const POST: APIRoute = async ({ locals }) => {
  const env: any = (locals as any)?.runtime?.env || (globalThis as any)?.process?.env || {};

  resetIamAutomationDemoData();
  const kvResult = await clearOnboardingKv(env);

  return json({
    success: true,
    reset: {
      iamAutomation: true,
      onboardingKv: kvResult,
    },
    timestamp: new Date().toISOString(),
  });
};

export const GET: APIRoute = async () => json({ error: 'Method not allowed' }, { status: 405 });
