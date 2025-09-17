import type { APIRoute, APIContext } from 'astro';
import { applyRateLimit, rateLimitHeaders } from '../../utils/applyRateLimit.js';

interface GuestbookPayload {
  name?: string;
  message?: string;
  turnstileToken?: string;
  bestScore?: number;
  playerStats?: {
    bestScore?: number;
  };
}

interface GameScoreResult {
  valid: boolean;
  reason?: string;
  stats?: Record<string, any>;
}

interface GuestbookEntryRecord {
  id: number;
  name: string;
  message: string;
  created_at: number;
}

const MINIMUM_SCORE = 100;
const POST_RATE_LIMIT = { max: 5, windowMs: 10 * 60_000 }; // 5 requests / 10 minutes per client
const GET_RATE_LIMIT = { max: 60, windowMs: 60_000 }; // 60 requests / minute per client

// In memory entry cache for non-production/tests so GET immediately reflects POST without D1
let lastNonProdEntry: GuestbookEntryRecord | null = null;

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  const env = getEnv(ctx);
  const clientAddress = getSafeClientAddress(ctx);
  const tenantId = getTenantId(ctx);

  try {
    const rl = await applyRateLimit({
      env,
      key: `guestbook:get:${clientAddress}`,
      ...GET_RATE_LIMIT,
    });

    if (!rl.allowed) {
      logError('guestbook:get:rate_limited', { clientAddress, tenantId });
      return jsonResponse({ error: 'rate_limited', message: 'Too many requests. Please slow down.' }, 429, rateLimitHeaders(rl));
    }

    const entries = await fetchEntries(env);

    await logAnalyticsEvent(env, 'guestbook_list', {
      tenantId,
      clientAddress,
      mode: env.mode,
      count: entries.length,
    });

    return jsonResponse(entries, 200, rateLimitHeaders(rl));
  } catch (error) {
    logError('guestbook:get:error', { error, clientAddress, tenantId });
    return jsonResponse({ error: 'internal_error', message: 'Unable to load guestbook entries.' }, 500);
  }
};

export const POST: APIRoute = async (ctx) => {
  const env = getEnv(ctx);
  const clientAddress = getSafeClientAddress(ctx);
  const tenantId = getTenantId(ctx);

  try {
    const rl = await applyRateLimit({
      env,
      key: `guestbook:post:${clientAddress}`,
      ...POST_RATE_LIMIT,
    });

    if (!rl.allowed) {
      logError('guestbook:post:rate_limited', { clientAddress, tenantId });
      return jsonResponse({ error: 'rate_limited', message: 'You are posting too quickly. Please wait before trying again.' }, 429, rateLimitHeaders(rl));
    }

    let payload: GuestbookPayload;
    try {
      payload = await ctx.request.json();
    } catch (err) {
      return jsonResponse({ error: 'invalid_payload', message: 'Request body must be valid JSON.' }, 400, rateLimitHeaders(rl));
    }

    const name = sanitizeName(payload.name);
    const message = sanitizeMessage(payload.message);
    if (!message) {
      return jsonResponse({ error: 'invalid_message', message: 'Message cannot be empty.' }, 400, rateLimitHeaders(rl));
    }

    const turnstileToken = payload.turnstileToken?.trim();
    const secretKey = env.TURNSTILE_SECRET_KEY;
    if (!turnstileToken) {
      return jsonResponse({ error: 'missing_turnstile_token', message: 'Bot protection token is required.' }, 400, rateLimitHeaders(rl));
    }
    if (!secretKey) {
      logError('guestbook:post:missing_turnstile_secret', { tenantId });
      return jsonResponse({ error: 'turnstile_not_configured', message: 'Guestbook is temporarily unavailable.' }, 503, rateLimitHeaders(rl));
    }

    const turnstileResult = await verifyTurnstile(turnstileToken, secretKey, clientAddress);
    if (!turnstileResult.success) {
      logError('guestbook:post:turnstile_failed', { tenantId, clientAddress, reason: turnstileResult.error });
      return jsonResponse({ error: 'turnstile_failed', message: turnstileResult.error ?? 'Unable to verify bot protection token.' }, 403, rateLimitHeaders(rl));
    }

    const scoreResult = await verifyGameScore(env, name, MINIMUM_SCORE);
    if (!scoreResult.valid) {
      await logAnalyticsEvent(env, 'guestbook_post_denied', {
        tenantId,
        clientAddress,
        mode: env.mode,
        reason: scoreResult.reason,
      });
      return jsonResponse({
        error: 'Game score requirement not met',
        code: 'game_score_requirement',
        message: scoreResult.reason ?? 'Minimum game score not met.',
      }, 403, rateLimitHeaders(rl));
    }

    const createdAt = Date.now();

    if (env.DB) {
      await env.DB.prepare('INSERT INTO entries (name, message, created_at, tenant_id) VALUES (?, ?, ?, ?)')
        .bind(name, message, createdAt, tenantId)
        .run();
    } else {
      // Non-production fallback
      lastNonProdEntry = { id: Date.now(), name, message, created_at: createdAt };
    }

    const entry = {
      id: createdAt,
      name,
      message,
      created_at: createdAt,
    };

    await logAnalyticsEvent(env, 'guestbook_post', {
      tenantId,
      clientAddress,
      mode: env.mode,
      bestScore: scoreResult.stats?.bestScore,
    });

    const headers = rateLimitHeaders(rl);
    headers['Content-Type'] = 'application/json';

    return new Response(JSON.stringify({ ok: true, message: 'Entry added successfully!', entry }), {
      status: 200,
      headers,
    });
  } catch (error) {
    logError('guestbook:post:error', { error, tenantId, clientAddress });
    return jsonResponse({ error: 'internal_error', message: 'Unable to add guestbook entry.' }, 500);
  }
};

