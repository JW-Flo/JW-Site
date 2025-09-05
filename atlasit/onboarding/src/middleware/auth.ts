import { MiddlewareHandler } from 'hono';

const logger = {
  info: (message: string, context?: any) => console.log(`[INFO] ${message}`, context),
  error: (message: string, error?: any, context?: any) => console.error(`[ERROR] ${message}`, error, context),
  warn: (message: string, context?: any) => console.warn(`[WARN] ${message}`, context),
};

export const auth = (): MiddlewareHandler => {
  return async (c, next) => {
    const requestId = c.get('requestId') || 'unknown';
    const apiKey = c.req.header('x-api-key');

    // Check if API key authentication is required
    const allowedKeys = c.env.API_ALLOWED_KEYS;
    if (!allowedKeys) {
      // No API key requirement, continue
      await next();
      return;
    }

    // Check if API key is provided
    if (!apiKey) {
      logger.warn('Missing API key', { requestId });

      return c.json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'API key required',
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 401, {
        'WWW-Authenticate': 'Bearer',
      });
    }

    // Validate API key
    const keys = allowedKeys.split(',').map((k: string) => k.trim());
    if (!keys.includes(apiKey)) {
      logger.warn('Invalid API key', { requestId, apiKey: apiKey.substring(0, 8) + '...' });

      return c.json({
        success: false,
        error: {
          code: 'AUTH_INVALID',
          message: 'Invalid API key',
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 401);
    }

    // Set actor for audit logging
    c.set('actor', apiKey);

    logger.info('API key authenticated', {
      requestId,
      actor: apiKey.substring(0, 8) + '...',
    });

    await next();
  };
};
