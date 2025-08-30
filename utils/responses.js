// Response utilities for Astro API routes
export function json(data, init) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export function methodNotAllowed(method, allowed) {
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

export function notFound(message = "Not found") {
  return new Response(message, {
    status: 404,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

export function badRequest(message = "Bad request") {
  return new Response(message, {
    status: 400,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

export function serverError(message = "Internal server error") {
  return new Response(message, {
    status: 500,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
