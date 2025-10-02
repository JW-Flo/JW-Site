import type { APIRoute } from 'astro';
import { registerRoute } from '../../../../../Project-AtlasIT/src/runtime/routes/registerRoute.ts';
import { reloadScanRuntime } from '../../../../../Project-AtlasIT/src/runtime/scans/service.ts';

registerRoute({ id: 'admin-reload-root', method: 'POST', path: '/api/admin/reload' });

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
