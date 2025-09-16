import { Router, Request, Response } from 'express';
import { hrisService, HRISWebhookPayload } from '../services/hrisService';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/hris/webhook - HRIS webhook endpoint
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const payload: HRISWebhookPayload = req.body;
    
    logger.info('Received HRIS webhook', { 
      eventType: payload.eventType, 
      employeeId: payload.employee?.employeeId 
    });

    const result = await hrisService.processWebhookEvent(payload);
    
    res.json({
      message: 'HRIS webhook processed successfully',
      status: result.status,
      actions: result.actions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error processing HRIS webhook', error);
    res.status(500).json({
      error: 'Failed to process HRIS webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/hris/sync - Bulk sync all employees
router.post('/sync', async (req: Request, res: Response) => {
  try {
    logger.info('Starting bulk HRIS sync');
    
    const result = await hrisService.syncAllEmployees();
    
    res.json({
      message: 'Bulk sync completed',
      processed: result.processed,
      errors: result.errors,
      actions: result.actions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in bulk HRIS sync', error);
    res.status(500).json({
      error: 'Failed to sync employees',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/hris/health - HRIS health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await hrisService.healthCheck();
    res.json(health);
  } catch (error) {
    logger.error('HRIS health check failed', error);
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'HRIS service is not available'
    });
  }
});

export { router as hrisRoutes };
