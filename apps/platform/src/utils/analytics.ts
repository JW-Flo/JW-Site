// Simple analytics utility for user experience tracking
// Extend with real analytics provider integration as needed


export async function trackEvent(event: string, details?: Record<string, any>) {
  // For demo: log to console, but in production send to analytics endpoint
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('atlasit-analytics', { detail: { event, ...details } }));
    // Send to API for persistent storage
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, details, page: window.location.pathname })
      });
    } catch (err) {
      // Fail silently for now
    }
  }
  console.log(`[Analytics] Event: ${event}`, details || {});
}

export function trackPageView(page: string) {
  trackEvent('page_view', { page });
}

export function trackUserAction(action: string, details?: Record<string, any>) {
  trackEvent('user_action', { action, ...details });
}
