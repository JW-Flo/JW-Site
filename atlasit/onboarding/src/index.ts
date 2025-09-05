import { Hono } from 'hono';
import { cors } from 'hono/cors';
// import { logger } from '@atlasit/shared';
const logger = {
  info: (message: string, context?: any) => console.log(`[INFO] ${message}`, context),
  error: (message: string, error?: any, context?: any) => console.error(`[ERROR] ${message}`, error, context),
  warn: (message: string, context?: any) => console.warn(`[WARN] ${message}`, context),
};
import { rateLimit } from './middleware/rateLimit';
import { auth } from './middleware/auth';
import { onboardingRoutes } from './handlers/onboarding';
import { healthRoutes } from './handlers/health';

export interface Env {
  DB: D1Database;
  ONBOARDING_CACHE: KVNamespace;
  RATE_LIMIT: KVNamespace;
  AI: any;
  API_ALLOWED_KEYS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  RATE_LIMIT_WINDOW_SECONDS?: string;
  [key: string]: any; // Allow additional bindings
}

const app = new Hono();

// Global middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://atlasit.com'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-request-id'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['x-request-id'],
  maxAge: 86400,
}));

// Request logging middleware
app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID();
  const start = Date.now();

  logger.info('Request started', {
    method: c.req.method,
    url: c.req.url,
    requestId,
  });

  await next();

  const duration = Date.now() - start;
  logger.info('Request completed', {
    method: c.req.method,
    url: c.req.url,
    status: c.res.status,
    duration,
    requestId,
  });
});

// Health check routes
app.route('/health', healthRoutes);

// API routes with middleware
app.use('/api/*', rateLimit());
app.use('/api/*', auth());
app.route('/api/onboarding', onboardingRoutes);

// Error handling
app.onError((err, c) => {
  const requestId = 'unknown';
  logger.error('Unhandled error', err, { requestId });

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
  const requestId = 'unknown';
  logger.warn('Route not found', {
    method: c.req.method,
    url: c.req.url,
    requestId,
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
