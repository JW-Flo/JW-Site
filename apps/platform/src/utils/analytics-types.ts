// Types for analytics events

export type AnalyticsEvent = {
  id?: string;
  timestamp: string;
  event: string;
  page?: string;
  user?: string;
  details?: Record<string, any>;
};
