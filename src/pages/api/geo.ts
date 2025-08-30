import type { APIRoute } from 'astro';
import { json, methodNotAllowed } from '../../utils/responses.js';

export const GET: APIRoute = async ({ request }) => {
  const cf = (request as any).cf || {};
  return json({ country: cf.country, city: cf.city, colo: cf.colo, asn: cf.asn, remaining: 20 });
};

export const ALL: APIRoute = async ({ request }) => methodNotAllowed(request.method, ['GET']);
