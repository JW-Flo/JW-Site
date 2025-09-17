import type { APIRoute, APIContext } from 'astro';
import { z } from 'zod';
import { storeAnalyticsEvent } from '../../utils/analytics-server';

export const prerender = false;

const onboardingSchema = z.object({
  tenantId: z
    .string()
    .min(3, 'Tenant ID must be at least 3 characters long.')
    .max(120, 'Tenant ID is too long.')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Use only letters, numbers, dashes, and underscores.'),
  name: z.string().min(2, 'Company name is required.').max(160),
  industry: z.string().min(2, 'Select an industry.'),
  demoUserId: z.string().optional(),
  persona: z.string().optional(),
});

const industryDefaults: Record<string, { apps: string[]; compliance: string[] }> = {
  technology: {
    apps: ['Slack', 'Office 365', 'Okta', 'VPN Access', 'GitHub', 'JIRA', 'Confluence', 'AWS Console'],
    compliance: ['SOC 2', 'ISO 27001'],
  },
  healthcare: {
    apps: ['Slack', 'Office 365', 'Okta', 'VPN Access', 'Epic', 'Cerner', 'Medical Billing'],
    compliance: ['HIPAA', 'HITRUST', 'SOC 2'],
  },
  finance: {
    apps: ['Slack', 'Office 365', 'Okta', 'VPN Access', 'QuickBooks', 'Bloomberg Terminal', 'Financial Planning'],
    compliance: ['SOX', 'PCI DSS', 'GLBA'],
  },
  manufacturing: {
    apps: ['Slack', 'Office 365', 'Okta', 'VPN Access', 'SAP', 'MES System', 'Quality Control'],
    compliance: ['ISO 27001', 'SOC 2'],
  },
  retail: {
    apps: ['Slack', 'Office 365', 'Okta', 'VPN Access', 'POS System', 'E-commerce Platform', 'Customer Management'],
    compliance: ['PCI DSS', 'SOC 2'],
  },
  education: {
    apps: ['Slack', 'Office 365', 'Okta', 'VPN Access', 'LMS', 'Student Information System', 'Research Tools'],
    compliance: ['FERPA', 'SOC 2'],
  },
};

function getDefaultsForIndustry(industry: string) {
  return industryDefaults[industry.toLowerCase()] ?? industryDefaults.technology;
}

function generateIAMPolicies(industry: string) {
  return [
    {
      name: `${industry}-developer-policy`,
      description: `Standard developer access for ${industry} industry`,
      permissions: ['s3:GetObject', 's3:PutObject', 'ec2:DescribeInstances', 'logs:CreateLogGroup'],
    },
    {
      name: `${industry}-admin-policy`,
      description: `Administrative access for ${industry} industry`,
      permissions: ['*'],
    },
  ];
}

function generateOktaGroups(industry: string) {
  return [
    `${industry}-developers`,
    `${industry}-managers`,
    `${industry}-admins`,
    'all-employees',
    'contractors',
  ];
}

export const POST: APIRoute = async (ctx) => {
  const requestId = crypto.randomUUID();
  const clientAddress = getSafeClientAddress(ctx);

  let payload: unknown;
  try {
    payload = await ctx.request.json();
  } catch (error) {
    logError('onboarding:invalid_json', { error, requestId, clientAddress });
    return errorResponse('Invalid JSON payload.', 'INVALID_JSON', 400);
  }

  const parsed = onboardingSchema.safeParse(payload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const message = firstIssue?.message ?? 'Invalid onboarding request.';
    logError('onboarding:validation_failed', { requestId, clientAddress, errors: parsed.error.issues });
    return errorResponse(message, 'INVALID_PAYLOAD', 400);
  }

  const data = parsed.data;
  const defaults = getDefaultsForIndustry(data.industry);

  const onboardingResult = {
    success: true,
    requestId,
    tenantId: data.tenantId,
    companyName: data.name,
    industry: data.industry,
    timestamp: new Date().toISOString(),
    configuration: {
      oktaOrg: `${data.tenantId}.atlasit.okta.com`,
      awsAccountId: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      paycomClientId: `paycom_${data.tenantId}`,
      defaultApplications: defaults.apps,
      complianceRequirements: defaults.compliance,
      iamPolicies: generateIAMPolicies(data.industry),
      oktaGroups: generateOktaGroups(data.industry),
    },
    nextSteps: [
      'Complete Okta domain verification',
      'Configure AWS cross-account trust',
      'Install Paycom webhook integration',
      'Test JML workflows',
      'Go live with automated onboarding',
    ],
  };

  try {
    await storeAnalyticsEvent({
      timestamp: onboardingResult.timestamp,
      event: 'onboarding_started',
      page: '/onboarding',
      user: data.tenantId,
      details: {
        requestId,
        clientAddress,
        industry: data.industry,
        demoUserId: data.demoUserId ?? null,
      },
    });
  } catch (error) {
    logError('onboarding:analytics_failed', { error, requestId, clientAddress });
  }

  return new Response(JSON.stringify(onboardingResult), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

function errorResponse(message: string, code: string, status = 400) {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getSafeClientAddress(ctx: APIContext): string {
  try {
    if (typeof ctx.clientAddress !== 'undefined') {
      return ctx.clientAddress || 'unknown';
    }
  } catch (error) {
    const _ = error;
  }
  return 'unknown';
}

function logError(message: string, context: Record<string, any> = {}) {
  try {
    console.error('[onboarding]', JSON.stringify({ message, ...context }));
  } catch (error) {
    console.error('[onboarding]', message, context);
  }
}
