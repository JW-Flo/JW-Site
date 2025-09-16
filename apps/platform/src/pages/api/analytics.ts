// API endpoint for analytics event ingestion
import type { APIRoute } from 'astro';
import { storeAnalyticsEvent } from '../../utils/analytics-server';
import { AnalyticsEvent } from '../../utils/analytics-types';

export const POST: APIRoute = async ({ request }) => {
  try {
    const event: AnalyticsEvent = await request.json();
    event.timestamp = new Date().toISOString();
    event.id = crypto.randomUUID();
    await storeAnalyticsEvent(event);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 400 });
  }
};
