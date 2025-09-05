import { D1Database } from '@cloudflare/workers-types';
import { logger, AtlasITError } from '@atlasit/shared';

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  triggers?: string[];
  status: 'active' | 'inactive' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  type: string;
  config: Record<string, any>;
  order: number;
}

export async function createWorkflow(
  db: D1Database,
  data: {
    tenantId: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
    triggers?: string[];
  }
): Promise<Workflow> {
  const now = new Date().toISOString();
  const workflowId = crypto.randomUUID();

  try {
    logger.info('Creating workflow in database', {
      workflowId,
      tenantId: data.tenantId,
      name: data.name,
    });

    await db.prepare(`
      INSERT INTO workflows (
        id,
        tenant_id,
        name,
        description,
        steps,
        triggers,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      workflowId,
      data.tenantId,
      data.name,
      data.description || null,
      JSON.stringify(data.steps),
      JSON.stringify(data.triggers || []),
      'active',
      now,
      now
    ).run();

    const workflow: Workflow = {
      id: workflowId,
      tenantId: data.tenantId,
      name: data.name,
      description: data.description,
      steps: data.steps,
      triggers: data.triggers,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    logger.info('Workflow created successfully', {
      workflowId,
      tenantId: data.tenantId,
    });

    return workflow;

  } catch (error) {
    logger.error('Failed to create workflow', error, {
      workflowId,
      tenantId: data.tenantId,
    });

    throw new AtlasITError(
      'DB_ERROR',
      'Failed to create workflow',
      500,
      { workflowId, tenantId: data.tenantId }
    );
  }
}

export async function getWorkflow(
  db: D1Database,
  workflowId: string
): Promise<Workflow | null> {
  try {
    logger.info('Retrieving workflow from database', { workflowId });

    const result = await db.prepare(`
      SELECT
        id,
        tenant_id,
        name,
        description,
        steps,
        triggers,
        status,
        created_at,
        updated_at
      FROM workflows
      WHERE id = ?
    `).bind(workflowId).first();

    if (!result) {
      logger.info('Workflow not found', { workflowId });
      return null;
    }

    const workflow: Workflow = {
      id: result.id as string,
      tenantId: result.tenant_id as string,
      name: result.name as string,
      description: result.description as string,
      steps: JSON.parse(result.steps as string),
      triggers: JSON.parse(result.triggers as string),
      status: result.status as Workflow['status'],
      createdAt: result.created_at as string,
      updatedAt: result.updated_at as string,
    };

    logger.info('Workflow retrieved successfully', { workflowId });

    return workflow;

  } catch (error) {
    logger.error('Failed to retrieve workflow', error, { workflowId });

    throw new AtlasITError(
      'DB_ERROR',
      'Failed to retrieve workflow',
      500,
      { workflowId }
    );
  }
}

export async function listWorkflows(
  db: D1Database,
  tenantId: string
): Promise<Workflow[]> {
  try {
    logger.info('Listing workflows for tenant', { tenantId });

    const results = await db.prepare(`
      SELECT
        id,
        tenant_id,
        name,
        description,
        steps,
        triggers,
        status,
        created_at,
        updated_at
      FROM workflows
      WHERE tenant_id = ?
      ORDER BY created_at DESC
    `).bind(tenantId).all();

    const workflows: Workflow[] = results.results.map((result: any) => ({
      id: result.id,
      tenantId: result.tenant_id,
      name: result.name,
      description: result.description,
      steps: JSON.parse(result.steps),
      triggers: JSON.parse(result.triggers),
      status: result.status,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    }));

    logger.info('Workflows listed successfully', {
      tenantId,
      count: workflows.length,
    });

    return workflows;

  } catch (error) {
    logger.error('Failed to list workflows', error, { tenantId });

    throw new AtlasITError(
      'DB_ERROR',
      'Failed to list workflows',
      500,
      { tenantId }
    );
  }
}

export async function updateWorkflow(
  db: D1Database,
  workflowId: string,
  updates: Partial<{
    name: string;
    description: string;
    steps: WorkflowStep[];
    triggers: string[];
    status: Workflow['status'];
  }>
): Promise<Workflow | null> {
  const now = new Date().toISOString();

  try {
    logger.info('Updating workflow in database', { workflowId });

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.steps !== undefined) {
      updateFields.push('steps = ?');
      values.push(JSON.stringify(updates.steps));
    }
    if (updates.triggers !== undefined) {
      updateFields.push('triggers = ?');
      values.push(JSON.stringify(updates.triggers));
    }
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);
    }

    if (updateFields.length === 0) {
      // No updates provided
      return await getWorkflow(db, workflowId);
    }

    updateFields.push('updated_at = ?');
    values.push(now);
    values.push(workflowId); // WHERE clause

    const query = `
      UPDATE workflows
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await db.prepare(query).bind(...values).run();

    logger.info('Workflow updated successfully', { workflowId });

    return await getWorkflow(db, workflowId);

  } catch (error) {
    logger.error('Failed to update workflow', error, { workflowId });

    throw new AtlasITError(
      'DB_ERROR',
      'Failed to update workflow',
      500,
      { workflowId }
    );
  }
}

export async function deleteWorkflow(
  db: D1Database,
  workflowId: string
): Promise<boolean> {
  try {
    logger.info('Deleting workflow from database', { workflowId });

    const result = await db.prepare(`
      DELETE FROM workflows
      WHERE id = ?
    `).bind(workflowId).run();

    const deleted = result.meta.rows_written > 0;

    if (deleted) {
      logger.info('Workflow deleted successfully', { workflowId });
    } else {
      logger.warn('Workflow not found for deletion', { workflowId });
    }

    return deleted;

  } catch (error) {
    logger.error('Failed to delete workflow', error, { workflowId });

    throw new AtlasITError(
      'DB_ERROR',
      'Failed to delete workflow',
      500,
      { workflowId }
    );
  }
}
