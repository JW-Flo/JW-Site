-- JML Lifecycle Demo Database Schema
-- Creates tables for Paycom integration and JML workflow tracking

-- Demo sessions table - tracks current demo state
CREATE TABLE IF NOT EXISTS jml_demo_sessions (
    id TEXT PRIMARY KEY DEFAULT 'current',
    scenario_id TEXT NOT NULL, -- 'joiner', 'mover', 'leaver'
    employee_id TEXT NOT NULL,
    current_step_index INTEGER NOT NULL DEFAULT 0,
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    session_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'reset'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_data TEXT -- JSON blob with full state
);

-- Employee records table - stores Paycom employee data
CREATE TABLE IF NOT EXISTS paycom_employees (
    employee_id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    job_title TEXT NOT NULL,
    department TEXT NOT NULL,
    manager_email TEXT,
    employment_type TEXT NOT NULL DEFAULT 'fulltime', -- 'fulltime', 'parttime', 'contractor'
    employment_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'terminated', 'suspended'
    hire_date DATE NOT NULL,
    termination_date DATE NULL,
    paycom_employee_code TEXT UNIQUE, -- Paycom's internal employee identifier
    cost_center TEXT,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- JML workflow executions table - tracks each workflow run
CREATE TABLE IF NOT EXISTS jml_workflow_executions (
    execution_id TEXT PRIMARY KEY,
    scenario_type TEXT NOT NULL, -- 'joiner', 'mover', 'leaver'
    employee_id TEXT NOT NULL,
    workflow_status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
    total_steps INTEGER NOT NULL,
    completed_steps INTEGER NOT NULL DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    execution_duration_ms INTEGER NULL,
    triggered_by TEXT DEFAULT 'demo', -- 'demo', 'paycom_webhook', 'manual'
    FOREIGN KEY (employee_id) REFERENCES paycom_employees(employee_id)
);

-- Individual workflow steps table - tracks each step execution
CREATE TABLE IF NOT EXISTS jml_workflow_steps (
    step_id TEXT PRIMARY KEY,
    execution_id TEXT NOT NULL,
    step_index INTEGER NOT NULL,
    step_name TEXT NOT NULL,
    step_description TEXT NOT NULL,
    target_system TEXT NOT NULL, -- 'paycom', 'okta', 'aws_iam', 'terraform', 'email'
    api_endpoint TEXT,
    api_method TEXT, -- 'GET', 'POST', 'PUT', 'DELETE'
    request_payload TEXT, -- JSON string
    response_data TEXT, -- JSON string
    step_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    execution_time_ms INTEGER NULL,
    error_message TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (execution_id) REFERENCES jml_workflow_executions(execution_id)
);

-- System integrations table - tracks API health and performance
CREATE TABLE IF NOT EXISTS system_integrations (
    system_name TEXT PRIMARY KEY,
    system_type TEXT NOT NULL, -- 'hris', 'identity', 'cloud', 'automation'
    api_base_url TEXT NOT NULL,
    health_status TEXT NOT NULL DEFAULT 'unknown', -- 'healthy', 'degraded', 'down', 'unknown'
    last_health_check DATETIME NULL,
    average_response_time_ms INTEGER NULL,
    success_rate_percentage REAL NULL,
    api_version TEXT,
    supports_webhooks BOOLEAN DEFAULT FALSE,
    webhook_url TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail table - compliance and security tracking
CREATE TABLE IF NOT EXISTS jml_audit_trail (
    audit_id TEXT PRIMARY KEY,
    execution_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'user_created', 'role_assigned', 'access_granted', 'account_disabled'
    action_description TEXT NOT NULL,
    system_name TEXT NOT NULL,
    performed_by TEXT DEFAULT 'system', -- 'system', 'administrator', 'webhook'
    before_state TEXT, -- JSON of state before action
    after_state TEXT, -- JSON of state after action
    compliance_category TEXT, -- 'access_management', 'data_retention', 'audit_logging'
    risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    retention_until DATE NOT NULL, -- 7 years from timestamp for compliance
    FOREIGN KEY (execution_id) REFERENCES jml_workflow_executions(execution_id),
    FOREIGN KEY (employee_id) REFERENCES paycom_employees(employee_id)
);

-- Demo metrics table - real-time dashboard data
CREATE TABLE IF NOT EXISTS demo_metrics (
    metric_id TEXT PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    metric_unit TEXT, -- 'count', 'percentage', 'milliseconds', 'bytes'
    category TEXT NOT NULL, -- 'performance', 'usage', 'compliance', 'security'
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL -- for cleanup of old metrics
);

-- Insert default system integrations
INSERT OR REPLACE INTO system_integrations (
    system_name, system_type, api_base_url, health_status, supports_webhooks, webhook_url
) VALUES 
    ('paycom', 'hris', 'https://api.paycom.com', 'healthy', TRUE, '/api/webhooks/paycom'),
    ('okta', 'identity', 'https://dev-123456.okta.com', 'healthy', TRUE, '/api/webhooks/okta'),
    ('aws_iam', 'cloud', 'https://iam.amazonaws.com', 'healthy', FALSE, NULL),
    ('terraform', 'automation', 'https://terraform.local', 'healthy', FALSE, NULL),
    ('email_service', 'notification', 'https://api.sendgrid.com', 'healthy', FALSE, NULL);

-- Insert demo employee data (Paycom-specific)
INSERT OR REPLACE INTO paycom_employees (
    employee_id, first_name, last_name, email, job_title, department, 
    manager_email, employment_type, hire_date, paycom_employee_code, cost_center, location
) VALUES 
    ('PC001', 'Jordan', 'Miles', 'jordan.miles@atlasit.pro', 'Security Engineer', 'Information Security', 
     'security-lead@atlasit.pro', 'fulltime', '2025-01-15', 'PC-SE-001', 'IT-SEC-100', 'Austin, TX'),
    ('PC002', 'Alex', 'Chen', 'alex.chen@atlasit.pro', 'DevOps Lead', 'Engineering', 
     'engineering-director@atlasit.pro', 'fulltime', '2023-03-10', 'PC-DO-002', 'ENG-OPS-200', 'Remote'),
    ('PC003', 'Sam', 'Taylor', 'sam.taylor@atlasit.pro', 'Marketing Manager', 'Marketing', 
     'marketing-director@atlasit.pro', 'fulltime', '2022-06-15', 'PC-MM-003', 'MKT-GEN-300', 'New York, NY');

-- Update Sam Taylor as terminated employee for leaver demo
UPDATE paycom_employees 
SET employment_status = 'terminated', termination_date = '2025-01-20', updated_at = CURRENT_TIMESTAMP
WHERE employee_id = 'PC003';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jml_executions_employee ON jml_workflow_executions(employee_id);
CREATE INDEX IF NOT EXISTS idx_jml_executions_scenario ON jml_workflow_executions(scenario_type);
CREATE INDEX IF NOT EXISTS idx_jml_executions_status ON jml_workflow_executions(workflow_status);
CREATE INDEX IF NOT EXISTS idx_jml_steps_execution ON jml_workflow_steps(execution_id);
CREATE INDEX IF NOT EXISTS idx_jml_steps_status ON jml_workflow_steps(step_status);
CREATE INDEX IF NOT EXISTS idx_audit_trail_employee ON jml_audit_trail(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON jml_audit_trail(timestamp);
CREATE INDEX IF NOT EXISTS idx_demo_metrics_category ON demo_metrics(category);
CREATE INDEX IF NOT EXISTS idx_demo_metrics_recorded ON demo_metrics(recorded_at);
