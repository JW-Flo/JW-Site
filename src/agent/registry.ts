// Tool registry (AGENT-01/AGENT-05)
import { AgentTool } from './types.js';

// Simple schema validator
function validate(input: any, schema?: any): string | null {
  if (!schema) return null;
  if (schema.type === 'object') {
    if (typeof input !== 'object' || input === null) return 'Input must be object';
    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in input)) return `Missing required field: ${key}`;
      }
    }
  }
  return null;
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
    inputSchema: { type: 'object', required: ['target'] },
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
  }
];

export function getTool(name: string): AgentTool | undefined {
  return tools.find(t => t.name === name);
}

export function listTools(): Pick<AgentTool, 'name' | 'description' | 'superAdminOnly'>[] {
  return tools.map(t => ({ name: t.name, description: t.description, superAdminOnly: !!t.superAdminOnly }));
}

export function validateInput(tool: AgentTool, input: any): string | null {
  return validate(input, tool.inputSchema);
}
