declare module '@atlasit/auth' {
  interface User { id: string; email?: string | null; tenantId?: string | null }
  interface SessionData { id: string; user: User | null; issuedAt: number; expiresAt: number; revokedAt: number | null; ip?: string; userAgent?: string }
  export function createSessionStore(env: any): { create(user: User, opts?: any): Promise<any>; get(id: string): Promise<SessionData | null>; };
}
