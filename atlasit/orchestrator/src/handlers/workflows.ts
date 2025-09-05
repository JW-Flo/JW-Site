import { Hono } from 'hono';
import { z } from 'zod';
import { logger, AtlasITError } from '@atlasit/shared';
import { createWorkflow, getWorkflow, listWorkflows, updateWorkflow, deleteWorkflow, WorkflowStep } from '../services/workflowService';

const workflowRoutes = new Hono();

// Request validation schemas
const createWorkflowSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  name: z.string().min(1, 'Workflow name is required'),
  description: z.string().optional(),
  steps: z.array(z.object({
    id: z.string().min(1, 'Step ID is required'),
    type: z.string().min(1, 'Step type is required'),
    config: z.record(z.any()),
    order: z.number(),
  })).min(1, 'At least one step is required'),
  triggers: z.array(z.string()).optional(),
});

const updateWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').optional(),
  description: z.string().optional(),
  steps: z.array(z.object({
    id: z.string().min(1, 'Step ID is required'),
    type: z.string().min(1, 'Step type is required'),
    config: z.record(z.any()),
    order: z.number(),
  })).optional(),
  triggers: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'error']).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

// POST /api/workflows - Create new workflow
workflowRoutes.post('/', async (c: any) => {
  const requestId = crypto.randomUUID();
  const actor = c.get('actor') || 'anonymous';

  try {
    const body = await c.req.json();
    const validatedData = createWorkflowSchema.parse(body);

    logger.info('Creating workflow', {
      requestId,
      actor,
      tenantId: validatedData.tenantId,
      workflowName: validatedData.name,
    });

    const workflow = await createWorkflow(c.env.DB, validatedData as {
      tenantId: string;
      name: string;
      description?: string;
      steps: WorkflowStep[];
      triggers?: string[];
    });

    logger.info('Workflow created successfully', {
      requestId,
      actor,
      workflowId: workflow.id,
      tenantId: validatedData.tenantId,
    });

    return c.json({
      success: true,
      data: workflow,
      requestId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid workflow creation', {
        requestId,
        actor,
        errors: error.errors,
      });

      return c.json({
        success: false,
        error: {
          code: 'WORKFLOW-001',
          message: 'Missing required fields',
          details: error.errors,
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 400);
    }

    if (error instanceof AtlasITError) {
      return c.json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, error.statusCode);
    }

    logger.error('Failed to create workflow', error, { requestId, actor });

    return c.json({
      success: false,
      error: {
        code: 'WORKFLOW-999',
        message: 'Unknown error',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// GET /api/workflows - List workflows for tenant
workflowRoutes.get('/', async (c: any) => {
  const requestId = crypto.randomUUID();
  const actor = c.get('actor') || 'anonymous';
  const tenantId = c.req.query('tenantId');

  if (!tenantId) {
    return c.json({
      success: false,
      error: {
        code: 'WORKFLOW-002',
        message: 'Tenant ID required',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 400);
  }

  try {
    logger.info('Listing workflows', {
      requestId,
      actor,
      tenantId,
    });

    const workflows = await listWorkflows(c.env.DB, tenantId);

    return c.json({
      success: true,
      data: workflows,
      requestId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Failed to list workflows', error, {
      requestId,
      actor,
      tenantId,
    });

    return c.json({
      success: false,
      error: {
        code: 'WORKFLOW-999',
        message: 'Unknown error',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// GET /api/workflows/:id - Get specific workflow
workflowRoutes.get('/:id', async (c: any) => {
  const requestId = crypto.randomUUID();
  const actor = c.get('actor') || 'anonymous';
  const workflowId = c.req.param('id');

  if (!workflowId) {
    return c.json({
      success: false,
      error: {
        code: 'WORKFLOW-003',
        message: 'Workflow ID required',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 400);
  }

  try {
    logger.info('Retrieving workflow', {
      requestId,
      actor,
      workflowId,
    });

    const workflow = await getWorkflow(c.env.DB, workflowId);

    if (!workflow) {
      return c.json({
        success: false,
        error: {
          code: 'WORKFLOW-004',
          message: 'Workflow not found',
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 404);
    }

    return c.json({
      success: true,
      data: workflow,
      requestId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Failed to retrieve workflow', error, {
      requestId,
      actor,
      workflowId,
    });

    return c.json({
      success: false,
      error: {
        code: 'WORKFLOW-999',
        message: 'Unknown error',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// PUT /api/workflows/:id - Update workflow
workflowRoutes.put('/:id', async (c: any) => {
  const requestId = crypto.randomUUID();
  const actor = c.get('actor') || 'anonymous';
  const workflowId = c.req.param('id');

  if (!workflowId) {
    return c.json({
      success: false,
      error: {
        code: 'WORKFLOW-003',
        message: 'Workflow ID required',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 400);
  }

  try {
    const body = await c.req.json();
    const validatedData = updateWorkflowSchema.parse(body);

    logger.info('Updating workflow', {
      requestId,
      actor,
      workflowId,
    });

    const workflow = await updateWorkflow(c.env.DB, workflowId, validatedData as Partial<{
      name: string;
      description: string;
      steps: WorkflowStep[];
      triggers: string[];
      status: 'active' | 'inactive' | 'error';
    }>);

    if (!workflow) {
      return c.json({
        success: false,
        error: {
          code: 'WORKFLOW-004',
          message: 'Workflow not found',
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 404);
    }

    logger.info('Workflow updated successfully', {
      requestId,
      actor,
      workflowId,
    });

    return c.json({
      success: true,
      data: workflow,
      requestId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid workflow update', {
        requestId,
        actor,
        errors: error.errors,
      });

      return c.json({
        success: false,
        error: {
          code: 'WORKFLOW-001',
          message: 'Invalid update data',
          details: error.errors,
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 400);
    }

    logger.error('Failed to update workflow', error, {
      requestId,
      actor,
      workflowId,
    });

    return c.json({
      success: false,
      error: {
        code: 'WORKFLOW-999',
        message: 'Unknown error',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// DELETE /api/workflows/:id - Delete workflow
workflowRoutes.delete('/:id', async (c: any) => {
  const requestId = crypto.randomUUID();
  const actor = c.get('actor') || 'anonymous';
  const workflowId = c.req.param('id');

  if (!workflowId) {
    return c.json({
      success: false,
      error: {
        code: 'WORKFLOW-003',
        message: 'Workflow ID required',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 400);
  }

  try {
    logger.info('Deleting workflow', {
      requestId,
      actor,
      workflowId,
    });

    const success = await deleteWorkflow(c.env.DB, workflowId);

    if (!success) {
      return c.json({
        success: false,
        error: {
          code: 'WORKFLOW-004',
          message: 'Workflow not found',
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 404);
    }

    logger.info('Workflow deleted successfully', {
      requestId,
      actor,
      workflowId,
    });

    return c.json({
      success: true,
      data: { deleted: true },
      requestId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Failed to delete workflow', error, {
      requestId,
      actor,
      workflowId,
    });

    return c.json({
      success: false,
      error: {
        code: 'WORKFLOW-999',
        message: 'Unknown error',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

export { workflowRoutes };
