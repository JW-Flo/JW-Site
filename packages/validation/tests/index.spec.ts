import { describe, it, expect } from 'vitest';
import { onboardingSchema, oauthCallbackSchema } from '../index.js';

describe('validation', () => {
  it('onboardingSchema valid', () => {
    const data = { email: 'test@example.com', name: 'Test', role: 'User' };
    expect(onboardingSchema.parse(data)).toEqual(data);
  });

  it('onboardingSchema invalid email', () => {
    expect(() => onboardingSchema.parse({ email: 'invalid', name: 'Test', role: 'User' })).toThrow();
  });

  it('oauthCallbackSchema valid', () => {
    const data = { code: 'abc123', state: 'xyz789' };
    expect(oauthCallbackSchema.parse(data)).toEqual(data);
  });

  it('oauthCallbackSchema missing code', () => {
    expect(() => oauthCallbackSchema.parse({ state: 'xyz789' })).toThrow();
  });
});
