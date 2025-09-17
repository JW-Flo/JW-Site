-- D1 database schema for analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  event TEXT NOT NULL,
  page TEXT,
  user TEXT,
  details TEXT
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  connector_alias TEXT NOT NULL,
  connector_id TEXT NOT NULL,
  connector_version TEXT,
  auth_target TEXT,
  mode TEXT NOT NULL DEFAULT 'simulated',
  status TEXT NOT NULL DEFAULT 'completed',
  duration_ms INTEGER,
  tenant_id TEXT,
  metadata TEXT,
  timestamp TEXT NOT NULL
);

-- Screenshot events: tracks mobile screenshots of sensitive info
CREATE TABLE IF NOT EXISTS screenshot_events (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user TEXT,
  page TEXT,
  context TEXT,
  risk_level TEXT,
  details TEXT
);
