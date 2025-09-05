// Game Score Processor Function
// This function processes game scores, updates leaderboards, and generates analytics

interface GameScorePayload {
  gameType: string;
  score: number;
  playerName: string;
  sessionId?: string;
}

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  try {
    const payload: GameScorePayload = await request.json();

    // Validate input
    if (!payload.gameType || typeof payload.score !== 'number' || !payload.playerName) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    const result = await processGameScore(env, payload);

    return new Response(JSON.stringify(result), {
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    console.error('Workflow error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

export const onRequestGet = async () => {
  return new Response(JSON.stringify({
    message: 'Game Score Processor Function',
    methods: ['POST'],
    status: 'operational'
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });
};

async function processGameScore(env: any, payload: GameScorePayload) {
  const { gameType, score, playerName } = payload;
  const timestamp = new Date().toISOString();

  // Step 1: Update leaderboard in KV
  const leaderboardKey = `leaderboard-${gameType}`;
  const currentLeaderboard = await env.LEADERBOARD.get(leaderboardKey);
  const leaderboard = currentLeaderboard ? JSON.parse(currentLeaderboard) : [];

  // Add new score and sort
  leaderboard.push({
    playerName,
    score,
    timestamp
  });

  leaderboard.sort((a: any, b: any) => b.score - a.score);
  leaderboard.splice(10); // Keep only top 10

  await env.LEADERBOARD.put(leaderboardKey, JSON.stringify(leaderboard));

  const isHighScore = leaderboard.some((entry: any) =>
    entry.playerName === playerName && entry.score === score
  );

  // Step 2: Update player statistics in ANALYTICS KV
  const playerKey = `player-${playerName}`;
  const currentStats = await env.ANALYTICS.get(playerKey);
  const stats = currentStats ? JSON.parse(currentStats) : {
    totalGames: 0,
    totalScore: 0,
    bestScore: 0,
    gamesPlayed: {}
  };

  stats.totalGames += 1;
  stats.totalScore += score;
  stats.bestScore = Math.max(stats.bestScore, score);
  stats.gamesPlayed[gameType] = (stats.gamesPlayed[gameType] || 0) + 1;
  stats.lastPlayed = timestamp;

  await env.ANALYTICS.put(playerKey, JSON.stringify(stats));

  // Step 3: Generate daily analytics
  const analyticsKey = `analytics-${new Date().toISOString().split('T')[0]}`;
  const currentAnalytics = await env.ANALYTICS.get(analyticsKey);
  const analytics = currentAnalytics ? JSON.parse(currentAnalytics) : {
    dailyGames: 0,
    dailyScore: 0,
    gameTypes: {}
  };

  analytics.dailyGames += 1;
  analytics.dailyScore += score;
  analytics.gameTypes[gameType] = (analytics.gameTypes[gameType] || 0) + 1;

  await env.ANALYTICS.put(analyticsKey, JSON.stringify(analytics));

  console.log(`Processed score: ${playerName} scored ${score} in ${gameType}`);

  return {
    success: true,
    gameType,
    score,
    playerName,
    isHighScore,
    timestamp,
    leaderboardPosition: leaderboard.findIndex((entry: any) => 
      entry.playerName === playerName && entry.score === score
    ) + 1,
    playerStats: stats
  };
}
