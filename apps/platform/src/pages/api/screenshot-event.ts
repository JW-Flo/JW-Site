import type { APIRoute } from 'astro';
import { storeScreenshotEvent } from '../../utils/analytics-server';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    // Basic validation
    if (!body || !body.page) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    // Generate event ID and timestamp
    const event = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      user: body.user || 'unknown',
      page: body.page,
      context: body.context || '',
      risk_level: body.risk_level || 'high',
      details: body.details || ''
    };
    await storeScreenshotEvent(event);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || 'Internal error' }), { status: 500 });
  }
};
