import { Hono } from 'hono';
import { z } from 'zod';
import { AtlasITError, type Industry, type Requirement } from '@atlasit/shared';
import { generateQuestions } from '../services/questionGenerator';
import { createOnboardingTemplate } from '../services/templateGenerator';
import { saveOnboardingState, getOnboardingState, createAuditEvent } from '../services/database';
import type { OnboardingEnv } from '../types';
import { getRequestId, getRequestLogger } from '../utils/logger';

const industries = [
  'technology',
  'healthcare',
  'finance',
  'retail',
  'manufacturing',
  'education',
  'government',
  'other',
] as const satisfies readonly Industry[];

const requirementKeys = [
  'compliance',
  'analytics',
  'automation',
  'security',
  'integration',
  'reporting',
  'monitoring',
  'backup',
] as const satisfies readonly Requirement[];

const onboardingRoutes = new Hono<OnboardingEnv>();

const startOnboardingSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  name: z.string().min(1, 'Tenant name is required'),
  industry: z.enum(industries),
  requirements: z.array(z.enum(requirementKeys)).optional(),
});

const submitOnboardingSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  name: z.string().min(1, 'Tenant name is required'),
  industry: z.enum(industries),
  answers: z.record(z.any()),
  requirements: z.array(z.enum(requirementKeys)).optional(),
});

onboardingRoutes.post('/start', async (c) => {
  const requestId = getRequestId(c);
  const actor = (c.get('actor') as string | undefined) ?? 'anonymous';
  const logger = getRequestLogger(c, { route: 'POST /api/onboarding/start', actor });

  try {
    const body = await c.req.json();
    const validatedData = startOnboardingSchema.parse(body);

    logger.info('Starting onboarding question generation', {
      requestId,
      tenantId: validatedData.tenantId,
      industry: validatedData.industry,
    });

    const questions = await generateQuestions(
      validatedData.industry,
      validatedData.requirements ?? []
    );

    await c.env.ONBOARDING_CACHE.put(
      `questions:${validatedData.tenantId}`,
      JSON.stringify({
        questions,
        industry: validatedData.industry,
        requirements: validatedData.requirements,
        createdAt: new Date().toISOString(),
      }),
      { expirationTtl: 3600 }
    );

    return c.json({
      success: true,
      data: {
        tenantId: validatedData.tenantId,
        questions,
        industry: validatedData.industry,
        requirements: validatedData.requirements,
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 200, {
      'x-request-id': requestId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid onboarding start request', {
        requestId,
        actor,
        errors: error.errors,
      });

      return c.json({
        success: false,
        error: {
          code: 'ONB-001',
          message: 'Missing required fields',
          details: error.errors,
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 400, {
        'x-request-id': requestId,
      });
    }

    logger.error('Failed to start onboarding', error, { requestId, actor });

    return c.json({
      success: false,
      error: {
        code: 'ONB-999',
        message: 'Unknown error',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500, {
      'x-request-id': requestId,
    });
  }
});

onboardingRoutes.post('/', async (c) => {
  const requestId = getRequestId(c);
  const actor = (c.get('actor') as string | undefined) ?? 'anonymous';
  const logger = getRequestLogger(c, { route: 'POST /api/onboarding', actor });

  try {
    const body = await c.req.json();
    const validatedData = submitOnboardingSchema.parse(body);

    logger.info('Processing onboarding submission', {
      requestId,
      tenantId: validatedData.tenantId,
      industry: validatedData.industry,
    });

    const existingState = await getOnboardingState(c.env.DB, validatedData.tenantId);
    if (existingState) {
      logger.info('Onboarding already exists, returning cached result', {
        requestId,
        tenantId: validatedData.tenantId,
      });

      return c.json({
        success: true,
        data: {
          tenantId: validatedData.tenantId,
          config: existingState.config,
          template: existingState.template,
          status: existingState.status,
          idempotent: true,
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 200, {
        'x-request-id': requestId,
      });
    }

    const template = await createOnboardingTemplate(
      validatedData.industry,
      validatedData.answers,
      validatedData.requirements ?? []
    );

    const onboardingState = await saveOnboardingState(c.env.DB, {
      tenantId: validatedData.tenantId,
      name: validatedData.name,
      industry: validatedData.industry,
      answers: validatedData.answers,
      requirements: validatedData.requirements ?? [],
      config: {},
      template,
      status: 'completed',
    });

    await createAuditEvent(c.env.DB, {
      tenantId: validatedData.tenantId,
      actor,
      action: 'onboarding.completed',
      resource: 'onboarding',
      details: {
        tenantId: validatedData.tenantId,
        industry: validatedData.industry,
        requirements: validatedData.requirements,
      },
      requestId,
    });

    logger.info('Onboarding completed successfully', {
      requestId,
      tenantId: validatedData.tenantId,
    });

    return c.json({
      success: true,
      data: {
        tenantId: validatedData.tenantId,
        config: onboardingState.config,
        template: onboardingState.template,
        status: onboardingState.status,
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 200, {
      'x-request-id': requestId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid onboarding submission', {
        requestId,
        actor,
        errors: error.errors,
      });

      return c.json({
        success: false,
        error: {
          code: 'ONB-001',
          message: 'Missing required fields',
          details: error.errors,
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 400, {
        'x-request-id': requestId,
      });
    }

    if (error instanceof AtlasITError) {
      logger.warn('Onboarding processing failed with expected error', {
        requestId,
        actor,
        code: error.code,
      });

      return c.json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, error.statusCode, {
        'x-request-id': requestId,
      });
    }

    logger.error('Failed to process onboarding', error, { requestId, actor });

    return c.json({
      success: false,
      error: {
        code: 'ONB-999',
        message: 'Unknown error',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500, {
      'x-request-id': requestId,
    });
  }
});

onboardingRoutes.get('/:tenantId', async (c) => {
  const requestId = getRequestId(c);
  const actor = (c.get('actor') as string | undefined) ?? 'anonymous';
  const logger = getRequestLogger(c, { route: 'GET /api/onboarding/:tenantId', actor });
  const tenantId = c.req.param('tenantId');

  if (!tenantId) {
    logger.warn('Tenant ID missing in onboarding lookup', { requestId });

    return c.json({
      success: false,
      error: {
        code: 'ONB-005',
        message: 'Tenant ID required',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 400, {
      'x-request-id': requestId,
    });
  }

  try {
    logger.info('Retrieving onboarding state', {
      requestId,
      tenantId,
    });

    const onboardingState = await getOnboardingState(c.env.DB, tenantId);

    if (!onboardingState) {
      logger.warn('Onboarding state not found', {
        requestId,
        tenantId,
      });

      return c.json({
        success: false,
        error: {
          code: 'ONB-006',
          message: 'Onboarding not found',
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 404, {
        'x-request-id': requestId,
      });
    }

    return c.json({
      success: true,
      data: {
        tenantId: onboardingState.tenantId,
        status: onboardingState.status,
        config: onboardingState.config,
        template: onboardingState.template,
        createdAt: onboardingState.createdAt,
        updatedAt: onboardingState.updatedAt,
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 200, {
      'x-request-id': requestId,
    });
  } catch (error) {
    logger.error('Failed to retrieve onboarding state', error, {
      requestId,
      tenantId,
    });

    return c.json({
      success: false,
      error: {
        code: 'ONB-999',
        message: 'Unknown error',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500, {
      'x-request-id': requestId,
    });
  }
});

export { onboardingRoutes };
