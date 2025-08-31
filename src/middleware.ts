// Global middleware for security headers & basic request hardening
import type { MiddlewareHandler } from 'astro';

// Content Security Policy directives. TODO: Remove 'unsafe-inline' after refactoring inline scripts.
const cspDirectives: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

function buildCsp() {
  return Object.entries(cspDirectives)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ');
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const res = await next();
  const headers = res.headers;
  headers.set('Content-Security-Policy', buildCsp());
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  return res;
};
