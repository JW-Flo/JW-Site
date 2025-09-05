-- Migration: 001_create_workflows_table.sql
-- Description: Create workflows table for storing workflow definitions
-- Created: 2024-01-01

CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  steps TEXT NOT NULL, -- JSON array of workflow steps
  triggers TEXT, -- JSON array of trigger types
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at);

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_workflows_updated_at
  AFTER UPDATE ON workflows
  FOR EACH ROW
  BEGIN
    UPDATE workflows SET updated_at = datetime('now') WHERE id = NEW.id;
  END;
