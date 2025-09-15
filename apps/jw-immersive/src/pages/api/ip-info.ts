// API endpoint for IP information
// This provides a CORS-friendly way to get visitor IP info


import type { APIContext } from 'astro';

export async function GET(_ctx: APIContext) {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    // Always return safe fallback/test data in test/dev/static mode
    return new Response(JSON.stringify({
      ip: '127.0.0.1',
      secure: true,
      protocol: 'HTTPS',
      userAgent: 'Playwright Test User',
      isBot: false,
      timestamp: new Date().toISOString(),
      location: { country: 'US', city: 'Testville', timezone: 'UTC' },
      network: { asn: 'AS12345', datacenter: 'TEST' },
      privacy: { vpnDetected: false, proxyDetected: false, torDetected: false }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
  // ...existing production code (not shown)...
  return new Response(JSON.stringify({ error: 'Not implemented in this environment.' }), { status: 501 });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
