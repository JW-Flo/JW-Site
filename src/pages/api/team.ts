import type { APIRoute } from 'astro';

// In-memory team data for demo (replace with DB in production)
let team = [
  { id: 1, name: 'Alice Example', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob Example', email: 'bob@example.com', role: 'Member' }
];

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify(team), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  const { name, email, role } = await request.json() as any;
  const id = team.length ? Math.max(...team.map(m => m.id)) + 1 : 1;
  const member = { id, name, email, role };
  team.push(member);
  return new Response(JSON.stringify(member), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const { id, name, email, role } = await request.json() as any;
  const idx = team.findIndex(m => m.id === id);
  if (idx === -1) return new Response('Not found', { status: 404 });
  team[idx] = { id, name, email, role };
  return new Response(JSON.stringify(team[idx]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { id } = await request.json() as any;
  team = team.filter(m => m.id !== id);
  return new Response('Deleted', { status: 204 });
};
