import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }: any) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }
  return {};
};
