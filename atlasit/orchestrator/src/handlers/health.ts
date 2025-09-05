import { Hono } from 'hono';
import { logger } from '@atlasit/shared';

const healthRoutes = new Hono();

healthRoutes.get('/', async (c: any) => {
  const requestId = crypto.randomUUID();

  logger.info('Orchestrator health check requested', { requestId });

  // Basic health check
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'atlasit-orchestrator',
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
    await c.env.WORKFLOW_CACHE.put('health-check', 'ok', { expirationTtl: 60 });

    const ready = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'atlasit-orchestrator',
      checks: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        cache: 'healthy',
      },
    };

    logger.info('Orchestrator readiness check passed', { requestId });

    return c.json(ready, 200, {
      'x-request-id': requestId,
    });
  } catch (error) {
    logger.error('Orchestrator readiness check failed', error, { requestId });

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
