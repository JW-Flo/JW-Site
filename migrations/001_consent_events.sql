-- D1 migration: consent_events table
-- Tracks user consent decisions with minimal data

CREATE TABLE IF NOT EXISTS consent_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  session_id TEXT,
  ip_hash TEXT,          -- truncated hashed IP (no raw IP)
  hash_algo TEXT,        -- metadata for hash method
  geo_country TEXT,
  geo_region TEXT,
  geo_city TEXT,
  user_agent TEXT,
  consent_marketing INTEGER NOT NULL DEFAULT 0,
  consent_analytics INTEGER NOT NULL DEFAULT 0,
  consent_functional INTEGER NOT NULL DEFAULT 1, -- functional defaults to true
  consent_security INTEGER NOT NULL DEFAULT 1,   -- security/category defaults
  version TEXT NOT NULL DEFAULT '1'
);

CREATE INDEX IF NOT EXISTS idx_consent_events_created_at ON consent_events(created_at);
CREATE INDEX IF NOT EXISTS idx_consent_events_ip_hash ON consent_events(ip_hash);
CREATE INDEX IF NOT EXISTS idx_consent_events_session ON consent_events(session_id);
