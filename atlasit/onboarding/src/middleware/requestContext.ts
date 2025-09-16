import type { MiddlewareHandler } from 'hono';
import { logger as sharedLogger, Logger } from '@atlasit/shared';
import type { OnboardingEnv } from '../types';

export const requestContext = (baseLogger: Logger = sharedLogger): MiddlewareHandler<OnboardingEnv> => {
  return async (c, next) => {
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const requestLogger = baseLogger.withContext({
      requestId,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
    });

    c.set('requestId', requestId);
    c.set('logger', requestLogger);

    requestLogger.info('Request started');

    try {
      await next();
      requestLogger.info('Request completed', {
        status: c.res.status,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      requestLogger.error('Request failed', error, {
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
  };
};
