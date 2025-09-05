const logger = {
  info: (message: string, context?: any) => console.log(`[INFO] ${message}`, context),
  error: (message: string, error?: any, context?: any) => console.error(`[ERROR] ${message}`, error, context),
  warn: (message: string, context?: any) => console.warn(`[WARN] ${message}`, context),
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

export interface OnboardingState {
  tenantId: string;
  name: string;
  industry: string;
  answers: Record<string, any>;
  requirements: string[];
  config: Record<string, any>;
  template: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export async function saveOnboardingState(
  db: D1Database,
  data: Omit<OnboardingState, 'createdAt' | 'updatedAt'>
): Promise<OnboardingState> {
  const now = new Date().toISOString();

  try {
    logger.info('Saving onboarding state to database', {
      tenantId: data.tenantId,
      status: data.status,
    });

    // Insert or replace onboarding state
    await db.prepare(`
      INSERT OR REPLACE INTO onboarding_sessions (
        tenant_id,
        name,
        industry,
        answers,
        requirements,
        config,
        template,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.tenantId,
      data.name,
      data.industry,
      JSON.stringify(data.answers),
      JSON.stringify(data.requirements),
      JSON.stringify(data.config),
      JSON.stringify(data.template),
      data.status,
      now,
      now
    ).run();

    const onboardingState: OnboardingState = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    logger.info('Onboarding state saved successfully', {
      tenantId: data.tenantId,
    });

    return onboardingState;

  } catch (error) {
    logger.error('Failed to save onboarding state', error, {
      tenantId: data.tenantId,
    });

    throw new AtlasITError(
      'DB_ERROR',
      'Failed to save onboarding state',
      500,
      { tenantId: data.tenantId }
    );
  }
}

export async function getOnboardingState(
  db: D1Database,
  tenantId: string
): Promise<OnboardingState | null> {
  try {
    logger.info('Retrieving onboarding state from database', { tenantId });

    const result = await db.prepare(`
      SELECT
        tenant_id,
        name,
        industry,
        answers,
        requirements,
        config,
        template,
        status,
        created_at,
        updated_at
      FROM onboarding_sessions
      WHERE tenant_id = ?
    `).bind(tenantId).first();

    if (!result) {
      logger.info('Onboarding state not found', { tenantId });
      return null;
    }

    const onboardingState: OnboardingState = {
      tenantId: result.tenant_id as string,
      name: result.name as string,
      industry: result.industry as string,
      answers: JSON.parse(result.answers as string),
      requirements: JSON.parse(result.requirements as string),
      config: JSON.parse(result.config as string),
      template: JSON.parse(result.template as string),
      status: result.status as OnboardingState['status'],
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string,
    };

    logger.info('Onboarding state retrieved successfully', { tenantId });

    return onboardingState;

  } catch (error) {
    logger.error('Failed to retrieve onboarding state', error, { tenantId });

    throw new AtlasITError(
      'DB_ERROR',
      'Failed to retrieve onboarding state',
      500,
      { tenantId }
    );
  }
}

export async function updateOnboardingStatus(
  db: D1Database,
  tenantId: string,
  status: OnboardingState['status']
): Promise<void> {
  const now = new Date().toISOString();

  try {
    logger.info('Updating onboarding status', { tenantId, status });

    await db.prepare(`
      UPDATE onboarding_sessions
      SET status = ?, updated_at = ?
      WHERE tenant_id = ?
    `).bind(status, now, tenantId).run();

    logger.info('Onboarding status updated successfully', { tenantId, status });

  } catch (error) {
    logger.error('Failed to update onboarding status', error, { tenantId, status });

    throw new AtlasITError(
      'DB_ERROR',
      'Failed to update onboarding status',
      500,
      { tenantId, status }
    );
  }
}

export async function createAuditEvent(
  db: D1Database,
  event: {
    tenantId: string;
    actor: string;
    action: string;
    resource: string;
    details: Record<string, any>;
    requestId: string;
  }
): Promise<void> {
  try {
    logger.info('Creating audit event', {
      tenantId: event.tenantId,
      action: event.action,
      resource: event.resource,
    });

    await db.prepare(`
      INSERT INTO audit_events (
        tenant_id,
        actor,
        action,
        resource,
        details,
        request_id,
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event.tenantId,
      event.actor,
      event.action,
      event.resource,
      JSON.stringify(event.details),
      event.requestId,
      new Date().toISOString()
    ).run();

    logger.info('Audit event created successfully', {
      tenantId: event.tenantId,
      action: event.action,
    });

  } catch (error) {
    logger.error('Failed to create audit event', error, {
      tenantId: event.tenantId,
      action: event.action,
    });

    // Don't throw here - audit failures shouldn't break the main flow
    // But we should log it as a warning
    logger.warn('Audit event creation failed, continuing with main flow', {
      tenantId: event.tenantId,
      action: event.action,
    });
  }
}

export async function getTenantOnboardingHistory(
  db: D1Database,
  tenantId: string,
  limit: number = 10
): Promise<OnboardingState[]> {
  try {
    logger.info('Retrieving tenant onboarding history', { tenantId, limit });

    const results = await db.prepare(`
      SELECT
        tenant_id,
        name,
        industry,
        answers,
        requirements,
        config,
        template,
        status,
        created_at,
        updated_at
      FROM onboarding_sessions
      WHERE tenant_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(tenantId, limit).all();

    const history: OnboardingState[] = results.results.map((result: any) => ({
      tenantId: result.tenant_id,
      name: result.name,
      industry: result.industry,
      answers: JSON.parse(result.answers),
      requirements: JSON.parse(result.requirements),
      config: JSON.parse(result.config),
      template: JSON.parse(result.template),
      status: result.status,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    }));

    logger.info('Tenant onboarding history retrieved successfully', {
      tenantId,
      count: history.length,
    });

    return history;

  } catch (error) {
    logger.error('Failed to retrieve tenant onboarding history', error, { tenantId });

    throw new AtlasITError(
      'DB_ERROR',
      'Failed to retrieve onboarding history',
      500,
      { tenantId }
    );
  }
}
