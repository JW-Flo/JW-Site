import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/environment';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';

// Route imports
import { oktaRoutes } from './routes/okta';
import { awsRoutes } from './routes/aws';
import { terraformRoutes } from './routes/terraform';
import { iamAutomationRoutes } from './routes/iamAutomation';
import { hrisRoutes } from './routes/hris';
import { healthRoutes } from './routes/health';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.server.allowedOrigins,
  credentials: true
}));

// Rate limiting
app.use(rateLimitMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id']
  });
  next();
});

// Health check routes (no auth required)
app.use('/health', healthRoutes);

// API routes with authentication
app.use('/api/okta', authMiddleware, oktaRoutes);
app.use('/api/aws', authMiddleware, awsRoutes);
app.use('/api/terraform', authMiddleware, terraformRoutes);
app.use('/api/iam-automation', authMiddleware, iamAutomationRoutes);
app.use('/api/hris', authMiddleware, hrisRoutes);

// Global error handler
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(config.server.port, () => {
  logger.info(`AtlasIT API Manager listening on port ${config.server.port}`, {
    environment: config.server.environment,
    version: process.env.npm_package_version
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
