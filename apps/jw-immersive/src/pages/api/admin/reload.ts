import type { APIRoute } from 'astro';

// NOTE: Removed cross-repo deep imports into Project-AtlasIT which break Cloudflare Pages build.
// Provide lightweight local stubs. Replace with proper internal module or shared package later.
async function reloadScanRuntime(): Promise<any> {
  // Minimal placeholder result indicating no throttling and static snapshot.
  return {
    throttled: false,
    snapshot: { version: 'stub', counts: {} },
    enabledScanIds: [],
  };
}

function registerRoute(_def: any) {
  // No-op in Astro API route context; kept for compatibility.
}

registerRoute({ id: 'admin-reload-app', method: 'POST', path: '/api/admin/reload' });

export const POST: APIRoute = async () => {
  const result = await reloadScanRuntime();
  if (result.throttled) {
    return new Response(
      JSON.stringify({ error: 'RELOAD_TOO_FREQUENT', nextAllowedTs: result.nextAllowedTs }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      version: result.snapshot?.version,
      counts: result.snapshot?.counts,
      enabledScanIds: result.enabledScanIds,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
};
