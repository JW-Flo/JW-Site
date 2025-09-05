import { Hono } from 'hono';
import { z } from 'zod';

const logger = {
  info: (message: string, context?: any) => console.log(`[INFO] ${message}`, context),
  error: (message: string, error?: any, context?: any) => console.error(`[ERROR] ${message}`, error, context),
  warn: (message: string, context?: any) => console.warn(`[WARN] ${message}`, context),
};

const aiService = {
  generateText: async (prompt: string) => `Mock response for: ${prompt}`,
};

class AtlasITError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: string, message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'AtlasITError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

type Industry = 'technology' | 'healthcare' | 'finance' | 'retail' | 'manufacturing' | 'education' | 'government' | 'other';
type Requirement = 'compliance' | 'analytics' | 'automation' | 'security' | 'integration' | 'reporting' | 'monitoring' | 'backup';

import { generateQuestions } from '../services/questionGenerator';
import { createOnboardingTemplate } from '../services/templateGenerator';
import { saveOnboardingState, getOnboardingState } from '../services/database';
import type { OnboardingEnv } from '../types';

const onboardingRoutes = new Hono();

// Request validation schemas
const startOnboardingSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  name: z.string().min(1, 'Tenant name is required'),
  industry: z.enum(['technology', 'healthcare', 'finance', 'retail', 'manufacturing', 'education', 'government', 'other'] as const),
  requirements: z.array(z.enum(['compliance', 'analytics', 'automation', 'security', 'integration', 'reporting', 'monitoring', 'backup'] as const)).optional(),
});

const submitOnboardingSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  name: z.string().min(1, 'Tenant name is required'),
  industry: z.enum(['technology', 'healthcare', 'finance', 'retail', 'manufacturing', 'education', 'government', 'other'] as const),
  answers: z.record(z.any()),
  requirements: z.array(z.enum(['compliance', 'analytics', 'automation', 'security', 'integration', 'reporting', 'monitoring', 'backup'] as const)).optional(),
});

// POST /api/onboarding/start - Generate dynamic onboarding questions
onboardingRoutes.post('/start', async (c: any) => {
  const requestId = crypto.randomUUID();
  const actor = 'anonymous'; // Will be set by auth middleware

  try {
    const body = await c.req.json();
    const validatedData = startOnboardingSchema.parse(body);

    logger.info('Starting onboarding question generation', {
      requestId,
      actor,
      tenantId: validatedData.tenantId,
      industry: validatedData.industry,
    });

    // Generate dynamic questions based on industry and requirements
    const questions = await generateQuestions(
      validatedData.industry,
      validatedData.requirements || []
    );

    // Cache questions for later retrieval
    await c.env.ONBOARDING_CACHE.put(
      `questions:${validatedData.tenantId}`,
      JSON.stringify({
        questions,
        industry: validatedData.industry,
        requirements: validatedData.requirements,
        createdAt: new Date().toISOString(),
      }),
      { expirationTtl: 3600 } // 1 hour
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
      }, 400);
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
    }, 500);
  }
});

// POST /api/onboarding - Submit onboarding data and generate config/template
onboardingRoutes.post('/', async (c: any) => {
  const requestId = c.get('requestId') || crypto.randomUUID();
  const actor = c.get('actor') || 'anonymous';

  try {
    const body = await c.req.json();
    const validatedData = submitOnboardingSchema.parse(body);

    logger.info('Processing onboarding submission', {
      requestId,
      actor,
      tenantId: validatedData.tenantId,
      industry: validatedData.industry,
    });

    // Check if onboarding already exists (idempotency)
    const existingState = await getOnboardingState(c.env.DB, validatedData.tenantId);
    if (existingState) {
      logger.info('Onboarding already exists, returning cached result', {
        requestId,
        actor,
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
      });
    }

    // Generate onboarding template based on answers
    const template = await createOnboardingTemplate(
      validatedData.industry,
      validatedData.answers,
      validatedData.requirements || []
    );

    // Save onboarding state to database
    const onboardingState = await saveOnboardingState(c.env.DB, {
      tenantId: validatedData.tenantId,
      name: validatedData.name,
      industry: validatedData.industry,
      answers: validatedData.answers,
      requirements: validatedData.requirements || [],
      config: {}, // Initialize empty config - will be populated by template
      template,
      status: 'completed',
    });

    // Create audit event
    await c.env.DB.prepare(`
      INSERT INTO audit_events (tenant_id, actor, action, resource, details, request_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      validatedData.tenantId,
      actor,
      'onboarding.completed',
      'onboarding',
      JSON.stringify({
        tenantId: validatedData.tenantId,
        industry: validatedData.industry,
        requirements: validatedData.requirements,
      }),
      requestId,
      new Date().toISOString()
    ).run();

    logger.info('Onboarding completed successfully', {
      requestId,
      actor,
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
      }, 400);
    }

    if (error instanceof AtlasITError) {
      return c.json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, error.statusCode);
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
    }, 500);
  }
});

// GET /api/onboarding/:tenantId - Retrieve onboarding state
onboardingRoutes.get('/:tenantId', async (c: any) => {
  const requestId = c.get('requestId') || crypto.randomUUID();
  const actor = c.get('actor') || 'anonymous';
  const tenantId = c.req.param('tenantId');

  if (!tenantId) {
    return c.json({
      success: false,
      error: {
        code: 'ONB-005',
        message: 'Tenant ID required',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 400);
  }

  try {
    logger.info('Retrieving onboarding state', {
      requestId,
      actor,
      tenantId,
    });

    const onboardingState = await getOnboardingState(c.env.DB, tenantId);

    if (!onboardingState) {
      return c.json({
        success: false,
        error: {
          code: 'ONB-006',
          message: 'Onboarding not found',
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 404);
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
    });

  } catch (error) {
    logger.error('Failed to retrieve onboarding state', error, {
      requestId,
      actor,
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
    }, 500);
  }
});

export { onboardingRoutes };
