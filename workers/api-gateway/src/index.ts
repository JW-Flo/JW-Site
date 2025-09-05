import { z } from 'zod';
import type { D1Database } from '@cloudflare/workers-types';

// Types
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// Schemas
const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const LoginResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    tenantId: z.string(),
  }),
});

// JWT helpers (simplified for v0)
function createJWT(payload: any, secret: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = btoa('simulated-signature'); // In prod, use crypto.subtle.sign
  return `${header}.${body}.${signature}`;
}

function verifyJWT(token: string, secret: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');
    return JSON.parse(atob(parts[1]));
  } catch {
    throw new Error('Invalid token');
  }
}

// Auth middleware
async function requireAuth(request: Request, env: Env): Promise<{ userId: string; tenantId: string }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);
  const payload = verifyJWT(token, env.JWT_SECRET);

  if (payload.exp < Date.now() / 1000) {
    throw new Error
  }

  return { userId: payload.sub, tenantId: payload.tenantId };
}

// Routes
const routes = {
  'POST /api/v1/auth/login': async (request: Request, env: Env) => {
    const body = await request.json();
    const { email, password } = LoginRequestSchema.parse(body);

    // Stub: In prod, query DB for user
    if (email !== 'admin@atlasit.pro' || password !== 'password') {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = {
      id: 'user-1',
      email,
      tenantId: 'tenant-1',
    };

    const token = createJWT({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    }, env.JWT_SECRET);

    const refreshToken = createJWT({
      sub: user.id,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
    }, env.JWT_SECRET);

    return new Response(JSON.stringify({
      token,
      refreshToken,
      user,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  'POST /api/v1/auth/refresh': async (request: Request, env: Env) => {
    const body = await request.json();
    const { refreshToken } = body;

    const payload = verifyJWT(refreshToken, env.JWT_SECRET);
    if (payload.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    const newToken = createJWT({
      sub: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }, env.JWT_SECRET);

    return new Response(JSON.stringify({ token: newToken }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  'POST /api/v1/auth/logout': async (request: Request, env: Env) => {
    // Stub: In prod, invalidate token in KV or DB
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

// Main handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);
    const routeKey = `${request.method} ${url.pathname}`;

    console.log(`[${requestId}] ${routeKey} - Start`);

    const handler = routes[routeKey as keyof typeof routes];
    if (!handler) {
      const duration = Date.now() - start;
      console.log(`[${requestId}] ${routeKey} - 404 - ${duration}ms`);
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const response = await handler(request, env);
      const duration = Date.now() - start;
      console.log(`[${requestId}] ${routeKey} - ${response.status} - ${duration}ms`);
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[${requestId}] ${routeKey} - Error - ${duration}ms:`, error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
