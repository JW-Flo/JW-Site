export const prerender = false;

import type { APIRoute } from 'astro';

interface StepResult {
  scenarioId: string;
  stepIndex: number;
  step: any;
  employee: any;
  timestamp: string;
  logs: any[];
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

    const stepResult: StepResult = await request.json();
    
    // Create unique key for Paycom step result in existing bucket
    const key = `paycom-demo/steps/${stepResult.scenarioId}/${stepResult.stepIndex}-${Date.now()}.json`;
    
    // Enhanced step result with Paycom-specific context
    const paycomStepResult = {
      ...stepResult,
      hrisSystem: 'Paycom',
      complianceNote: 'Paycom does not support XaaS - all integrations are API-based',
      apiIntegration: {
        type: 'REST API',
        authentication: 'OAuth 2.0',
        dataFormat: 'JSON',
        webhookSupport: true,
        realTimeSync: false // Paycom limitation
      },
      savedAt: new Date().toISOString()
    };
    
    // Save to existing R2 bucket under paycom-demo prefix
    await bucket.put(key, JSON.stringify(paycomStepResult), {
      customMetadata: {
        scenarioId: stepResult.scenarioId,
        stepIndex: stepResult.stepIndex.toString(),
        employeeId: stepResult.employee?.employeeId || 'unknown',
        hrisSystem: 'Paycom',
        integrationLimitation: 'no-xaas-support'
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      key: key,
      message: 'Paycom step result saved to existing R2 bucket',
      hrisNote: 'Configured for Paycom API limitations'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving Paycom step result:', error);
    return new Response(JSON.stringify({ error: 'Failed to save Paycom step result' }), {
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

    const scenarioId = url.searchParams.get('scenario');
    if (!scenarioId) {
      return new Response(JSON.stringify({ error: 'Scenario ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // List objects for the Paycom scenario
    const objects = await bucket.list({ prefix: `paycom-demo/steps/${scenarioId}/` });
    const results: any[] = [];

    for (const object of objects.objects) {
      const content = await bucket.get(object.key);
      if (content) {
        const stepData = await content.json();
        results.push(stepData);
      }
    }

    return new Response(JSON.stringify({ 
      scenarioId,
      hrisSystem: 'Paycom',
      integrationNote: 'API-based integration - XaaS not supported',
      steps: results.sort((a: any, b: any) => a.stepIndex - b.stepIndex)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting Paycom step results:', error);
    return new Response(JSON.stringify({ error: 'Failed to get Paycom step results' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