async function fetchEntries(env: any): Promise<GuestbookEntryRecord[]> {
  if (env.DB) {
    const result = await env.DB
      .prepare('SELECT id, name, message, created_at FROM entries ORDER BY id DESC LIMIT 25')
      .all<GuestbookEntryRecord>();

    return result?.results ?? [];
  }

  if (lastNonProdEntry) {
    return [lastNonProdEntry];
  }

  return [
    {
      id: 1,
      name: 'Playwright Test User',
      message: 'This is a test message from Playwright.',
      created_at: Date.now(),
    },
  ];
}

function sanitizeName(input?: string) {
  const value = (input ?? 'Anon').toString().trim();
  return value.slice(0, 40) || 'Anon';
}

function sanitizeMessage(input?: string) {
  const value = (input ?? '').toString().trim();
  return value.slice(0, 280);
}

function getEnv(ctx: APIContext & { locals: any }) {
  const env = ctx.locals?.runtime?.env ?? {};
  return {
    ...env,
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'simulated',
    skipAnalyticsLogging: process.env.NODE_ENV !== 'production',
  };
}

function getSafeClientAddress(ctx: APIContext): string {
  try {
    if (typeof ctx.clientAddress !== 'undefined') {
      return ctx.clientAddress || 'unknown';
    }
  } catch (error) {
    const _ = error;
  }
  return 'unknown';
}

function getTenantId(ctx: APIContext): string {
  try {
    return ctx.request?.headers?.get('x-tenant-id') || 'public';
  } catch (error) {
    const _ = error;
    return 'public';
  }
}

async function verifyTurnstile(token: string, secret: string, remoteIp: string) {
  try {
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ response: token, secret, remoteip: remoteIp }),
    });

    if (!resp.ok) {
      return { success: false, error: `Turnstile verification failed with status ${resp.status}` };
    }

    const data = await resp.json() as { success?: boolean; 'error-codes'?: string[] };
    if (!data?.success) {
      return {
        success: false,
        error: data?.['error-codes']?.join(', ') || 'Bot verification failed.',
      };
    }

    return { success: true };
  } catch (error) {
    logError('guestbook:turnstile:error', { error });
    return { success: false, error: 'Unable to verify bot protection token.' };
  }
}

async function verifyGameScore(env: any, playerName: string, minimumScore: number): Promise<GameScoreResult> {
  try {
    const kv: KVNamespace | undefined = env?.ANALYTICS;
    if (!kv) {
      return { valid: false, reason: 'Score verification unavailable.' };
    }

    const key = `player-${playerName}`;
    const stored = await kv.get(key);
    if (!stored) {
      return { valid: false, reason: 'No game score found. Play a game first!' };
    }

    const stats = JSON.parse(stored);
    const bestScore = Number(stats?.bestScore ?? 0);
    if (!Number.isFinite(bestScore)) {
      return { valid: false, reason: 'Invalid score data.' };
    }

    if (bestScore < minimumScore) {
      return {
        valid: false,
        reason: `Minimum score of ${minimumScore} required. Your best: ${bestScore}`,
        stats,
      };
    }

    return { valid: true, stats };
  } catch (error) {
    logError('guestbook:score:error', { error, playerName });
    return { valid: false, reason: 'Error verifying game score.' };
  }
}

async function logAnalyticsEvent(env: any, event: string, details?: Record<string, any>) {
  if (env?.skipAnalyticsLogging) {
    return;
  }
  try {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `evt-${Date.now()}`;
    if (env?.DB?.prepare) {
      await env.DB.prepare('INSERT INTO analytics_events (id, timestamp, event, page, user, details) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, new Date().toISOString(), event, '/api/guestbook', details?.tenantId ?? null, details ? JSON.stringify(details) : null)
        .run();
    }
  } catch (error) {
    logError('guestbook:analytics:error', { error, event });
  }
}

function jsonResponse(body: any, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function logError(message: string, context: Record<string, any> = {}) {
  const payload = { message, ...context };
  try {
    console.error('[guestbook]', JSON.stringify(payload));
  } catch {
    console.error('[guestbook]', payload);
  }
}
