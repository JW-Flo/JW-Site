// R2 binding MEDIA expected. Lists first 20 objects.
export const onRequestGet: PagesFunction = async (context) => {
  const { env } = context as any;
  if (!env.MEDIA) return new Response(JSON.stringify({ objects: [] }), { headers: { 'content-type': 'application/json' } });
  const iter = env.MEDIA.list({ limit: 20 });
  const listing = await iter;
  return new Response(JSON.stringify({ objects: listing.objects?.map((o: any) => ({ key: o.key, size: o.size })) || [] }), { headers: { 'content-type': 'application/json' } });
};
