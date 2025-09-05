// Global middleware for security headers & basic request hardening
import type { MiddlewareHandler } from 'astro';

function generateNonce(len = 16) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/[^a-zA-Z0-9]/g,'').slice(0,len);
}

function buildCsp(nonce: string) {
  const cspDirectives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`],
    'style-src': ["'self'", "'unsafe-inline'"], // keep temporarily for Tailwind inline style attributes
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };
  return Object.entries(cspDirectives).map(([k,v]) => `${k} ${v.join(' ')}`).join('; ');
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  function genRequestId() {
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10);
  }

  const start = Date.now();
  const nonce = generateNonce();
  const reqId = genRequestId();
  (context.locals as any).cspNonce = nonce;
  (context.locals as any).requestId = reqId;
  let res: Response = await next();
  const headers = res.headers;
  headers.set('Content-Security-Policy', buildCsp(nonce));
  headers.set('X-Request-ID', reqId);
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  const duration = Date.now() - start;
  headers.set('Server-Timing', `app;dur=${duration}`);
  try {
    // Lightweight console log; production can ship to external log sink
    console.log(JSON.stringify({ level: 'info', msg: 'request', id: reqId, method: context.request.method, url: context.request.url, status: res.status, ms: duration }));
  } catch {}
  return res;
};
