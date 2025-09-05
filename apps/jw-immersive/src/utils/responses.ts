export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers || {});
  if (!headers.has('content-type')) headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function error(status: number, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ error: message, status, ...extra }, { status });
}

export function notFound(message = 'Not Found'): Response {
  return error(404, message);
}

export function methodNotAllowed(method: string, allowed: string[]): Response {
  return error(405, 'Method Not Allowed', { method, allowed });
}

export function badRequest(message: string, issues?: unknown): Response {
  return error(400, message, issues ? { issues } : {});
}

export function unauthorized(message = 'Unauthorized'): Response {
  return error(401, message);
}

export function tooManyRequests(retryAfterSeconds: number): Response {
  return error(429, 'Too Many Requests', { retryAfter: retryAfterSeconds });
}

export function ok(message = 'ok'): Response {
  return json({ ok: true, message });
}
