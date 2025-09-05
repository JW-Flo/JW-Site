// Environment types for Cloudflare Workers
export interface OnboardingEnv {
  DB: D1Database;
  ONBOARDING_CACHE: KVNamespace;
  AI: any; // Cloudflare AI binding
  API_KEY: string;
  ALLOWED_API_KEYS: string;
  RATE_LIMIT_KV: KVNamespace;
  [key: string]: any; // Allow additional bindings
}

export interface HonoContext {
  env: OnboardingEnv;
  req: any;
  json: (data: any, status?: number) => Response;
  text: (text: string, status?: number) => Response;
  get: (key: string) => any;
}
