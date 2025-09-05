// R2 binding MEDIA expected. Uploads an object to the bucket.
export const onRequestPost: PagesFunction = async (context) => {
  const { env, request } = context as any;
  if (!env.MEDIA) return new Response(JSON.stringify({ error: 'R2 bucket not bound' }), { status: 500, headers: { 'content-type': 'application/json' } });

  try {
    const contentType = request.headers.get('content-type') || 'application/octet-stream';
    const key = new URL(request.url).searchParams.get('key');
    if (!key) {
      return new Response(JSON.stringify({ error: 'Missing key parameter' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const body = await request.arrayBuffer();
    if (body.byteLength > MAX_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large. Max 10MB allowed.' }), { status: 413, headers: { 'content-type': 'application/json' } });
    }
    await env.MEDIA.put(key, body, { httpMetadata: { contentType } });
    return new Response(JSON.stringify({ success: true, key }), { headers: { 'content-type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Upload failed', message: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
};
