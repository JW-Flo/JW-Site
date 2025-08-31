import type { APIRoute } from 'astro';
import { json, methodNotAllowed } from '../../../utils/responses.js';

export const prerender = false;

export const GET: APIRoute = async () => {
  return json({ total: 0, recent: [] });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: unknown = await request.json();
    const { playerName } = body as { playerName?: string };
    
    if (!playerName) {
      return json({ error: 'Player name required' }, { status: 400 });
    }

    // For now, check localStorage as fallback until Cloudflare KV is fully implemented
    // This will be replaced with KV lookup in production
    return json({
      playerFound: false,
      bestScore: 0,
      message: 'Player score checking via Cloudflare KV not yet implemented. Please play games to establish scores.'
    });
    
  } catch (error) {
    console.error('Error processing player score request:', error);
    return json({ error: 'Invalid request' }, { status: 400 });
  }
};

export const ALL: APIRoute = async ({ request }) => methodNotAllowed(request.method, ['GET', 'POST']);
