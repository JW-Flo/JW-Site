// Cloudflare Pages Function: returns request geo data
export const onRequestGet: PagesFunction = (context) => {
  const { request } = context;
  // geo info is available via request.cf in Workers runtime
  const cf: any = (request as any).cf || {};
  return new Response(JSON.stringify({
    ip: request.headers.get('cf-connecting-ip'),
    country: cf.country,
    colo: cf.colo,
    city: cf.city,
    asn: cf.asn,
    tlsVersion: cf.tlsVersion
  }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
