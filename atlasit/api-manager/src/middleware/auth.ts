import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      logger.warn('API request without API key', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'API key required',
        code: 'AUTH_001'
      });
    }

    if (apiKey !== config.auth.apiKey) {
      logger.warn('API request with invalid API key', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        providedKey: apiKey.substring(0, 8) + '...' // Log partial key for debugging
      });
      
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
        code: 'AUTH_002'
      });
    }

    // Add API key info to request for logging
    (req as any).auth = {
      apiKey: apiKey.substring(0, 8) + '...',
      timestamp: new Date().toISOString()
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication error',
      code: 'AUTH_003'
    });
  }
};
