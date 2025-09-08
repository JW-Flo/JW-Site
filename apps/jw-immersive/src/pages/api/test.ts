import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
  try {
    return new Response(JSON.stringify({ 
      message: 'Test API working',
      timestamp: new Date().toISOString() 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Test API failed',
      details: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
