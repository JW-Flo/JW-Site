import { Hono } from 'hono';

const logger = {
  info: (message: string, context?: any) => console.log(`[INFO] ${message}`, context),
  error: (message: string, error?: any, context?: any) => console.error(`[ERROR] ${message}`, error, context),
  warn: (message: string, context?: any) => console.warn(`[WARN] ${message}`, context),
};

const healthRoutes = new Hono();

healthRoutes.get('/', async (c: any) => {
  const requestId = crypto.randomUUID();

  logger.info('Health check requested', { requestId });

  // Basic health check
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'atlasit-onboarding',
  };

  return c.json(health, 200, {
    'x-request-id': requestId,
  });
});

healthRoutes.get('/ready', async (c: any) => {
  const requestId = crypto.randomUUID();

  try {
    // Check database connectivity
    const dbHealth = await c.env.DB.prepare('SELECT 1').first();

    // Check KV connectivity
    await c.env.ONBOARDING_CACHE.put('health-check', 'ok', { expirationTtl: 60 });

    const ready = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'atlasit-onboarding',
      checks: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        cache: 'healthy',
      },
    };

    logger.info('Readiness check passed', { requestId });

    return c.json(ready, 200, {
      'x-request-id': requestId,
    });
  } catch (error) {
    logger.error('Readiness check failed', error, { requestId });

    return c.json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Service dependencies unavailable',
    }, 503, {
      'x-request-id': requestId,
    });
  }
});

export { healthRoutes };
