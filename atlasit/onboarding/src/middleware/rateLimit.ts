import type { MiddlewareHandler } from 'hono';
import { getRequestId, getRequestLogger } from '../utils/logger';
import type { OnboardingEnv } from '../types';

export const rateLimit = (): MiddlewareHandler<OnboardingEnv> => {
  return async (c, next) => {
    const requestId = getRequestId(c);
    const logger = getRequestLogger(c, { scope: 'rateLimit' });

    const apiKey = c.req.header('x-api-key') ?? undefined;
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const clientId = apiKey ?? clientIP;

    const maxRequests = Number.parseInt(c.env.RATE_LIMIT_MAX_REQUESTS ?? '100', 10);
    const windowSeconds = Number.parseInt(c.env.RATE_LIMIT_WINDOW_SECONDS ?? '60', 10);

    const now = Math.floor(Date.now() / 1000);

    const kv = c.env.RATE_LIMIT;
    if (!kv) {
      logger.warn('RATE_LIMIT binding missing, skipping throttle');
      await next();
      return;
    }

    try {
      const key = `ratelimit:${clientId}`;
      const currentData = await kv.get(key);

      let requestCount = 0;
      let resetTime = now + windowSeconds;

      if (currentData) {
        try {
          const parsed = JSON.parse(currentData) as { count?: number; reset?: number };
          if (typeof parsed.reset === 'number' && parsed.reset > now) {
            requestCount = typeof parsed.count === 'number' ? parsed.count : 0;
            resetTime = parsed.reset;
          }
        } catch (parseError) {
          logger.warn('Failed to parse rate limit state, resetting counter', {
            requestId,
            clientId,
          });
        }
      }

      if (requestCount >= maxRequests) {
        const resetIn = Math.max(0, resetTime - now);

        logger.warn('Rate limit exceeded', {
          requestId,
          clientId,
          requestCount,
          maxRequests,
          resetIn,
        });

        return c.json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
          },
          requestId,
          timestamp: new Date().toISOString(),
        }, 429, {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': resetIn.toString(),
        });
      }

      requestCount += 1;

      await kv.put(key, JSON.stringify({
        count: requestCount,
        reset: resetTime,
      }), {
        expirationTtl: windowSeconds,
      });

      await next();

      c.res.headers.set('X-RateLimit-Limit', maxRequests.toString());
      c.res.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount).toString());
      c.res.headers.set('X-RateLimit-Reset', resetTime.toString());
    } catch (error) {
      logger.error('Rate limiting error', error, { requestId, clientId });
      await next();
    }
  };
};
