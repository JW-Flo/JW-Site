export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Use existing MEDIA bucket with JML demo folder
    const bucket = (locals as any).runtime?.env?.MEDIA;
    const db = (locals as any).runtime?.env?.JML_DB;
    
    if (!bucket || !db) {
      return new Response(JSON.stringify({ error: 'Storage not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { sessionId, stepNumber, stepName, system, logs } = await request.json();
    
    // Store step in D1
    await db.prepare(`
      INSERT INTO workflow_steps (session_id, step_number, step_name, system_name, status, execution_log)
      VALUES (?, ?, ?, ?, 'completed', ?)
    `).bind(
      sessionId,
      stepNumber,
      stepName,
      system,
      JSON.stringify(logs)
    ).run();

    // Store detailed logs in R2 under jml-demo folder
    const key = `jml-demo/steps/${sessionId}/${stepNumber}-${stepName.replace(/\s+/g, '-').toLowerCase()}.json`;
    
    await bucket.put(key, JSON.stringify({
      sessionId,
      stepNumber,
      stepName,
      system,
      logs,
      timestamp: new Date().toISOString()
    }));

    return new Response(JSON.stringify({ success: true, key }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving step:', error);
    return new Response(JSON.stringify({ error: 'Failed to save step' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
