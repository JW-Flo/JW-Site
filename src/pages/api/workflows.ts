import type { APIRoute } from 'astro';

// In-memory workflows storage (replace with DB in production)
let workflows: any[] = [];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(workflows), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  const workflow = await request.json() as any;
  const id = workflows.length ? Math.max(...workflows.map(w => w.id)) + 1 : 1;
  const newWorkflow = { id, ...workflow };
  workflows.push(newWorkflow);
  return new Response(JSON.stringify(newWorkflow), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const { id, ...updates } = await request.json() as any;
  const idx = workflows.findIndex(w => w.id === id);
  if (idx === -1) return new Response('Not found', { status: 404 });
  workflows[idx] = { ...workflows[idx], ...updates };
  return new Response(JSON.stringify(workflows[idx]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { id } = await request.json() as any;
  workflows = workflows.filter(w => w.id !== id);
  return new Response('Deleted', { status: 204 });
};
