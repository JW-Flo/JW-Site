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
    // Use existing D1 database binding
    const db = (locals as any).runtime?.env?.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get current demo state from existing guestbook_demo database
    const result = await db.prepare(`
      SELECT * FROM paycom_demo_states 
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
    console.error('Error getting Paycom demo state:', error);
    return new Response(JSON.stringify({ error: 'Failed to get Paycom demo state' }), {
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
    
    // Create Paycom-specific table if it doesn't exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS paycom_demo_states (
        id TEXT PRIMARY KEY,
        state TEXT NOT NULL,
        paycom_employee_id TEXT,
        workflow_type TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Upsert demo state with Paycom context
    await db.prepare(`
      INSERT OR REPLACE INTO paycom_demo_states (id, state, paycom_employee_id, workflow_type, timestamp)
      VALUES ('current', ?, ?, ?, ?)
    `).bind(
      JSON.stringify(demoState),
      demoState.employee?.employeeId || null,
      demoState.scenario || null,
      new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving Paycom demo state:', error);
    return new Response(JSON.stringify({ error: 'Failed to save Paycom demo state' }), {
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

    await db.prepare(`DELETE FROM paycom_demo_states WHERE id = 'current'`).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error clearing Paycom demo state:', error);
    return new Response(JSON.stringify({ error: 'Failed to clear Paycom demo state' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
