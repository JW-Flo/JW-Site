// Test endpoint to verify clientAddress availability
import type { APIContext } from 'astro';

export async function GET({ request, clientAddress }: APIContext) {
  const headers = Array.from(request.headers.entries());
  
  return new Response(JSON.stringify({
    message: 'clientAddress test',
    clientAddress: clientAddress,
    clientAddressType: typeof clientAddress,
    clientAddressExists: !!clientAddress,
    headers: Object.fromEntries(headers),
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
