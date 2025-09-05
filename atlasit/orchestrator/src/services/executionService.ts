import { D1Database, KVNamespace } from '@cloudflare/workers-types';
import { logger, AtlasITError } from '@atlasit/shared';

export interface Execution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  trigger?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionLog {
  id: string;
  executionId: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, any>;
  timestamp: string;
}

export class ExecutionService {
  constructor(
    private readonly db: D1Database,
    private readonly logsKv: KVNamespace
  ) {}

  async executeWorkflow(
    workflowId: string,
    inputs: Record<string, any>,
    trigger?: string
  ): Promise<Execution> {
    const executionId = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      // Create execution record
      const execution: Execution = {
        id: executionId,
        workflowId,
        status: 'pending',
        inputs,
        trigger,
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      // Insert into database
      await this.db.prepare(`
        INSERT INTO executions (
          id, workflow_id, status, inputs, trigger,
          started_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        execution.id,
        execution.workflowId,
        execution.status,
        JSON.stringify(execution.inputs),
        execution.trigger,
        execution.startedAt,
        execution.createdAt,
        execution.updatedAt
      ).run();

      // Log execution start
      await this.logExecution(executionId, 'info', 'Workflow execution started', {
        workflowId,
        trigger,
        inputs,
      });

      // Update status to running
      await this.updateExecutionStatus(executionId, 'running');

      logger.info('Workflow execution created', {
        executionId,
        workflowId,
        trigger,
      });

      return execution;

    } catch (error) {
      logger.error('Failed to create workflow execution', error, {
        executionId,
        workflowId,
      });

      throw new AtlasITError(
        'EXECUTION-001',
        'Failed to create workflow execution',
        500,
        { executionId, workflowId }
      );
    }
  }

  async getExecution(executionId: string): Promise<Execution | null> {
    try {
      const result = await this.db.prepare(`
        SELECT
          id, workflow_id, status, inputs, outputs, error, trigger,
          started_at, completed_at, created_at, updated_at
        FROM executions
        WHERE id = ?
      `).bind(executionId).first();

      if (!result) {
        return null;
      }

      return {
        id: result.id as string,
        workflowId: result.workflow_id as string,
        status: result.status as Execution['status'],
        inputs: JSON.parse(result.inputs as string),
        outputs: result.outputs ? JSON.parse(result.outputs as string) : undefined,
        error: result.error as string | undefined,
        trigger: result.trigger as string | undefined,
        startedAt: result.started_at as string,
        completedAt: result.completed_at as string | undefined,
        createdAt: result.created_at as string,
        updatedAt: result.updated_at as string,
      };

    } catch (error) {
      logger.error('Failed to get execution', error, { executionId });

      throw new AtlasITError(
        'EXECUTION-002',
        'Failed to retrieve execution',
        500,
        { executionId }
      );
    }
  }

  async listExecutions(options: {
    workflowId?: string;
    status?: Execution['status'];
    limit?: number;
    offset?: number;
  } = {}): Promise<Execution[]> {
    try {
      let query = `
        SELECT
          id, workflow_id, status, inputs, outputs, error, trigger,
          started_at, completed_at, created_at, updated_at
        FROM executions
        WHERE 1=1
      `;
      const params: any[] = [];

      if (options.workflowId) {
        query += ' AND workflow_id = ?';
        params.push(options.workflowId);
      }

      if (options.status) {
        query += ' AND status = ?';
        params.push(options.status);
      }

      query += ' ORDER BY created_at DESC';

      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }

      const results = await this.db.prepare(query).bind(...params).all();

      return results.results.map((row: any) => ({
        id: row.id,
        workflowId: row.workflow_id,
        status: row.status,
        inputs: JSON.parse(row.inputs),
        outputs: row.outputs ? JSON.parse(row.outputs) : undefined,
        error: row.error,
        trigger: row.trigger,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

    } catch (error) {
      logger.error('Failed to list executions', error, options);

      throw new AtlasITError(
        'EXECUTION-003',
        'Failed to list executions',
        500,
        options
      );
    }
  }

  async updateExecutionStatus(
    executionId: string,
    status: Execution['status'],
    outputs?: Record<string, any>,
    error?: string
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      const updateData: any = {
        status,
        updated_at: now,
      };

      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        updateData.completed_at = now;
      }

      if (outputs) {
        updateData.outputs = JSON.stringify(outputs);
      }

      if (error) {
        updateData.error = error;
      }

      const setClause = Object.keys(updateData).map(key => `${key.replace('_', '')} = ?`).join(', ');
      const values = Object.values(updateData);

      await this.db.prepare(`
        UPDATE executions
        SET ${setClause}
        WHERE id = ?
      `).bind(...values, executionId).run();

      // Log status change
      await this.logExecution(executionId, 'info', `Execution status changed to ${status}`, {
        status,
        outputs,
        error,
      });

      logger.info('Execution status updated', {
        executionId,
        status,
        outputs: !!outputs,
        error: !!error,
      });

    } catch (error) {
      logger.error('Failed to update execution status', error, {
        executionId,
        status,
      });

      throw new AtlasITError(
        'EXECUTION-004',
        'Failed to update execution status',
        500,
        { executionId, status }
      );
    }
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    try {
      const execution = await this.getExecution(executionId);

      if (!execution) {
        return false;
      }

      if (execution.status === 'completed' || execution.status === 'failed' || execution.status === 'cancelled') {
        throw new AtlasITError(
          'EXECUTION-005',
          'Cannot cancel execution that is already finished',
          400,
          { executionId, status: execution.status }
        );
      }

      await this.updateExecutionStatus(executionId, 'cancelled');

      logger.info('Execution cancelled', { executionId });

      return true;

    } catch (error) {
      if (error instanceof AtlasITError) {
        throw error;
      }

      logger.error('Failed to cancel execution', error, { executionId });

      throw new AtlasITError(
        'EXECUTION-006',
        'Failed to cancel execution',
        500,
        { executionId }
      );
    }
  }

  private async logExecution(
    executionId: string,
    level: ExecutionLog['level'],
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      const logId = crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const log: ExecutionLog = {
        id: logId,
        executionId,
        level,
        message,
        data,
        timestamp,
      };

      // Store in KV for fast retrieval
      const key = `execution:${executionId}:logs`;
      const existingLogs = await this.logsKv.get(key);
      const logs: ExecutionLog[] = existingLogs ? JSON.parse(existingLogs) : [];

      logs.push(log);

      // Keep only last 100 logs per execution
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      await this.logsKv.put(key, JSON.stringify(logs), {
        expirationTtl: 60 * 60 * 24 * 7, // 7 days
      });

    } catch (error) {
      logger.error('Failed to log execution', error, {
        executionId,
        level,
        message,
      });
      // Don't throw - logging failures shouldn't break execution
    }
  }

  async getExecutionLogs(executionId: string): Promise<ExecutionLog[]> {
    try {
      const key = `execution:${executionId}:logs`;
      const logs = await this.logsKv.get(key);

      return logs ? JSON.parse(logs) : [];

    } catch (error) {
      logger.error('Failed to get execution logs', error, { executionId });

      return [];
    }
  }
}

// Convenience functions for direct use
export async function executeWorkflow(
  db: D1Database,
  logsKv: KVNamespace,
  workflowId: string,
  inputs: Record<string, any>,
  trigger?: string
): Promise<Execution> {
  const service = new ExecutionService(db, logsKv);
  return service.executeWorkflow(workflowId, inputs, trigger);
}

export async function getExecution(
  db: D1Database,
  executionId: string
): Promise<Execution | null> {
  const service = new ExecutionService(db, {} as KVNamespace);
  return service.getExecution(executionId);
}

export async function listExecutions(
  db: D1Database,
  options?: {
    workflowId?: string;
    status?: Execution['status'];
    limit?: number;
    offset?: number;
  }
): Promise<Execution[]> {
  const service = new ExecutionService(db, {} as KVNamespace);
  return service.listExecutions(options);
}

export async function cancelExecution(
  db: D1Database,
  executionId: string
): Promise<boolean> {
  const service = new ExecutionService(db, {} as KVNamespace);
  return service.cancelExecution(executionId);
}
