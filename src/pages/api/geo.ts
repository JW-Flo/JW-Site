import type { APIRoute } from 'astro';
import { json, methodNotAllowed } from '../../../utils/responses.js';
import { buildIpPrivacyRecord } from '../../utils/ipPrivacy.ts';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  // Get client IP from various headers
  const clientIP = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For') ||
                   request.headers.get('X-Real-IP') ||
                   '127.0.0.1';
  const featureEnabled = process.env.FEATURE_GEO_CLASSIFICATION === 'true';
  let privacy: any = undefined;
  if (featureEnabled) {
    const secret = process.env.GEO_HASH_KEY || 'dev-secret';
    try {
      privacy = await buildIpPrivacyRecord(clientIP, request, secret);
    } catch (e) {
      console.warn('Failed to build IP privacy record', e);
    }
  }
  return json({
    ip: clientIP,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('User-Agent') || 'Unknown',
    featureGeo: featureEnabled,
    ...(privacy ? { ipHash: privacy.ipHash, hashAlgo: privacy.hashAlgo, geo: privacy.geo } : {})
  });
};

export const ALL: APIRoute = async ({ request }) => methodNotAllowed(request.method, ['GET']);
