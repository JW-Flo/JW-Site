import type { APIRoute } from 'astro';
import { getScreenshotEvents } from '../../utils/analytics-server';

export const GET: APIRoute = async () => {
  const events = await getScreenshotEvents();
  return new Response(JSON.stringify(events), { status: 200 });
};
