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
    // Use existing MEDIA R2 bucket
    const bucket = (locals as any).runtime?.env?.MEDIA;
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'R2 bucket not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const auditTrail: AuditTrail = await request.json();
    
    // Create unique key for Paycom audit trail
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `paycom-demo/audit/${auditTrail.scenarioId}/${auditTrail.employee?.employeeId || 'unknown'}-${timestamp}.json`;
    
    // Enhanced audit trail with Paycom-specific metadata
    const paycomAudit = {
      ...auditTrail,
      hrisSystem: 'Paycom',
      auditId: `paycom-audit-${Date.now()}`,
      savedAt: new Date().toISOString(),
      complianceVersion: '1.0',
      retentionPeriod: '7 years',
      dataClassification: 'internal',
      paycomLimitations: {
        xaasSupport: false,
        apiOnly: true,
        webhookSupport: true,
        realTimeSync: false,
        batchProcessing: true
      },
      auditMetadata: {
        totalExecutionTime: auditTrail.allLogs.length > 0 ? 
          new Date(auditTrail.completionTime).getTime() - new Date(auditTrail.allLogs[auditTrail.allLogs.length - 1].timestamp).getTime() : 0,
        systemsInvolved: [...new Set(auditTrail.allLogs.map((log: any) => log.system))],
        successfulSteps: auditTrail.totalSteps,
        failedSteps: 0, // In demo, all steps succeed
        integrationMethod: 'Paycom API REST endpoints',
        complianceFramework: 'SOC2 Type II'
      }
    };
    
    // Save to existing R2 bucket under paycom-demo prefix
    await bucket.put(key, JSON.stringify(paycomAudit), {
      customMetadata: {
        scenarioId: auditTrail.scenarioId,
        employeeId: auditTrail.employee?.employeeId || 'unknown',
        completionTime: auditTrail.completionTime,
        auditType: 'paycom-jml-workflow',
        hrisSystem: 'Paycom',
        complianceNote: 'API-based integration only'
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      auditKey: key,
      auditId: paycomAudit.auditId,
      hrisSystem: 'Paycom',
      message: 'Paycom audit trail saved for compliance',
      integrationNote: 'Configured for Paycom API limitations - no XaaS support'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving Paycom audit trail:', error);
    return new Response(JSON.stringify({ error: 'Failed to save Paycom audit trail' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const bucket = (locals as any).runtime?.env?.MEDIA;
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'R2 bucket not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const employeeId = url.searchParams.get('employee');
    const scenarioId = url.searchParams.get('scenario');
    
    let prefix = 'paycom-demo/audit/';
    if (scenarioId) {
      prefix += `${scenarioId}/`;
    }

    // List Paycom audit objects
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
      hrisSystem: 'Paycom',
      integrationLimitation: 'No XaaS support - API integration only',
      audits: audits.sort((a: any, b: any) => 
        new Date(b.completionTime).getTime() - new Date(a.completionTime).getTime()
      ),
      totalCount: audits.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting Paycom audit trails:', error);
    return new Response(JSON.stringify({ error: 'Failed to get Paycom audit trails' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
