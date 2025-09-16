import { Router, Request, Response } from 'express';
import { config } from '../config/environment';
import { oktaService } from '../services/oktaService';

const router = Router();

// GET /health - Basic health check
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthChecks = {
      service: 'atlasit-api-manager',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.server.environment,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
      }
    };

    res.json(healthChecks);
  } catch (error) {
    res.status(503).json({
      service: 'atlasit-api-manager',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// GET /health/detailed - Detailed health check with dependencies
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const checks = {
      service: 'atlasit-api-manager',
      timestamp: new Date().toISOString(),
      environment: config.server.environment,
      version: process.env.npm_package_version || '1.0.0',
      dependencies: {
        okta: { status: 'unknown', latency: 0 },
        terraform: { status: 'configured', latency: 0 }
      },
      overall: 'healthy'
    };

    // Check Okta connectivity
    const oktaStart = Date.now();
    try {
      await oktaService.healthCheck();
      checks.dependencies.okta = {
        status: 'healthy',
        latency: Date.now() - oktaStart
      };
    } catch (error) {
      checks.dependencies.okta = {
        status: 'unhealthy',
        latency: Date.now() - oktaStart
      };
      checks.overall = 'degraded';
    }

    // Check Terraform workspace (basic file check)
    try {
      const fs = require('fs');
      const terraformPath = config.terraform.workspacePath;
      if (fs.existsSync(`${terraformPath}/main.tf`)) {
        checks.dependencies.terraform.status = 'healthy';
      } else {
        checks.dependencies.terraform.status = 'unhealthy';
        checks.overall = 'degraded';
      }
    } catch (error) {
      checks.dependencies.terraform.status = 'unhealthy';
      checks.overall = 'degraded';
    }

    const statusCode = checks.overall === 'healthy' ? 200 : 503;
    res.status(statusCode).json(checks);
  } catch (error) {
    res.status(503).json({
      service: 'atlasit-api-manager',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

export { router as healthRoutes };
