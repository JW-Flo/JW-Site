// Response utilities for Astro API routes
export function json(data: any, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export function methodNotAllowed(method: string, allowed: string[]): Response {
  return new Response(
    `Method ${method} not allowed. Allowed methods: ${allowed.join(", ")}`,
    {
      status: 405,
      headers: {
        Allow: allowed.join(", "),
        "Content-Type": "text/plain",
      },
    }
  );
}

export function notFound(message = "Not found"): Response {
  return new Response(message, {
    status: 404,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

export function badRequest(message = "Bad request"): Response {
  return new Response(message, {
    status: 400,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

export function serverError(message = "Internal server error"): Response {
  return new Response(message, {
    status: 500,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
