import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { rateLimit } from './middleware/rateLimit';
import { auth } from './middleware/auth';
import { onboardingRoutes } from './handlers/onboarding';
import { healthRoutes } from './handlers/health';
import { requestContext } from './middleware/requestContext';
import { appLogger, getRequestId, getRequestLogger } from './utils/logger';
import type { OnboardingEnv } from './types';

const app = new Hono<OnboardingEnv>();

app.use('*', cors({
  origin: ['http://localhost:3000', 'https://atlasit.com'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-request-id'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['x-request-id'],
  maxAge: 86400,
}));

app.use('*', requestContext(appLogger));

// Health check routes
app.route('/health', healthRoutes);

// API routes with middleware
app.use('/api/*', rateLimit());
app.use('/api/*', auth());
app.route('/api/onboarding', onboardingRoutes);

// Error handling
app.onError((error, c) => {
  const requestId = getRequestId(c);
  const requestLogger = getRequestLogger(c, { scope: 'onError' });

  requestLogger.error('Unhandled error', error);

  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    requestId,
    timestamp: new Date().toISOString(),
  }, 500);
});

// 404 handler
app.notFound((c) => {
  const requestId = getRequestId(c);
  const requestLogger = getRequestLogger(c, { scope: 'notFound' });

  requestLogger.warn('Route not found', {
    method: c.req.method,
    url: c.req.url,
  });

  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
    requestId,
    timestamp: new Date().toISOString(),
  }, 404);
});

export default app;
