import { verifyJWT } from '@atlasit/edge-utils';
import type { Handle } from '@sveltejs/kit';

export interface User {
  id: string;
  email: string;
  tenantId: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

/**
 * Extract and verify JWT token from Authorization header
 */
export async function getUserFromToken(authHeader: string | null, jwtSecret: string): Promise<User | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyJWT(token, jwtSecret);
    return {
      id: payload.sub,
      email: payload.email || '',
      tenantId: payload.tenantId || '',
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Require authentication for a route
 */
export async function requireAuth(request: Request, jwtSecret: string): Promise<User> {
  const authHeader = request.headers.get('Authorization');
  const user = await getUserFromToken(authHeader, jwtSecret);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * SvelteKit auth middleware for protecting routes
 */
export const authMiddleware: Handle = async ({ event, resolve }) => {
  const jwtSecret = event.platform?.env?.JWT_SECRET || 'default-secret';

  // Extract user from Authorization header
  const authHeader = event.request.headers.get('Authorization');
  const user = await getUserFromToken(authHeader, jwtSecret);

  // Add user to locals if authenticated
  if (user) {
    event.locals.user = user;
  }

  return resolve(event);
};

/**
 * Client-side auth utilities
 */
export class AuthClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '/api/auth') {
    this.baseUrl = baseUrl;
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

    // Store tokens in localStorage for client-side use
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('refresh_token', data.refreshToken);

    return data;
  }

  async refresh(): Promise<{ token: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Refresh failed');
    }

    const data = await response.json();

    // Update stored token
    localStorage.setItem('auth_token', data.token);

    return data;
  }

  async logout(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/logout`, {
      method: 'POST',
    });

    // Clear local storage regardless of response
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');

    if (!response.ok) {
      console.warn('Logout request failed, but tokens cleared locally');
    }
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token; // In production, also check expiration
  }
}
