import { Hono } from 'hono';
import { z } from 'zod';
import { logger, AtlasITError } from '@atlasit/shared';
import { executeWorkflow, getExecution, listExecutions, cancelExecution, Execution } from '../services/executionService';

const executionRoutes = new Hono();

// Request validation schemas
const executeWorkflowSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  inputs: z.record(z.any()).optional(),
  trigger: z.string().optional(),
});

// POST /api/executions - Execute workflow
executionRoutes.post('/', async (c: any) => {
  const requestId = crypto.randomUUID();
  const actor = c.get('actor') || 'anonymous';

  try {
    const body = await c.req.json();
    const validatedData = executeWorkflowSchema.parse(body);

    logger.info('Executing workflow', {
      requestId,
      actor,
      workflowId: validatedData.workflowId,
      trigger: validatedData.trigger,
    });

    const execution = await executeWorkflow(
      c.env.DB,
      c.env.EXECUTION_LOGS,
      validatedData.workflowId,
      validatedData.inputs || {},
      validatedData.trigger
    );

    logger.info('Workflow execution started', {
      requestId,
      actor,
      executionId: execution.id,
      workflowId: validatedData.workflowId,
    });

    return c.json({
      success: true,
      data: execution,
      requestId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid workflow execution', {
        requestId,
        actor,
        errors: error.errors,
      });

      return c.json({
        success: false,
        error: {
          code: 'EXECUTION-001',
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
        timestamp: error.statusCode,
      }, error.statusCode);
    }

    logger.error('Failed to execute workflow', error, { requestId, actor });

    return c.json({
      success: false,
      error: {
        code: 'EXECUTION-999',
        message: 'Unknown error',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// GET /api/executions - List executions
executionRoutes.get('/', async (c: any) => {
  const requestId = crypto.randomUUID();
  const actor = c.get('actor') || 'anonymous';
  const workflowId = c.req.query('workflowId');
  const status = c.req.query('status');

  try {
    logger.info('Listing workflow executions', {
      requestId,
      actor,
      workflowId,
      status,
    });

    const executions = await listExecutions(c.env.DB, {
      workflowId,
      status: status as Execution['status'] | undefined,
    });

    return c.json({
      success: true,
      data: executions,
      requestId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Failed to list executions', error, {
      requestId,
      actor,
      workflowId,
    });

    return c.json({
      success: false,
      error: {
        code: 'EXECUTION-999',
        message: 'Unknown error',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// GET /api/executions/:id - Get specific execution
executionRoutes.get('/:id', async (c: any) => {
  const requestId = crypto.randomUUID();
  const actor = c.get('actor') || 'anonymous';
  const executionId = c.req.param('id');

  if (!executionId) {
    return c.json({
      success: false,
      error: {
        code: 'EXECUTION-002',
        message: 'Execution ID required',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 400);
  }

  try {
    logger.info('Retrieving execution', {
      requestId,
      actor,
      executionId,
    });

    const execution = await getExecution(c.env.DB, executionId);

    if (!execution) {
      return c.json({
        success: false,
        error: {
          code: 'EXECUTION-003',
          message: 'Execution not found',
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 404);
    }

    return c.json({
      success: true,
      data: execution,
      requestId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Failed to retrieve execution', error, {
      requestId,
      actor,
      executionId,
    });

    return c.json({
      success: false,
      error: {
        code: 'EXECUTION-999',
        message: 'Unknown error',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// POST /api/executions/:id/cancel - Cancel execution
executionRoutes.post('/:id/cancel', async (c: any) => {
  const requestId = crypto.randomUUID();
  const actor = c.get('actor') || 'anonymous';
  const executionId = c.req.param('id');

  if (!executionId) {
    return c.json({
      success: false,
      error: {
        code: 'EXECUTION-002',
        message: 'Execution ID required',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 400);
  }

  try {
    logger.info('Cancelling execution', {
      requestId,
      actor,
      executionId,
    });

    const success = await cancelExecution(c.env.DB, executionId);

    if (!success) {
      return c.json({
        success: false,
        error: {
          code: 'EXECUTION-003',
          message: 'Execution not found',
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 404);
    }

    logger.info('Execution cancelled successfully', {
      requestId,
      actor,
      executionId,
    });

    return c.json({
      success: true,
      data: { cancelled: true },
      requestId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Failed to cancel execution', error, {
      requestId,
      actor,
      executionId,
    });

    return c.json({
      success: false,
      error: {
        code: 'EXECUTION-999',
        message: 'Unknown error',
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

export { executionRoutes };
