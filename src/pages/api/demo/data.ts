import type { APIRoute } from 'astro';
import { json } from '../../../utils/responses.js';
import {
  demoUsers,
  onboardingRequests,
  dashboardMetrics,
  activityFeed,
} from '../../../data/demoData';

export const GET: APIRoute = async () => {
  const requestId = crypto.randomUUID();

  return json({
    requestId,
    generatedAt: new Date().toISOString(),
    data: {
      users: demoUsers,
      requests: onboardingRequests,
      metrics: dashboardMetrics,
      activity: activityFeed,
    },
  });
};

export const POST: APIRoute = async () =>
  json({ error: 'Read-only endpoint' }, { status: 405 });
