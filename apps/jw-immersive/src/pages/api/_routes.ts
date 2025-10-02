import type { APIRoute } from 'astro';
import { getRegisteredRoutes } from '../../../../../../Project-AtlasIT/src/runtime/routes/registerRoute.js';

export const GET: APIRoute = async () => {
  const routes = getRegisteredRoutes();
  return new Response(JSON.stringify(routes), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
