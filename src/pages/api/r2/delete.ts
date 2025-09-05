// DELETE /api/r2/delete - Delete a file from R2
export const onRequestDelete: PagesFunction = async (context) => {
  const { env, request } = context as any;
  if (!env.MEDIA) return new Response(JSON.stringify({ error: 'R2 bucket not bound' }), { status: 500, headers: { 'content-type': 'application/json' } });
  const key = new URL(request.url).searchParams.get('key');
  if (!key) return new Response(JSON.stringify({ error: 'Missing key parameter' }), { status: 400, headers: { 'content-type': 'application/json' } });
  await env.MEDIA.delete(key);
  return new Response(JSON.stringify({ success: true, key }), { headers: { 'content-type': 'application/json' } });
};
