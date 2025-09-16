export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get JML demo database
    const db = (locals as any).runtime?.env?.JML_DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'JML database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get current demo session
    const result = await db.prepare(`
      SELECT * FROM demo_sessions 
      WHERE status = 'in_progress' 
      ORDER BY started_at DESC 
      LIMIT 1
    `).first();

    if (!result) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(result), {
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = (locals as any).runtime?.env?.JML_DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'JML database not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { scenario, employee } = await request.json();
    
    // Create demo session
    const sessionId = `demo-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    await db.prepare(`
      INSERT INTO demo_sessions (id, scenario_type, employee_id, employee_name, department)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      sessionId,
      scenario,
      employee.employeeId,
      `${employee.firstName} ${employee.lastName}`,
      employee.department
    ).run();

    return new Response(JSON.stringify({ sessionId, success: true }), {
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
