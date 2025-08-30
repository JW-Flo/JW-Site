import type { APIRoute } from 'astro';
import { json, methodNotAllowed } from '../../../utils/responses.js';

export const GET: APIRoute = async ({ request }) => {
  // Get client IP from various headers
  const clientIP = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For') ||
                   request.headers.get('X-Real-IP') ||
                   '127.0.0.1';

  return json({
    ip: clientIP,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('User-Agent') || 'Unknown'
  });
};

export const ALL: APIRoute = async ({ request }) => methodNotAllowed(request.method, ['GET']);
