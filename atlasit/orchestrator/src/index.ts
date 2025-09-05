import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { logger } from '@atlasit/shared';
import { rateLimit } from './middleware/rateLimit';
import { auth } from './middleware/auth';
import { workflowRoutes } from './handlers/workflows';
import { executionRoutes } from './handlers/executions';
import { healthRoutes } from './handlers/health';

export interface OrchestratorEnv {
  DB: D1Database;
  WORKFLOW_CACHE: KVNamespace;
  EXECUTION_LOGS: KVNamespace;
  AI: any;
  API_ALLOWED_KEYS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  RATE_LIMIT_WINDOW_SECONDS?: string;
  [key: string]: any;
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

  logger.info('Orchestrator request started', {
    method: c.req.method,
    url: c.req.url,
    requestId,
  });

  await next();

  const duration = Date.now() - start;
  logger.info('Orchestrator request completed', {
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
app.route('/api/workflows', workflowRoutes);
app.route('/api/executions', executionRoutes);

// Error handling
app.onError((err, c) => {
  const requestId = 'unknown';
  logger.error('Orchestrator unhandled error', err, { requestId });

  return c.json({
    success: false,
    error: {
      code: 'ORCHESTRATOR_ERROR',
      message: 'An unexpected error occurred',
    },
    requestId,
    timestamp: new Date().toISOString(),
  }, 500);
});

// 404 handler
app.notFound((c) => {
  const requestId = 'unknown';
  logger.warn('Orchestrator route not found', {
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
