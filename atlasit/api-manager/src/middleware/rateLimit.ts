import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = config.rateLimit.windowMs;
    const maxRequests = config.rateLimit.maxRequests;

    // Clean up expired entries
    Object.keys(rateLimitStore).forEach(key => {
      if (rateLimitStore[key].resetTime < now) {
        delete rateLimitStore[key];
      }
    });

    // Get or create client entry
    if (!rateLimitStore[clientId]) {
      rateLimitStore[clientId] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    const clientEntry = rateLimitStore[clientId];

    // Reset window if expired
    if (clientEntry.resetTime < now) {
      clientEntry.count = 0;
      clientEntry.resetTime = now + windowMs;
    }

    // Check if limit exceeded
    if (clientEntry.count >= maxRequests) {
      const retryAfter = Math.ceil((clientEntry.resetTime - now) / 1000);
      
      logger.warn('Rate limit exceeded', {
        clientId,
        count: clientEntry.count,
        maxRequests,
        retryAfter
      });

      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(clientEntry.resetTime / 1000).toString(),
        'Retry-After': retryAfter.toString()
      });

      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_001',
        retryAfter
      });
    }

    // Increment counter
    clientEntry.count++;

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - clientEntry.count).toString(),
      'X-RateLimit-Reset': Math.ceil(clientEntry.resetTime / 1000).toString()
    });

    next();
  } catch (error) {
    logger.error('Rate limit middleware error', error);
    next(); // Continue on error to avoid blocking legitimate requests
  }
};
