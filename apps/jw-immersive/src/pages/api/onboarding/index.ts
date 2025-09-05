import type { APIRoute } from 'astro';
import { json } from '../../../utils/responses.js';

export const POST: APIRoute = async ({ request, locals }) => {
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

    // Parse request body
    const body = await request.json() as any;
    const { tenantId, name, industry } = body;

    // Validate required fields
    if (!tenantId || !name || !industry) {
      return json({
        error: 'Missing required fields',
        code: 'ONB-001',
        details: 'tenantId, name, and industry are required',
        requestId: crypto.randomUUID(),
        actor
      }, { status: 400 });
    }

    // Validate industry
    const allowedIndustries = ['technology', 'healthcare', 'finance', 'retail', 'manufacturing', 'education'];
    if (!allowedIndustries.includes(industry.toLowerCase())) {
      return json({
        error: 'Unsupported industry',
        code: 'ONB-002',
        details: { allowed: allowedIndustries },
        requestId: crypto.randomUUID(),
        actor
      }, { status: 400 });
    }

    // Check if onboarding already exists (idempotency)
    const existingKey = `onboarding:${tenantId}`;
    const existing = await env.KV?.get(existingKey);

    if (existing) {
      const config = JSON.parse(existing);
      return json({
        ...config,
        idempotent: true,
        requestId: crypto.randomUUID(),
        actor
      }, { status: 200 });
    }

    // Generate onboarding configuration
    const config = {
      tenantId,
      name,
      industry: industry.toLowerCase(),
      status: 'configured',
      template: generateTemplate(industry.toLowerCase()),
      created_at: new Date().toISOString()
    };

    // Store in KV
    await env.KV?.put(existingKey, JSON.stringify(config));

    // Log audit event (simplified for now)
    console.log('Audit event: onboarding.completed', {
      tenantId,
      industry: industry.toLowerCase(),
      actor
    });

    return json({
      ...config,
      requestId: crypto.randomUUID(),
      actor
    }, { status: 201 });

  } catch (error) {
    console.error('Onboarding creation error:', error);
    return json({
      error: 'Unknown error',
      code: 'ONB-999',
      requestId: crypto.randomUUID()
    }, { status: 500 });
  }
};

function generateTemplate(industry: string) {
  const baseTemplate = {
    security: {
      'multi-factor-auth': true,
      'password-policy': 'strong',
      'session-timeout': '30m'
    },
    compliance: {
      'data-retention': '7years',
      'audit-logs': true
    }
  };

  // Industry-specific customizations
  switch (industry) {
    case 'healthcare':
      return {
        ...baseTemplate,
        compliance: {
          ...baseTemplate.compliance,
          'hipaa-compliant': true,
          'phi-encryption': true
        }
      };
    case 'finance':
      return {
        ...baseTemplate,
        security: {
          ...baseTemplate.security,
          'pci-compliant': true,
          'transaction-monitoring': true
        }
      };
    default:
      return baseTemplate;
  }
}
