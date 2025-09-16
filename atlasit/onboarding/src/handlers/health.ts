import { Hono } from 'hono';
import type { OnboardingEnv } from '../types';
import { getRequestId, getRequestLogger } from '../utils/logger';

const healthRoutes = new Hono<OnboardingEnv>();

healthRoutes.get('/', async (c) => {
  const requestId = getRequestId(c);
  const logger = getRequestLogger(c, { route: 'GET /health' });

  logger.info('Health check requested', { requestId });

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

healthRoutes.get('/ready', async (c) => {
  const requestId = getRequestId(c);
  const logger = getRequestLogger(c, { route: 'GET /health/ready' });

  try {
    const dbHealth = await c.env.DB.prepare('SELECT 1').first();
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
