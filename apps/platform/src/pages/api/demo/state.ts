export const prerender = false;

import type { APIRoute } from 'astro';

interface DemoState {
  scenario: string;
  employee: any;
  stepIndex: number;
  progress: number;
  timestamp: string;
  logs: any[];
}

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get D1 database from Cloudflare environment
    const db = (locals as any).runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get current demo state
    const result = await db.prepare(`
      SELECT * FROM demo_states 
      WHERE id = 'current' 
      ORDER BY timestamp DESC 
      LIMIT 1
    `).first();

    if (!result) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(JSON.parse(result.state)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting demo state:', error);
    return new Response(JSON.stringify({ error: 'Failed to get demo state' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals as any).runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const demoState: DemoState = await request.json();
    
    // Create table if it doesn't exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS demo_states (
        id TEXT PRIMARY KEY,
        state TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Upsert demo state
    await db.prepare(`
      INSERT OR REPLACE INTO demo_states (id, state, timestamp)
      VALUES ('current', ?, ?)
    `).bind(
      JSON.stringify(demoState),
      new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving demo state:', error);
    return new Response(JSON.stringify({ error: 'Failed to save demo state' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ locals }) => {
  try {
    const db = (locals as any).runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await db.prepare(`DELETE FROM demo_states WHERE id = 'current'`).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error clearing demo state:', error);
    return new Response(JSON.stringify({ error: 'Failed to clear demo state' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
