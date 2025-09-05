// KV binding VISITS expected (add to wrangler-andrey.toml after creation)
export const onRequestGet: PagesFunction = async (context) => {
  const { env } = context as any;
  // Simple atomic increment using KV (note: KV writes are eventually consistent)
  const key = 'total';
  const currentRaw = await env.VISITS.get(key);
  const current = currentRaw ? parseInt(currentRaw, 10) : 0;
  const next = current + 1;
  await env.VISITS.put(key, String(next));
  return new Response(JSON.stringify({ visits: next }), { headers: { 'content-type': 'application/json' } });
};
