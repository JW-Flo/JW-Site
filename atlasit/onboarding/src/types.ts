import type { Context, Env } from 'hono';
import type { Logger } from '@atlasit/shared';

// Cloudflare Worker bindings used by the onboarding service
export interface OnboardingBindings extends Record<string, unknown> {
  DB: D1Database;
  ONBOARDING_CACHE: KVNamespace;
  RATE_LIMIT: KVNamespace;
  AI?: any;
  API_ALLOWED_KEYS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  RATE_LIMIT_WINDOW_SECONDS?: string;
}

// Request-scoped variables we attach to the Hono context
export interface OnboardingVariables extends Record<string, unknown> {
  requestId: string;
  actor?: string;
  logger?: Logger;
}

export interface OnboardingEnv extends Env {
  Bindings: OnboardingBindings;
  Variables: OnboardingVariables;
}

export type OnboardingContext = Context<OnboardingEnv>;
