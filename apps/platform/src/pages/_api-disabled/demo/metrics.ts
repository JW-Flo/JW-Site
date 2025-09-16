export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get both D1 and R2 from environment
    const db = (locals as any).runtime?.env?.DB;
    const bucket = (locals as any).runtime?.env?.DEMO_BUCKET;
    
    if (!db || !bucket) {
      return new Response(JSON.stringify({ error: 'Database or bucket not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get current demo state from D1
    let currentDemo = null;
    try {
      const result = await db.prepare(`
        SELECT * FROM demo_states 
        WHERE id = 'current' 
        ORDER BY timestamp DESC 
        LIMIT 1
      `).first();
      
      if (result) {
        currentDemo = JSON.parse(result.state);
      }
    } catch (error) {
      console.log('No current demo state found');
    }

    // Get audit trail statistics from R2
    const auditObjects = await bucket.list({ prefix: 'audit/' });
    const stepObjects = await bucket.list({ prefix: 'steps/' });
    
    // Count scenarios by type
    const scenarioCounts = {
      joiner: 0,
      mover: 0,
      leaver: 0
    };
    
    const employeeCount = new Set();
    
    for (const object of auditObjects.objects) {
      const content = await bucket.get(object.key);
      if (content) {
        const audit = await content.json();
        if (audit.scenarioId && scenarioCounts.hasOwnProperty(audit.scenarioId)) {
          scenarioCounts[audit.scenarioId as keyof typeof scenarioCounts]++;
        }
        if (audit.employee?.employeeId) {
          employeeCount.add(audit.employee.employeeId);
        }
      }
    }

    // Calculate recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let recentAudits = 0;
    let recentSteps = 0;
    
    for (const object of auditObjects.objects) {
      if (object.uploaded && new Date(object.uploaded) > yesterday) {
        recentAudits++;
      }
    }
    
    for (const object of stepObjects.objects) {
      if (object.uploaded && new Date(object.uploaded) > yesterday) {
        recentSteps++;
      }
    }

    // System health metrics
    const systemHealth = {
      hris: { status: 'operational', responseTime: Math.floor(Math.random() * 100) + 50 },
      okta: { status: 'operational', responseTime: Math.floor(Math.random() * 150) + 75 },
      aws: { status: 'operational', responseTime: Math.floor(Math.random() * 200) + 100 },
      terraform: { status: 'operational', responseTime: Math.floor(Math.random() * 300) + 200 }
    };

    const metrics = {
      currentDemo,
      statistics: {
        totalWorkflows: auditObjects.objects.length,
        totalSteps: stepObjects.objects.length,
        uniqueEmployees: employeeCount.size,
        scenarioBreakdown: scenarioCounts,
        recentActivity: {
          last24Hours: {
            workflows: recentAudits,
            steps: recentSteps
          }
        }
      },
      systemHealth,
      lastUpdated: new Date().toISOString(),
      compliance: {
        auditRetention: '7 years',
        dataClassification: 'internal',
        encryptionStatus: 'AES-256',
        backupStatus: 'automated'
      }
    };

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error getting demo metrics:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get demo metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
