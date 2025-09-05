// Cloudflare Pages Function to handle game score processing
// Expected KV bindings: LEADERBOARD, ANALYTICS

interface ScoreSubmission {
  player: string;
  game: string;
  score: number;
  timestamp: number;
}

interface LeaderboardEntry {
  player: string;
  score: number;
  timestamp: number;
}

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context as any;
  
  try {
    const body: ScoreSubmission = await request.json();
    const { player, game, score, timestamp } = body;

    if (!player || !game || typeof score !== 'number') {
      return new Response(JSON.stringify({ 
        error: 'Invalid submission data',
        required: 'player, game, score fields are required'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Validate score (prevent negative scores or impossibly high scores)
    if (score < 0 || score > 1000000) {
      return new Response(JSON.stringify({ 
        error: 'Invalid score range',
        message: 'Score must be between 0 and 1,000,000'
      }), { 
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Sanitize player name
    const sanitizedPlayer = player.trim().slice(0, 20);
    const sanitizedGame = game.trim().slice(0, 20);

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
      player: sanitizedPlayer,
      score: score,
      timestamp: timestamp || Date.now()
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
      lastPlayed: timestamp || Date.now(),
      gamesPlayed: [sanitizedGame]
    };

      try {
        const existingStats = await env.ANALYTICS.get(playerKey);
        if (existingStats) {
          const stats = JSON.parse(existingStats);
          playerStats = {
            bestScore: Math.max(stats.bestScore || 0, score),
            totalGames: (stats.totalGames || 0) + 1,
            lastPlayed: timestamp || Date.now(),
            gamesPlayed: [...new Set([...(stats.gamesPlayed || []), sanitizedGame])]
          };
        }
      } catch (e) {
        console.warn('Could not parse existing player stats, starting fresh:', e);
      }    // Store updated player stats
    await env.ANALYTICS.put(playerKey, JSON.stringify(playerStats));

    return new Response(JSON.stringify({
      success: true,
      message: 'Score processed successfully',
      leaderboard: leaderboard,
      playerStats: playerStats
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('Game score processing error:', error);
    return new Response(JSON.stringify({ 
      error: 'Server error processing score',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

// Optional GET endpoint to retrieve leaderboards
export const onRequestGet: PagesFunction = async (context) => {
  const { env, request } = context as any;
  const url = new URL(request.url);
  const game = url.searchParams.get('game');

  if (!game) {
    return new Response(JSON.stringify({ 
      error: 'Game parameter required',
      usage: '/functions/game-score-processor?game=gamename'
    }), { 
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  try {
    const leaderboardKey = `${game}-leaderboard`;
    const leaderboard = await env.LEADERBOARD.get(leaderboardKey);
    
    return new Response(JSON.stringify({
      game: game,
      leaderboard: leaderboard ? JSON.parse(leaderboard) : []
    }), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('Leaderboard retrieval error:', error);
    return new Response(JSON.stringify({ 
      error: 'Error retrieving leaderboard'
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
