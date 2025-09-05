-- Migration: 002_create_executions_table.sql
-- Description: Create executions table for storing workflow execution records
-- Created: 2024-01-01

CREATE TABLE IF NOT EXISTS executions (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  inputs TEXT NOT NULL, -- JSON object of execution inputs
  outputs TEXT, -- JSON object of execution outputs (null if not completed)
  error TEXT, -- Error message if execution failed
  trigger TEXT, -- Trigger that initiated the execution
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT, -- Completion timestamp (null if still running)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_created_at ON executions(created_at);
CREATE INDEX IF NOT EXISTS idx_executions_started_at ON executions(started_at);

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_executions_updated_at
  AFTER UPDATE ON executions
  FOR EACH ROW
  BEGIN
    UPDATE executions SET updated_at = datetime('now') WHERE id = NEW.id;
  END;
