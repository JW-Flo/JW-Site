import { generateRandomString } from '@atlasit/edge-utils';

const CSRF_COOKIE = 'atlasit_csrf';

export function createCsrfToken(): string {
  return generateRandomString(32);
}

export function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const parts = header.split(';');
  for (const c of parts) {
    const [k, ...rest] = c.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

export function getCsrfFromCookies(cookieHeader: string | null): string | null {
  return parseCookie(cookieHeader, CSRF_COOKIE);
}

export function makeCsrfCookie(token: string): string {
  // Not HttpOnly so client can read and echo in header. Lax is fine; Strict also acceptable.
  return `${CSRF_COOKIE}=${token}; Path=/; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
}

export function isStateChanging(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}
