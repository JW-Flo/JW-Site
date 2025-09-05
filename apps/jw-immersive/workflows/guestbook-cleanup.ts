import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

// Guestbook Cleanup Workflow
// This workflow cleans up old guestbook entries and archives them for analytics

interface Env {
  DB: D1Database;
  ANALYTICS: KVNamespace;
  RATE_LIMIT: KVNamespace;
}

interface CleanupResult {
  cleanedEntries: number;
  totalEntries: number;
  timestamp: string;
}

export const onRequestPost = async (context: any) => {
  const { env } = context;

  try {
    const result = await runCleanupWorkflow(env);
    return new Response(JSON.stringify(result), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    console.error('Cleanup workflow error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};

async function runCleanupWorkflow(env: Env): Promise<CleanupResult> {
  // Step 1: Fetch all guestbook entries
  const { results } = await env.DB.prepare(
    'SELECT id, name, message, created_at FROM entries ORDER BY created_at DESC'
  ).all();

  const entries = results as Array<{
    id: number;
    name: string;
    message: string;
    created_at: string;
  }>;

  // Step 2: Filter entries older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const oldEntries = entries.filter(entry =>
    new Date(entry.created_at) < thirtyDaysAgo
  );

  // Step 3: Archive old entries to KV for analytics
  if (oldEntries.length > 0) {
    const archiveKey = `archived-entries-${Date.now()}`;
    await env.ANALYTICS.put(archiveKey, JSON.stringify(oldEntries));

    // Step 4: Delete old entries from D1
    const ids = oldEntries.map(entry => entry.id);
    await env.DB.prepare(
      `DELETE FROM entries WHERE id IN (${ids.join(',')})`
    ).run();
  }

  // Step 5: Update cleanup statistics
  const statsKey = 'cleanup-stats';
  const currentStats = await env.ANALYTICS.get(statsKey);
  const stats = currentStats ? JSON.parse(currentStats) : {
    totalCleanups: 0,
    totalArchived: 0
  };

  stats.totalCleanups += 1;
  stats.totalArchived += oldEntries.length;
  stats.lastCleanup = new Date().toISOString();

  await env.ANALYTICS.put(statsKey, JSON.stringify(stats));

  return {
    cleanedEntries: oldEntries.length,
    totalEntries: entries.length,
    timestamp: new Date().toISOString()
  };
}
