-- D1 migration: sessions table for server-side auth
-- Stores opaque sessions and refresh token hashes

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY, -- opaque session id (uuid or random)
  user_id TEXT NOT NULL,
  email TEXT,
  tenant_id TEXT,
  refresh_token_hash TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  ip TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON sessions(revoked_at);
