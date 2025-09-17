import type { APIRoute } from 'astro';

interface WorkflowRunRow {
  id: string;
  workflow_name: string;
  connector_alias: string;
  connector_id: string;
  connector_version: string | null;
  auth_target: string | null;
  mode: string;
  status: string;
  duration_ms: number | null;
  tenant_id: string | null;
  metadata: string | null;
  timestamp: string;
}

const FALLBACK_RUNS = [
  {
    id: 'sim-001',
    workflow_name: 'Advanced User Onboarding',
    connector_alias: 'office365',
    connector_id: 'microsoft-365',
    connector_version: '1.0.0',
    auth_target: 'simulation://office365/default',
    mode: 'simulated',
    status: 'completed',
    duration_ms: 2800,
    tenant_id: 'demo-tenant',
    metadata: JSON.stringify({ executionId: 'exec_simulated_001' }),
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'sim-002',
    workflow_name: 'Compliance Audit Workflow',
    connector_alias: 'jira',
    connector_id: 'jira-cloud',
    connector_version: '1.0.0',
    auth_target: 'simulation://jira/default',
    mode: 'simulated',
    status: 'completed',
    duration_ms: 9500,
    tenant_id: 'audit-demo',
    metadata: JSON.stringify({ changeTicket: 'OPS-101' }),
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

export const GET: APIRoute = async ({ request }) => {
  const db = (request as any).env?.D1 || (globalThis as any).D1;
  if (!db) {
    return new Response(
      JSON.stringify({ runs: FALLBACK_RUNS, source: 'fallback' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const result = await db
      .prepare('SELECT * FROM workflow_runs ORDER BY timestamp DESC LIMIT 50')
      .all<WorkflowRunRow>();

    const runs = (result?.results || []).map((row) => ({
      id: row.id,
      workflowName: row.workflow_name,
      connectorAlias: row.connector_alias,
      connectorId: row.connector_id,
      connectorVersion: row.connector_version,
      authTarget: row.auth_target,
      mode: row.mode,
      status: row.status,
      durationMs: row.duration_ms,
      tenantId: row.tenant_id,
      metadata: row.metadata ? safeParse(row.metadata) : undefined,
      timestamp: row.timestamp,
    }));

    return new Response(
      JSON.stringify({ runs, source: 'd1' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error), runs: FALLBACK_RUNS, source: 'fallback-error' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
};

function safeParse(value: string) {
  try {
    return JSON.parse(value);
  } catch (err) {
    return value;
  }
}
