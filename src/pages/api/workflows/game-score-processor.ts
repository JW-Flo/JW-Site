import type { APIRoute } from 'astro';

export const prerender = false;

interface GameScorePayload {
  gameType: string;
  score: number;
  playerName: string;
  sessionId?: string;
}

interface LeaderboardEntry {
  playerName: string;
  score: number;
  timestamp: number;
  gameType: string;
}

// Direct implementation without forwarding to function
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const payload: GameScorePayload = await request.json();
    const { gameType, score, playerName, sessionId } = payload;

    // Validate payload
    if (!gameType || typeof score !== 'number' || !playerName) {
      return new Response(JSON.stringify({
        error: 'Invalid payload: missing gameType, score, or playerName'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate score range
    if (score < 0 || score > 1000000) {
      return new Response(JSON.stringify({
        error: 'Invalid score range',
        message: 'Score must be between 0 and 1,000,000'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sanitize inputs
    const sanitizedPlayer = playerName.trim().slice(0, 20);
    const sanitizedGame = gameType.trim().slice(0, 20);
    const timestamp = Date.now();

    // Get Cloudflare environment from context
    const env = (locals as any).runtime?.env;
    if (!env) {
      throw new Error('Cloudflare environment not available');
    }

    // Update leaderboard in LEADERBOARD KV
    const leaderboardKey = `${sanitizedGame}-leaderboard`;
    let leaderboard: LeaderboardEntry[] = [];
    
    try {
      const existingLeaderboard = await env.LEADERBOARD.get(leaderboardKey);
      if (existingLeaderboard) {
        leaderboard = JSON.parse(existingLeaderboard);
      }
    } catch (e) {
      console.warn('Could not parse existing leaderboard, starting fresh:', e);
    }

    // Add new score
    leaderboard.push({
      playerName: sanitizedPlayer,
      score: score,
      timestamp: timestamp,
      gameType: sanitizedGame
    });

    // Sort by score (highest first) and keep top 10
    leaderboard.sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);

    // Store updated leaderboard
    await env.LEADERBOARD.put(leaderboardKey, JSON.stringify(leaderboard));

    // Update player analytics in ANALYTICS KV
    const playerKey = `player-${sanitizedPlayer}`;
    let playerStats = {
      bestScore: score,
      totalGames: 1,
      lastPlayed: timestamp,
      gamesPlayed: [sanitizedGame]
    };

    try {
      const existingStats = await env.ANALYTICS.get(playerKey);
      if (existingStats) {
        const stats = JSON.parse(existingStats);
        playerStats = {
          bestScore: Math.max(stats.bestScore || 0, score),
          totalGames: (stats.totalGames || 0) + 1,
          lastPlayed: timestamp,
          gamesPlayed: [...new Set([...(stats.gamesPlayed || []), sanitizedGame])]
        };
      }
    } catch (e) {
      console.warn('Could not parse existing player stats, starting fresh:', e);
    }

    // Store updated player stats
    await env.ANALYTICS.put(playerKey, JSON.stringify(playerStats));

    return new Response(JSON.stringify({
      success: true,
      message: 'Score processed successfully',
      leaderboard: leaderboard,
      playerStats: playerStats,
      sessionId: sessionId,
      isHighScore: leaderboard.findIndex(entry => 
        entry.playerName === sanitizedPlayer && entry.score === score
      ) !== -1
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API route error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    message: 'Game Score Processor API',
    methods: ['POST'],
    status: 'operational'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
