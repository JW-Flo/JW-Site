// GET /api/r2/list - List files in R2
export const onRequestGet: PagesFunction = async (context) => {
  const { env } = context as any;
  if (!env.MEDIA) return new Response(JSON.stringify({ objects: [] }), { headers: { 'content-type': 'application/json' } });
  const iter = env.MEDIA.list({ limit: 20 });
  const listing = await iter;
  return new Response(JSON.stringify({ objects: listing.objects?.map((o: any) => ({ key: o.key, size: o.size })) || [] }), { headers: { 'content-type': 'application/json' } });
};
