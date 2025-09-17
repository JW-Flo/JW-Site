import type { Handle } from '@sveltejs/kit';
import { getUserFromToken } from './lib/auth';
import { parseCookie } from '@atlasit/edge-utils';
import { sessionStore } from '$lib/server/sessionStore';
import { getCsrfFromCookies, isStateChanging, createCsrfToken, makeCsrfCookie } from '$lib/server/csrf';

function verifyCsrfIfNeeded(request: Request, cookies: string | null, hasSession: boolean): Response | null {
	if (!hasSession) return null;
	if (!isStateChanging(request.method)) return null;
	const csrfCookie = getCsrfFromCookies(cookies);
	const csrfHeader = request.headers.get('x-csrf-token');
	if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
		return new Response(JSON.stringify({ error: 'Forbidden (CSRF)' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
	}
	return null;
}

function isPublicApiPath(pathname: string): boolean {
	const publicPrefixes = [
		'/api/health',
		'/api/auth/login',
		'/api/auth/refresh',
		'/api/auth/logout',
		'/api/oauth/google',
		'/api/oauth/entra',
	];
	return publicPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export const handle: Handle = async ({ event, resolve }) => {
	// Prefer server-side session via KV/D1
	const cookies = event.request.headers.get('cookie');
	const sessionId = parseCookie(cookies, 'atlasit_session');
	if (sessionId) {
		const store = sessionStore(event.platform!.env as any);
		const s = await store.getSession(sessionId);
		if (s && !s.revoked_at && new Date(s.expires_at).getTime() > Date.now()) {
			event.locals.user = { id: s.user_id, email: s.email || '', tenantId: s.tenant_id || '' } as any;
		}
	}

	const csrfBlock = verifyCsrfIfNeeded(event.request, cookies, !!sessionId);
	if (csrfBlock) return csrfBlock;
	// Fallback: Authorization Bearer JWT for API clients
	if (!event.locals.user) {
		const jwtSecret = event.platform?.env?.JWT_SECRET || 'default-secret';
		const authHeader = event.request.headers.get('Authorization');
		if (authHeader?.startsWith('Bearer ')) {
			const user = await getUserFromToken(authHeader, jwtSecret);
			if (user) { event.locals.user = user; }
		}
	}

		// Gate API routes except public ones
		const url = new URL(event.request.url);
		const isApi = url.pathname.startsWith('/api/');
		const isPublic = isPublicApiPath(url.pathname);
	if (isApi && !isPublic && !event.locals.user) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
		});
	}

		// Route hard gate: /app/** requires authenticated session -> redirect to /login
		if (url.pathname.startsWith('/app') && !event.locals.user && event.request.method === 'GET') {
			return new Response(null, { status: 302, headers: { Location: '/login' } });
		}

	// Add security headers and set CSRF cookie for GET if session exists
	const response = await resolve(event);
		if (sessionId && event.request.method === 'GET') {
		const token = createCsrfToken();
		response.headers.append('Set-Cookie', makeCsrfCookie(token));
	}
	
	// Edge-safe security headers
		response.headers.set('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:;");
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
		response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
	
	return response;
};
