import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      parsedBody = { raw: body };
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'API route is working!',
      timestamp: new Date().toISOString(),
      received: parsedBody
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Request processing failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
