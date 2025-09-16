import type { MiddlewareHandler } from 'hono';
import { ApiKeyAuthenticator } from '@atlasit/auth';
import { getRequestId, getRequestLogger } from '../utils/logger';
import type { OnboardingEnv } from '../types';

export const auth = (): MiddlewareHandler<OnboardingEnv> => {
  return async (c, next) => {
    const requestId = getRequestId(c);
    const logger = getRequestLogger(c, { scope: 'auth' });
    const apiKey = c.req.header('x-api-key') ?? undefined;

    const authenticator = ApiKeyAuthenticator.fromEnv(c.env.API_ALLOWED_KEYS, {
      logger,
      description: 'onboarding-api',
    });

    const result = await authenticator.verify(apiKey);

    if (result.status === 'skipped') {
      await next();
      return;
    }

    if (result.status === 'valid') {
      if (result.actor) {
        c.set('actor', result.actor);
      }
      await next();
      return;
    }

    if (result.status === 'missing') {
      return c.json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'API key required',
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 401, {
        'WWW-Authenticate': 'Bearer realm="onboarding-api", error="invalid_token"',
        'x-request-id': requestId,
      });
    }

    return c.json({
      success: false,
      error: {
        code: 'AUTH_INVALID',
        message: 'Invalid API key',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 401, {
      'x-request-id': requestId,
    });
  };
};
