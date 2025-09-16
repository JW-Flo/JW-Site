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
    // Get R2 bucket from Cloudflare environment
    const bucket = (locals as any).runtime?.env?.DEMO_BUCKET;
    if (!bucket) {
      return new Response(JSON.stringify({ error: 'R2 bucket not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const stepResult: StepResult = await request.json();
    
    // Create unique key for the step result
    const key = `steps/${stepResult.scenarioId}/${stepResult.stepIndex}-${Date.now()}.json`;
    
    // Save to R2 bucket
    await bucket.put(key, JSON.stringify({
      ...stepResult,
      savedAt: new Date().toISOString()
    }), {
      customMetadata: {
        scenarioId: stepResult.scenarioId,
        stepIndex: stepResult.stepIndex.toString(),
        employeeId: stepResult.employee?.employeeId || 'unknown'
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      key: key,
      message: 'Step result saved to R2' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving step result:', error);
    return new Response(JSON.stringify({ error: 'Failed to save step result' }), {
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

    const scenarioId = url.searchParams.get('scenario');
    if (!scenarioId) {
      return new Response(JSON.stringify({ error: 'Scenario ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // List objects for the scenario
    const objects = await bucket.list({ prefix: `steps/${scenarioId}/` });
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
      steps: results.sort((a: any, b: any) => a.stepIndex - b.stepIndex)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting step results:', error);
    return new Response(JSON.stringify({ error: 'Failed to get step results' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
