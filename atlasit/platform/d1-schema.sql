-- D1 database schema for analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  event TEXT NOT NULL,
  page TEXT,
  user TEXT,
  details TEXT
);
