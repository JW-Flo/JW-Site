import type { APIRoute } from 'astro';

interface GameScorePayload {
  gameType: string;
  score: number;
  playerName: string;
  sessionId?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload: GameScorePayload = await request.json();

    // Validate payload
    if (!payload.gameType || typeof payload.score !== 'number' || !payload.playerName) {
      return new Response(JSON.stringify({
        error: 'Invalid payload: missing gameType, score, or playerName'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Forward to the workflow function
    const workflowUrl = new URL(request.url);
    workflowUrl.pathname = '/functions/workflows/game-score-processor';

    const workflowResponse = await fetch(workflowUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!workflowResponse.ok) {
      throw new Error(`Workflow error: ${workflowResponse.status}`);
    }

    const result = await workflowResponse.json();

    return new Response(JSON.stringify(result), {
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
