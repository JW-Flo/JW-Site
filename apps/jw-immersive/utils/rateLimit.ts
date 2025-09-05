// Rate limiting utilities for Astro API routes
interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for production, use Redis or similar)
const store: RateLimitStore = {};

export function createRateLimiter(options: RateLimitOptions) {
  return {
    check: (key: string): { allowed: boolean; remaining: number; resetTime: number } => {
      const now = Date.now();

      // Clean up expired entries
      Object.keys(store).forEach(k => {
        if (store[k].resetTime < now) {
          delete store[k];
        }
      });

      if (!store[key] || store[key].resetTime < now) {
        store[key] = {
          count: 1,
          resetTime: now + options.windowMs
        };
        return { allowed: true, remaining: options.maxRequests - 1, resetTime: store[key].resetTime };
      }

      if (store[key].count >= options.maxRequests) {
        return { allowed: false, remaining: 0, resetTime: store[key].resetTime };
      }

      store[key].count++;
      return {
        allowed: true,
        remaining: options.maxRequests - store[key].count,
        resetTime: store[key].resetTime
      };
    }
  };
}

// Pre-configured rate limiters
export const strictRateLimit = createRateLimiter({ windowMs: 60000, maxRequests: 10 }); // 10 requests per minute
export const moderateRateLimit = createRateLimiter({ windowMs: 60000, maxRequests: 30 }); // 30 requests per minute
export const lenientRateLimit = createRateLimiter({ windowMs: 60000, maxRequests: 100 }); // 100 requests per minute
