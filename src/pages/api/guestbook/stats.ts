import type { APIRoute } from 'astro';
import { json, methodNotAllowed } from '../../../utils/responses.js';

export const GET: APIRoute = async () => {
  return json({ total: 0, recent: [] });
};

export const ALL: APIRoute = async ({ request }) => methodNotAllowed(request.method, ['GET']);
