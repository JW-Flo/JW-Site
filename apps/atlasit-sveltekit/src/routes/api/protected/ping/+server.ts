export const GET = async ({ locals }: any) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ ok: true, user: locals.user }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
