import type { APIRoute } from 'astro';

// Placeholder session endpoint: always returns no active session during build stabilization.
// NOTE: Real session implementation will be restored when @atlasit/auth package is integrated into this workspace.
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ ok: false, session: null, stub: true }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
  );
};
