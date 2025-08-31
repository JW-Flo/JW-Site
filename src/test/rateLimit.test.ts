import { describe, it, expect } from 'vitest';
import { strictRateLimit } from '../../utils/rateLimit.js';

// Simple unit test to verify rate limiter denies after max requests within window

describe('strictRateLimit', () => {
  it('should allow first 10 requests then block', () => {
    const key = 'test-client';
    for (let i = 0; i < 10; i++) {
      const res = strictRateLimit.check(key);
      expect(res.allowed).toBe(true);
    }
    const final = strictRateLimit.check(key);
    expect(final.allowed).toBe(false);
  });
});
