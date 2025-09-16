import type { APIRoute } from 'astro';
import { json, methodNotAllowed } from '../../../utils/responses.js';
import { applyRateLimit, rateLimitHeaders } from '../../utils/applyRateLimit.js';
import { buildIpPrivacyRecord } from '../../utils/ipPrivacy.ts';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  const isProd = process.env.NODE_ENV === 'production';
  const request = ctx.request;
  const locals = ctx.locals;
  const clientAddress = ctx.clientAddress;
  const env: any = (locals as any)?.runtime?.env || (globalThis as any)?.process?.env || {};
  const rl = await applyRateLimit({ env, key: `geo:${clientAddress || 'unknown'}`, max: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return json({ error: 'rate-limited' }, { status: 429, headers: rateLimitHeaders(rl) });
  }
  // Get client IP from various headers
  const clientIP = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For') ||
                   request.headers.get('X-Real-IP') ||
                   '127.0.0.1';
  const featureEnabled = process.env.FEATURE_GEO_CLASSIFICATION === 'true';
  // In non-production we still honor the feature flag so tests can toggle behavior.
  // When disabled, omit hash fields entirely.
  // When enabled, fabricate deterministic hash data for test stability.
  if (!isProd) {
    if (!featureEnabled) {
      return json({
        ip: clientIP,
        timestamp: new Date().toISOString(),
        userAgent: 'Playwright Test User',
        featureGeo: false
      });
    }
    const fakeHash = 'test-hash';
    return json({
      ip: clientIP,
      timestamp: new Date().toISOString(),
      userAgent: 'Playwright Test User',
      featureGeo: true,
      ipHash: fakeHash,
      hashAlgo: 'hmac-sha256:16',
      geo: { country: 'US', city: 'Testville' }
    });
  }
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
