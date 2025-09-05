import { MiddlewareHandler } from 'hono';
import { logger } from '@atlasit/shared';

export const rateLimit = (): MiddlewareHandler => {
  return async (c, next) => {
    const requestId = crypto.randomUUID();

    // Get client identifier (API key or IP)
    const apiKey = c.req.header('x-api-key');
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const clientId = apiKey || clientIP;

    // Get rate limit configuration from environment
    const maxRequests = parseInt(c.env.RATE_LIMIT_MAX_REQUESTS || '100');
    const windowSeconds = parseInt(c.env.RATE_LIMIT_WINDOW_SECONDS || '60');

    const now = Math.floor(Date.now() / 1000);

    try {
      // Get current request count for this client
      const key = `ratelimit:${clientId}`;
      const currentData = await c.env.WORKFLOW_CACHE.get(key);

      let requestCount = 0;
      let resetTime = now + windowSeconds;

      if (currentData) {
        const parsed = JSON.parse(currentData);
        if (parsed.reset > now) {
          requestCount = parsed.count;
          resetTime = parsed.reset;
        }
      }

      // Check if limit exceeded
      if (requestCount >= maxRequests) {
        const resetIn = resetTime - now;

        logger.warn('Orchestrator rate limit exceeded', {
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

      // Increment counter
      requestCount++;

      // Store updated counter
      await c.env.WORKFLOW_CACHE.put(key, JSON.stringify({
        count: requestCount,
        reset: resetTime,
      }), {
        expirationTtl: windowSeconds,
      });

      // Add rate limit headers to response
      await next();

      c.res.headers.set('X-RateLimit-Limit', maxRequests.toString());
      c.res.headers.set('X-RateLimit-Remaining', (maxRequests - requestCount).toString());
      c.res.headers.set('X-RateLimit-Reset', resetTime.toString());

    } catch (error) {
      logger.error('Orchestrator rate limiting error', error, { requestId, clientId });
      // Continue with request if rate limiting fails
      await next();
    }
  };
};
