// R2 binding MEDIA expected. Downloads an object from the bucket.
export const onRequestGet: PagesFunction = async (context) => {
  const { env, request } = context as any;
  if (!env.MEDIA) return new Response('R2 bucket not bound', { status: 500 });
  const key = new URL(request.url).searchParams.get('key');
  if (!key) return new Response('Missing key parameter', { status: 400 });
  const object = await env.MEDIA.get(key);
  if (!object) return new Response('Object not found', { status: 404 });
  const headers = new Headers();
  if (object.httpMetadata?.contentType) headers.set('content-type', object.httpMetadata.contentType);
  return new Response(object.body, { headers });
};
