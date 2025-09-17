import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  const response = await fetch('/api/auth/sessions', {
    headers: {
      'cache-control': 'no-store',
    },
  });

  if (!response.ok) {
    throw error(response.status, 'Failed to load sessions');
  }

  const payload = (await response.json()) as { sessions?: Array<Record<string, unknown>> };

  return {
    sessions: Array.isArray(payload.sessions) ? payload.sessions : [],
  };
};
