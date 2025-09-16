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

    // Get current demo session
    const result = await db.prepare(`
      SELECT 
        scenario_id,
        employee_id,
        current_step_index,
        progress_percentage,
        session_status,
        session_data,
        updated_at
      FROM jml_demo_sessions 
      WHERE id = 'current' 
      ORDER BY updated_at DESC 
      LIMIT 1
    `).first();

    if (!result) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse session data and return structured response
    const sessionData = result.session_data ? JSON.parse(result.session_data) : {};
    
    return new Response(JSON.stringify({
      scenario: result.scenario_id,
      employee: sessionData.employee,
      stepIndex: result.current_step_index,
      progress: result.progress_percentage,
      status: result.session_status,
      timestamp: result.updated_at,
      logs: sessionData.logs || []
    }), {
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
    
    // Upsert demo session with proper Paycom employee data
    await db.prepare(`
      INSERT OR REPLACE INTO jml_demo_sessions (
        id, 
        scenario_id, 
        employee_id, 
        current_step_index, 
        progress_percentage,
        session_status,
        session_data,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      'current',
      demoState.scenario,
      demoState.employee?.employeeId || 'unknown',
      demoState.stepIndex,
      demoState.progress,
      'active',
      JSON.stringify({
        employee: demoState.employee,
        logs: demoState.logs,
        paycomIntegration: true,
        lastUpdated: demoState.timestamp
      }),
      new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Demo state saved to AtlasIT JML database' 
    }), {
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

    await db.prepare(`DELETE FROM jml_demo_sessions WHERE id = 'current'`).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Demo session cleared' 
    }), {
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
