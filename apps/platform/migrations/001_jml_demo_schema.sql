-- JML Demo Database Schema
-- Simple, functional tables for demo data only

-- Demo sessions to track individual demo runs
CREATE TABLE IF NOT EXISTS demo_sessions (
    id TEXT PRIMARY KEY,
    scenario_type TEXT NOT NULL, -- 'joiner', 'mover', 'leaver'
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    department TEXT NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status TEXT DEFAULT 'in_progress' -- 'in_progress', 'completed', 'failed'
);

-- Simple workflow steps tracking
CREATE TABLE IF NOT EXISTS workflow_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    system_name TEXT NOT NULL, -- 'Paycom', 'Okta', 'AWS', etc.
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    execution_log TEXT, -- JSON string of logs
    FOREIGN KEY (session_id) REFERENCES demo_sessions(id)
);

-- Simple audit trail for compliance
CREATE TABLE IF NOT EXISTS audit_trails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'create_user', 'update_permissions', 'deactivate_user'
    system TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT, -- JSON string with action details
    FOREIGN KEY (session_id) REFERENCES demo_sessions(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_demo_sessions_started ON demo_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_session ON workflow_steps(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_session ON audit_trails(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_employee ON audit_trails(employee_id);
