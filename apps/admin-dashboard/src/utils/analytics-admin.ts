// Utility to fetch analytics events for admin dashboard
export async function fetchAnalyticsEvents(tenantId?: string) {
  const url = tenantId
    ? `/api/analytics?tenantId=${encodeURIComponent(tenantId)}`
    : '/api/analytics';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch analytics events');
  return await res.json();
}
