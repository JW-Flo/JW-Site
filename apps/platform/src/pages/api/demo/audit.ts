export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const bucket = (locals as any).runtime?.env?.MEDIA;
    const db = (locals as any).runtime?.env?.JML_DB;
    
    if (!bucket || !db) {
      return new Response(JSON.stringify({ error: 'Storage not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { sessionId, employeeId, actionType, system, details } = await request.json();
    
    // Store audit entry in D1
    await db.prepare(`
      INSERT INTO audit_trails (session_id, employee_id, action_type, system, details)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      sessionId,
      employeeId,
      actionType,
      system,
      JSON.stringify(details)
    ).run();

    // Store detailed audit in R2
    const auditId = `audit-${Date.now()}`;
    const key = `jml-demo/audits/${employeeId}/${auditId}.json`;
    
    await bucket.put(key, JSON.stringify({
      auditId,
      sessionId,
      employeeId,
      actionType,
      system,
      details,
      timestamp: new Date().toISOString(),
      complianceMetadata: {
        retentionPeriod: '7 years',
        dataClassification: 'internal',
        encryptionStatus: 'AES-256'
      }
    }));

    return new Response(JSON.stringify({ success: true, auditId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving audit:', error);
    return new Response(JSON.stringify({ error: 'Failed to save audit' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
