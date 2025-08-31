import type { APIRoute } from 'astro';

export const prerender = false;

interface GuestbookEntry {
  name: string;
  message: string;
  turnstileToken: string;
}

async function verifyTurnstile(token: string, secret: string) {
  const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ response: token, secret }),
  });
  const data = await resp.json() as any;
  return data && data.success === true;
}

async function verifyGameScore(env: any, playerName: string, minimumScore: number = 100) {
  try {
    // Check if player has achieved minimum score in any game
    const playerKey = `player-${playerName}`;
    const playerStats = await env.ANALYTICS.get(playerKey);

    if (!playerStats) {
      return { valid: false, reason: 'No game scores found. Play a game first!' };
    }

    const stats = JSON.parse(playerStats);
    const hasValidScore = stats.bestScore >= minimumScore;

    return {
      valid: hasValidScore,
      reason: hasValidScore ? null : `Minimum score of ${minimumScore} required. Your best: ${stats.bestScore}`,
      playerStats: stats
    };
  } catch (error) {
    console.error('Error verifying game score:', error);
    return { valid: false, reason: 'Error verifying game score' };
  }
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    if (!env || !env.DB) {
      throw new Error('Database not available');
    }

    const { results } = await env.DB.prepare('SELECT id, name, message, created_at FROM entries ORDER BY id DESC LIMIT 25').all();
    
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('GET guestbook error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to load entries',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const env = (locals as any).runtime?.env;
    if (!env) {
      throw new Error('Cloudflare environment not available');
    }

    const body: GuestbookEntry = await request.json();
    const name = (body.name || 'Anon').toString().slice(0, 40);
    const message = (body.message || '').toString().slice(0, 500);
    const token = body.turnstileToken;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Empty message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!token || !env.TURNSTILE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Missing captcha' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify game score requirement
    const scoreVerification = await verifyGameScore(env, name, 100); // Require minimum 100 points
    if (!scoreVerification.valid) {
      return new Response(JSON.stringify({
        error: 'Game score requirement not met',
        reason: scoreVerification.reason
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify Turnstile
    const ok = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY);
    if (!ok) {
      return new Response(JSON.stringify({ error: 'Bot check failed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert into database
    const now = Date.now();
    await env.DB.prepare('INSERT INTO entries (name, message, created_at) VALUES (?1, ?2, ?3)')
      .bind(name, message, now)
      .run();

    return new Response(JSON.stringify({
      ok: true,
      message: 'Entry added successfully!',
      playerStats: scoreVerification.playerStats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('POST guestbook error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
