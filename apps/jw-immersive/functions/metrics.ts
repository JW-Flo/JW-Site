// API endpoint: /api/metrics
// Returns live metrics for dashboard widgets
// - gamesProcessed: number (last 24h)
// - guestbookEntries: number (total)
// - systemUptime: string (e.g. '99.9%')
// - avgResponse: string (e.g. '~50ms')
// - workflows: { rateLimiting: boolean, geoAnalytics: boolean, contentManagement: boolean }

// Cloudflare Pages Function: /api/metrics
// Returns live metrics for dashboard widgets
export const onRequestGet = async (context: any) => {
  const { env } = context;
  let gamesProcessed = 0;
  let guestbookEntries = 0;
  // 1. Games Processed (last 24h): count from ANALYTICS KV
  try {
    if (env.ANALYTICS) {
      const today = new Date();
      const key = `analytics-${today.toISOString().split('T')[0]}`;
      const analytics = await env.ANALYTICS.get(key);
      if (analytics) {
        const parsed = JSON.parse(analytics);
        gamesProcessed = parsed.dailyGames || 0;
      }
    }
  } catch {}

  // 2. Guestbook Entries (total): count from D1
  try {
    if (env.DB) {
      const { results } = await env.DB.prepare('SELECT COUNT(*) as count FROM entries').first();
      guestbookEntries = results?.count || 0;
    }
  } catch {}

  // 3. System Uptime (static for now, can be improved)
  const systemUptime = '99.9%';
  // 4. Avg Response (static for now, can be improved)
  const avgResponse = '~50ms';
  // 5. Workflow statuses (static for now, can be improved)
  const workflows = {
    rateLimiting: true,
    geoAnalytics: true,
    contentManagement: true
  };

  return new Response(JSON.stringify({
    gamesProcessed,
    guestbookEntries,
    systemUptime,
    avgResponse,
    workflows
  }), {
    headers: { 'content-type': 'application/json' }
  });
};
