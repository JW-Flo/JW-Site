import { handleAgentRequest } from '../../../agent/runtime.js';

export const prerender = false;

export async function POST(context: any) {
  const { request, locals } = context;
  const env = context.locals?.runtime?.env || context.env || (globalThis as any).env || {};
  return handleAgentRequest(request, env, locals);
}

export async function GET() {
  return new Response(JSON.stringify({ ok: false, error: 'use POST' }), { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'POST' } });
}
