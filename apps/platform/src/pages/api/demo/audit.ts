export const prerender = false;

import type { APIRoute } from 'astro';

interface AuditTrail {
  scenarioId: string;
  employee: any;
  completionTime: string;
  totalSteps: number;
  allLogs: any[];
  stepResults: any;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get R2 bucket from Cloudflare environment
    const bucket = (locals as any).runtime?.env?.DEMO_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'R2 bucket not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const auditTrail: AuditTrail = await request.json();
    
    // Create unique key for the audit trail
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `audit/${auditTrail.scenarioId}/${auditTrail.employee?.employeeId || 'unknown'}-${timestamp}.json`;
    
    // Enhanced audit trail with metadata
    const enhancedAudit = {
      ...auditTrail,
      auditId: `audit-${Date.now()}`,
      savedAt: new Date().toISOString(),
      complianceVersion: '1.0',
      retentionPeriod: '7 years',
      dataClassification: 'internal',
      auditMetadata: {
        totalExecutionTime: auditTrail.allLogs.length > 0 ? 
          new Date(auditTrail.completionTime).getTime() - new Date(auditTrail.allLogs[auditTrail.allLogs.length - 1].timestamp).getTime() : 0,
        systemsInvolved: [...new Set(auditTrail.allLogs.map((log: any) => log.system))],
        successfulSteps: auditTrail.totalSteps,
        failedSteps: 0 // In demo, all steps succeed
      }
    };
    
    // Save to R2 bucket
    await bucket.put(key, JSON.stringify(enhancedAudit), {
      customMetadata: {
        scenarioId: auditTrail.scenarioId,
        employeeId: auditTrail.employee?.employeeId || 'unknown',
        completionTime: auditTrail.completionTime,
        auditType: 'jml-workflow'
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      auditKey: key,
      auditId: enhancedAudit.auditId,
      message: 'Audit trail saved for compliance' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving audit trail:', error);
    return new Response(JSON.stringify({ error: 'Failed to save audit trail' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const bucket = (locals as any).runtime?.env?.DEMO_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'R2 bucket not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const employeeId = url.searchParams.get('employee');
    const scenarioId = url.searchParams.get('scenario');
    
    let prefix = 'audit/';
    if (scenarioId) {
      prefix += `${scenarioId}/`;
    }

    // List audit objects
    const objects = await bucket.list({ prefix });
    const audits: any[] = [];

    for (const object of objects.objects) {
      if (employeeId && !object.key.includes(employeeId)) {
        continue;
      }
      
      const content = await bucket.get(object.key);
      if (content) {
        const auditData = await content.json();
        audits.push({
          key: object.key,
          ...auditData,
          size: object.size,
          uploaded: object.uploaded
        });
      }
    }

    return new Response(JSON.stringify({ 
      audits: audits.sort((a: any, b: any) => 
        new Date(b.completionTime).getTime() - new Date(a.completionTime).getTime()
      ),
      totalCount: audits.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting audit trails:', error);
    return new Response(JSON.stringify({ error: 'Failed to get audit trails' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
