// D1 binding DB expected; Turnstile secret TURNSTILE_SECRET_KEY as env var.
// KV bindings: LEADERBOARD, ANALYTICS, RATE_LIMIT
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

export const onRequestGet: PagesFunction = async (context) => {
  const { env } = context as any;
  const { results } = await env.DB.prepare('SELECT id, name, message, created_at FROM entries ORDER BY id DESC LIMIT 25').all();
  return new Response(JSON.stringify(results), { headers: { 'content-type': 'application/json' } });
};

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context as any;
  try {
    const body = await request.json();
    const name = (body.name || 'Anon').toString().slice(0, 40);
    const message = (body.message || '').toString().slice(0, 500);
    const token = body.turnstileToken;

    if (!message) return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400 });

    if (!token || !env.TURNSTILE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Missing captcha' }), { status: 400 });
    }

    // NEW: Verify game score requirement
    const scoreVerification = await verifyGameScore(env, name, 100); // Require minimum 100 points
    if (!scoreVerification.valid) {
      return new Response(JSON.stringify({
        error: 'Game score requirement not met',
        reason: scoreVerification.reason
      }), { status: 403 });
    }

    const ok = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY);
    if (!ok) return new Response(JSON.stringify({ error: 'Bot check failed' }), { status: 403 });

    const now = Date.now();
    await env.DB.prepare('INSERT INTO entries (name, message, created_at) VALUES (?1, ?2, ?3)')
      .bind(name, message, now)
      .run();

    return new Response(JSON.stringify({
      ok: true,
      message: 'Entry added successfully!',
      playerStats: scoreVerification.playerStats
    }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Invalid JSON', detail: e?.message }), { status: 400 });
  }
};
