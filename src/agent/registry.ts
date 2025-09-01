// Tool registry (AGENT-01/AGENT-05)
import { AgentTool } from './types.js';
import { snapshotMetrics, resetAndPersist } from './metrics.js';
import { z } from 'zod';

// Simple schema validator
function validate(input: any, schema?: any): { ok: true } | { ok: false; issues: any[] } {
  if (!schema) return { ok: true };
  // Zod schema path
  if (schema?.safeParse) {
    const r = schema.safeParse(input);
    if (r.success) return { ok: true };
    return { ok: false, issues: r.error.issues.map((i: any) => ({ path: i.path, message: i.message, code: i.code })) };
  }
  // Legacy object schema path
  if (schema.type !== 'object') return { ok: true };
  if (typeof input !== 'object' || input === null) {
    return { ok: false, issues: [{ path: [], message: 'Input must be object', code: 'invalid_type' }] };
  }
  if (schema.required) {
    for (const key of schema.required) {
      if (!(key in input)) return { ok: false, issues: [{ path: [key], message: `Missing required field: ${key}`, code: 'missing_key' }] };
    }
  }
  return { ok: true };
}

const tools: AgentTool[] = [
  {
    name: 'list_tools',
    description: 'List available agent tools (filters admin-only unless super admin).',
    async execute(_input, ctx) {
      // We import lazily to avoid circular (already local) but reuse list from this module
      const all = listTools();
      const filtered = ctx.isSuperAdmin ? all : all.filter(t => !t.superAdminOnly);
      return { ok: true, data: filtered };
    }
  },
  {
    name: 'list_flags',
    description: 'List client-exposed feature flags.',
    async execute(_input, ctx) {
      return { ok: true, data: ctx.flags };
    }
  },
  {
    name: 'start_scan',
    description: 'Initiate a security scan (stub). Returns a fake task id.',
    inputSchema: z.object({ target: z.string().trim().min(1, 'target required') }).strict(),
    async execute(input, ctx) {
      const target = String(input.target || '').trim();
      if (!target) return { ok: false, error: 'Empty target' };
      // Basic host validation (no internal addresses)
      if (/^(localhost|127\.|10\.|192\.168\.)/.test(target)) {
        return { ok: false, error: 'Disallowed target' };
      }
      const taskId = `scan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
      ctx.session.messages.push({ role: 'tool', tool: 'start_scan', content: JSON.stringify({ taskId, target }), ts: Date.now() });
      return { ok: true, data: { taskId, status: 'queued' } };
    }
  },
  {
    name: 'scan_status',
    description: 'Check stub scan status for a task id from start_scan.',
    inputSchema: { type: 'object', required: ['taskId'] },
    async execute(input, _ctx) {
      const taskId = String(input.taskId || '');
      if (!taskId.startsWith('scan_')) return { ok: false, error: 'Unknown task' };
      // Deterministic pseudo status
      const age = Date.now() - parseInt(taskId.split('_')[1], 36);
      let status = 'queued';
      if (age > 4000) status = 'complete';
      else if (age > 1500) status = 'running';
      return { ok: true, data: { taskId, status } };
    }
  },
  {
    name: 'waitlist_count',
    description: 'Return count of waitlist entries (admin only).',
    superAdminOnly: true,
    async execute(_input, ctx) {
      const db = ctx.env.DB as D1Database | undefined;
      if (!db) return { ok: false, error: 'DB unavailable' };
      try {
        const { results } = await db.prepare('SELECT COUNT(*) as c FROM waitlist').all();
        const c = (results?.[0] as any)?.c ?? 0;
        return { ok: true, data: { count: c } };
      } catch (e:any) {
        return { ok: false, error: e.message || 'query failed' };
      }
    }
  },
  {
    name: 'metrics_snapshot',
    description: 'Return current in-memory agent metrics (admin only).',
    superAdminOnly: true,
    outputSchema: z.object({
      startedAt: z.number(),
      toolCalls: z.record(z.number()),
      toolErrors: z.record(z.number()),
      rateLimited: z.record(z.number()),
      validationErrors: z.record(z.number()),
      totalCalls: z.number(),
      totalErrors: z.number(),
      totalRateLimited: z.number(),
      totalValidationErrors: z.number()
    }).strict(),
    async execute() {
      return { ok: true, data: snapshotMetrics() };
    }
  },
  {
    name: 'metrics_reset',
    description: 'Reset in-memory (and persisted if enabled) metrics and return fresh snapshot (admin only).',
    superAdminOnly: true,
    async execute(_input, ctx) {
      const snap = await resetAndPersist(ctx.env);
      return { ok: true, data: snap };
    }
  }
];

export function getTool(name: string): AgentTool | undefined {
  return tools.find(t => t.name === name);
}

export function listTools(): Pick<AgentTool, 'name' | 'description' | 'superAdminOnly'>[] {
  return tools.map(t => ({ name: t.name, description: t.description, superAdminOnly: !!t.superAdminOnly }));
}

export function validateInput(tool: AgentTool, input: any) {
  return validate(input, tool.inputSchema);
}

export function validateOutput(tool: AgentTool, output: any) {
  return validate(output, tool.outputSchema);
}
