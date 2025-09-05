-- D1 migration: waitlist_signups table
-- Stores early access waitlist emails (unique) and minimal metadata

CREATE TABLE IF NOT EXISTS waitlist_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  email TEXT NOT NULL,
  source TEXT,
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT,
  hash_algo TEXT,
  UNIQUE(email)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist_signups(created_at);
