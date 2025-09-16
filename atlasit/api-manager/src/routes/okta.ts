import { Router, Request, Response } from 'express';
import { oktaService, JMLRequest } from '../services/oktaService';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createUserSchema = z.object({
  profile: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    login: z.string().min(1),
    department: z.string().optional(),
    title: z.string().optional(),
    employeeNumber: z.string().optional(),
    manager: z.string().optional(),
    costCenter: z.string().optional()
  }),
  credentials: z.object({
    password: z.object({
      value: z.string().min(8)
    })
  }).optional(),
  groupIds: z.array(z.string()).optional(),
  activate: z.boolean().optional()
});

const jmlRequestSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(['joiner', 'mover', 'leaver']),
  targetSystems: z.array(z.enum(['aws', 'entra', 'ad', 'google', 'knowbe4'])),
  metadata: z.object({
    department: z.string().optional(),
    role: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    manager: z.string().optional(),
    reason: z.string().optional(),
    previousRole: z.string().optional()
  }).optional()
});

// GET /api/okta/health - Health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await oktaService.healthCheck();
    res.json(health);
  } catch (error) {
    logger.error('Okta health check failed', error);
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Okta service is not available'
    });
  }
});

// GET /api/okta/users - Get users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;

    const users = await oktaService.getUsers(query, limit);
    res.json({
      users,
      count: users.length,
      query: query || null,
      limit
    });
  } catch (error) {
    logger.error('Error fetching users', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// GET /api/okta/users/:userId - Get specific user
router.get('/users/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await oktaService.getUser(userId);
    res.json(user);
  } catch (error) {
    logger.error(`Error fetching user ${req.params.userId}`, error);
    res.status(404).json({
      error: 'User not found',
      message: error.message
    });
  }
});

// POST /api/okta/users - Create user
router.post('/users', async (req: Request, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    const user = await oktaService.createUser(validatedData);
    
    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    
    logger.error('Error creating user', error);
    res.status(500).json({
      error: 'Failed to create user',
      message: error.message
    });
  }
});

// PUT /api/okta/users/:userId - Update user
router.put('/users/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const validatedData = createUserSchema.partial().parse(req.body);
    
    const user = await oktaService.updateUser(userId, validatedData);
    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    
    logger.error(`Error updating user ${req.params.userId}`, error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// POST /api/okta/users/:userId/deactivate - Deactivate user
router.post('/users/:userId/deactivate', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await oktaService.deactivateUser(userId);
    
    res.json({
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    logger.error(`Error deactivating user ${req.params.userId}`, error);
    res.status(500).json({
      error: 'Failed to deactivate user',
      message: error.message
    });
  }
});

// GET /api/okta/groups - Get groups
router.get('/groups', async (req: Request, res: Response) => {
  try {
    const groups = await oktaService.getGroups();
    res.json({
      groups,
      count: groups.length
    });
  } catch (error) {
    logger.error('Error fetching groups', error);
    res.status(500).json({
      error: 'Failed to fetch groups',
      message: error.message
    });
  }
});

// GET /api/okta/groups/:groupId - Get specific group
router.get('/groups/:groupId', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const group = await oktaService.getGroup(groupId);
    res.json(group);
  } catch (error) {
    logger.error(`Error fetching group ${req.params.groupId}`, error);
    res.status(404).json({
      error: 'Group not found',
      message: error.message
    });
  }
});

// GET /api/okta/users/:userId/groups - Get user's groups
router.get('/users/:userId/groups', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const groups = await oktaService.getUserGroups(userId);
    res.json({
      userId,
      groups,
      count: groups.length
    });
  } catch (error) {
    logger.error(`Error fetching groups for user ${req.params.userId}`, error);
    res.status(500).json({
      error: 'Failed to fetch user groups',
      message: error.message
    });
  }
});

// PUT /api/okta/groups/:groupId/users/:userId - Add user to group
router.put('/groups/:groupId/users/:userId', async (req: Request, res: Response) => {
  try {
    const { groupId, userId } = req.params;
    await oktaService.addUserToGroup(userId, groupId);
    
    res.json({
      message: 'User added to group successfully',
      groupId,
      userId
    });
  } catch (error) {
    logger.error(`Error adding user ${req.params.userId} to group ${req.params.groupId}`, error);
    res.status(500).json({
      error: 'Failed to add user to group',
      message: error.message
    });
  }
});

// DELETE /api/okta/groups/:groupId/users/:userId - Remove user from group
router.delete('/groups/:groupId/users/:userId', async (req: Request, res: Response) => {
  try {
    const { groupId, userId } = req.params;
    await oktaService.removeUserFromGroup(userId, groupId);
    
    res.json({
      message: 'User removed from group successfully',
      groupId,
      userId
    });
  } catch (error) {
    logger.error(`Error removing user ${req.params.userId} from group ${req.params.groupId}`, error);
    res.status(500).json({
      error: 'Failed to remove user from group',
      message: error.message
    });
  }
});

// POST /api/okta/jml - Trigger JML workflow
router.post('/jml', async (req: Request, res: Response) => {
  try {
    const validatedData = jmlRequestSchema.parse(req.body);
    const result = await oktaService.triggerJMLWorkflow(validatedData as JMLRequest);
    
    res.status(202).json({
      message: 'JML workflow triggered successfully',
      workflowId: result.workflowId,
      status: result.status,
      action: validatedData.action,
      targetSystems: validatedData.targetSystems
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.errors
      });
    }
    
    logger.error('Error triggering JML workflow', error);
    res.status(500).json({
      error: 'Failed to trigger JML workflow',
      message: error.message
    });
  }
});

// GET /api/okta/integrations - Get integration status
router.get('/integrations', async (req: Request, res: Response) => {
  try {
    const integrations = [
      {
        id: 'aws',
        name: 'AWS IAM',
        status: 'connected',
        description: 'Terraform-managed AWS IAM provisioning',
        lastSync: new Date().toISOString(),
        capabilities: ['joiner', 'mover', 'leaver']
      },
      {
        id: 'entra',
        name: 'Microsoft Entra ID',
        status: 'connected',
        description: 'Azure AD user and group management',
        lastSync: new Date().toISOString(),
        capabilities: ['joiner', 'mover', 'leaver']
      },
      {
        id: 'ad',
        name: 'Active Directory',
        status: 'connected',
        description: 'On-premises AD via Okta AD Agent',
        lastSync: new Date().toISOString(),
        capabilities: ['joiner', 'mover', 'leaver']
      },
      {
        id: 'google',
        name: 'Google Workspace',
        status: 'connected',
        description: 'Google Workspace user provisioning',
        lastSync: new Date().toISOString(),
        capabilities: ['joiner', 'mover', 'leaver']
      },
      {
        id: 'knowbe4',
        name: 'KnowBe4',
        status: 'connected',
        description: 'Security awareness training provisioning',
        lastSync: new Date().toISOString(),
        capabilities: ['joiner', 'leaver']
      }
    ];

    res.json({
      integrations,
      count: integrations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching integrations', error);
    res.status(500).json({
      error: 'Failed to fetch integrations',
      message: error.message
    });
  }
});

export { router as oktaRoutes };
