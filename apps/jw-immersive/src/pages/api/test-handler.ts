import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    return new Response(JSON.stringify({ ok: true, received: body }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'bad-json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: true, message: 'test handler works' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
