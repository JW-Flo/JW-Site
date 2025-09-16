import { config } from '../config/environment';
import { logger } from '../utils/logger';
import axios, { AxiosInstance } from 'axios';

export interface OktaUser {
  id: string;
  status: string;
  created: string;
  activated?: string;
  statusChanged?: string;
  lastLogin?: string;
  lastUpdated: string;
  passwordChanged?: string;
  type: {
    id: string;
  };
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    login: string;
    department?: string;
    title?: string;
    employeeNumber?: string;
    manager?: string;
    costCenter?: string;
  };
  credentials?: {
    password?: object;
    recovery_question?: object;
    provider?: {
      type: string;
      name?: string;
    };
  };
  _links?: {
    self: { href: string };
    activate?: { href: string };
    deactivate?: { href: string };
    suspend?: { href: string };
    unsuspend?: { href: string };
    resetPassword?: { href: string };
    resetFactors?: { href: string };
  };
}

export interface OktaGroup {
  id: string;
  created: string;
  lastUpdated: string;
  lastMembershipUpdated?: string;
  objectClass: string[];
  type: string;
  profile: {
    name: string;
    description?: string;
  };
  _links?: {
    logo?: Array<{ name: string; href: string; type?: string; }>;
    users?: { href: string };
    apps?: { href: string };
  };
}

export interface CreateUserRequest {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    login: string;
    department?: string;
    title?: string;
    employeeNumber?: string;
    manager?: string;
    costCenter?: string;
  };
  credentials?: {
    password?: {
      value: string;
    };
  };
  groupIds?: string[];
  activate?: boolean;
}

export interface JMLRequest {
  userId: string;
  action: 'joiner' | 'mover' | 'leaver';
  targetSystems: ('aws' | 'entra' | 'ad' | 'google' | 'knowbe4')[];
  metadata?: {
    department?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
    manager?: string;
    reason?: string;
  };
}

export interface TerraformExecutionRequest {
  action: 'apply' | 'destroy' | 'plan';
  variables: Record<string, any>;
  workspace?: string;
}

export class OktaApiService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = `https://${config.okta.domain}`;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `SSWS ${config.okta.apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Request/Response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.info('Okta API Request', {
          method: config.method,
          url: config.url,
          headers: config.headers
        });
        return config;
      },
      (error) => {
        logger.error('Okta API Request Error', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.info('Okta API Response', {
          status: response.status,
          url: response.config.url,
          dataLength: JSON.stringify(response.data).length
        });
        return response;
      },
      (error) => {
        logger.error('Okta API Response Error', {
          status: error.response?.status,
          url: error.config?.url,
          error: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  // User Management
  async getUsers(query?: string, limit: number = 20): Promise<OktaUser[]> {
    try {
      const params: any = { limit };
      if (query) {
        params.q = query;
      }

      const response = await this.client.get('/api/v1/users', { params });
      return response.data;
    } catch (error) {
      logger.error('Error fetching users from Okta', error);
      throw new Error(`Failed to fetch users: ${error}`);
    }
  }

  async getUser(userId: string): Promise<OktaUser> {
    try {
      const response = await this.client.get(`/api/v1/users/${userId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching user ${userId} from Okta`, error);
      throw new Error(`Failed to fetch user: ${error}`);
    }
  }

  async createUser(userData: CreateUserRequest): Promise<OktaUser> {
    try {
      const response = await this.client.post('/api/v1/users', userData);
      logger.info('User created in Okta', { userId: response.data.id });
      return response.data;
    } catch (error) {
      logger.error('Error creating user in Okta', error);
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  async updateUser(userId: string, userData: Partial<CreateUserRequest>): Promise<OktaUser> {
    try {
      const response = await this.client.post(`/api/v1/users/${userId}`, userData);
      logger.info('User updated in Okta', { userId });
      return response.data;
    } catch (error) {
      logger.error(`Error updating user ${userId} in Okta`, error);
      throw new Error(`Failed to update user: ${error}`);
    }
  }

  async deactivateUser(userId: string): Promise<OktaUser> {
    try {
      const response = await this.client.post(`/api/v1/users/${userId}/lifecycle/deactivate`);
      logger.info('User deactivated in Okta', { userId });
      return response.data;
    } catch (error) {
      logger.error(`Error deactivating user ${userId} in Okta`, error);
      throw new Error(`Failed to deactivate user: ${error}`);
    }
  }

  // Group Management
  async getGroups(): Promise<OktaGroup[]> {
    try {
      const response = await this.client.get('/api/v1/groups');
      return response.data;
    } catch (error) {
      logger.error('Error fetching groups from Okta', error);
      throw new Error(`Failed to fetch groups: ${error}`);
    }
  }

  async getGroup(groupId: string): Promise<OktaGroup> {
    try {
      const response = await this.client.get(`/api/v1/groups/${groupId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching group ${groupId} from Okta`, error);
      throw new Error(`Failed to fetch group: ${error}`);
    }
  }

  async getUserGroups(userId: string): Promise<OktaGroup[]> {
    try {
      const response = await this.client.get(`/api/v1/users/${userId}/groups`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching groups for user ${userId}`, error);
      throw new Error(`Failed to fetch user groups: ${error}`);
    }
  }

  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    try {
      await this.client.put(`/api/v1/groups/${groupId}/users/${userId}`);
      logger.info('User added to group', { userId, groupId });
    } catch (error) {
      logger.error(`Error adding user ${userId} to group ${groupId}`, error);
      throw new Error(`Failed to add user to group: ${error}`);
    }
  }

  async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    try {
      await this.client.delete(`/api/v1/groups/${groupId}/users/${userId}`);
      logger.info('User removed from group', { userId, groupId });
    } catch (error) {
      logger.error(`Error removing user ${userId} from group ${groupId}`, error);
      throw new Error(`Failed to remove user from group: ${error}`);
    }
  }

  // JML Workflow Methods
  async triggerJMLWorkflow(request: JMLRequest): Promise<{ workflowId: string; status: string }> {
    try {
      logger.info('Triggering JML workflow', request);

      // First, get user details
      const user = await this.getUser(request.userId);
      
      // Create workflow tracking record
      const workflowId = `jml-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Process based on action type
      switch (request.action) {
        case 'joiner':
          return await this.handleJoinerWorkflow(workflowId, user, request);
        case 'mover':
          return await this.handleMoverWorkflow(workflowId, user, request);
        case 'leaver':
          return await this.handleLeaverWorkflow(workflowId, user, request);
        default:
          throw new Error(`Unknown JML action: ${request.action}`);
      }
    } catch (error) {
      logger.error('Error triggering JML workflow', error);
      throw new Error(`Failed to trigger JML workflow: ${error}`);
    }
  }

  private async handleJoinerWorkflow(workflowId: string, user: OktaUser, request: JMLRequest) {
    logger.info('Processing joiner workflow', { workflowId, userId: user.id });

    // Add user to appropriate groups based on target systems
    const groupMappings = {
      aws: 'AWS Access',
      entra: 'Azure Access',
      ad: 'AD Access',
      google: 'Google Workspace Access',
      knowbe4: 'KnowBe4 Access'
    };

    for (const system of request.targetSystems) {
      const groupName = groupMappings[system];
      if (groupName) {
        try {
          // Find group by name
          const groups = await this.getGroups();
          const group = groups.find(g => g.profile.name === groupName);
          
          if (group) {
            await this.addUserToGroup(user.id, group.id);
            logger.info(`Added user to ${groupName} group`);
          } else {
            logger.warn(`Group ${groupName} not found`);
          }
        } catch (error) {
          logger.error(`Error adding user to ${groupName} group`, error);
        }
      }
    }

    // Trigger downstream system provisioning
    for (const system of request.targetSystems) {
      await this.triggerSystemProvisioning(system, user, request.metadata || {});
    }

    return {
      workflowId,
      status: 'in-progress'
    };
  }

  private async handleMoverWorkflow(workflowId: string, user: OktaUser, request: JMLRequest) {
    logger.info('Processing mover workflow', { workflowId, userId: user.id });

    // Update user profile if metadata provided
    if (request.metadata) {
      const profileUpdates: any = {};
      if (request.metadata.department) profileUpdates.department = request.metadata.department;
      if (request.metadata.role) profileUpdates.title = request.metadata.role;
      if (request.metadata.manager) profileUpdates.manager = request.metadata.manager;

      if (Object.keys(profileUpdates).length > 0) {
        await this.updateUser(user.id, { profile: profileUpdates });
      }
    }

    // Trigger system updates
    for (const system of request.targetSystems) {
      await this.triggerSystemUpdate(system, user, request.metadata || {});
    }

    return {
      workflowId,
      status: 'in-progress'
    };
  }

  private async handleLeaverWorkflow(workflowId: string, user: OktaUser, request: JMLRequest) {
    logger.info('Processing leaver workflow', { workflowId, userId: user.id });

    // Remove user from all system-specific groups
    const userGroups = await this.getUserGroups(user.id);
    const systemGroups = userGroups.filter(group => 
      ['AWS Access', 'Azure Access', 'AD Access', 'Google Workspace Access', 'KnowBe4 Access']
        .includes(group.profile.name)
    );

    for (const group of systemGroups) {
      try {
        await this.removeUserFromGroup(user.id, group.id);
        logger.info(`Removed user from ${group.profile.name} group`);
      } catch (error) {
        logger.error(`Error removing user from ${group.profile.name} group`, error);
      }
    }

    // Trigger downstream system deprovisioning
    for (const system of request.targetSystems) {
      await this.triggerSystemDeprovisioning(system, user, request.metadata || {});
    }

    // Schedule user deactivation if end date is specified
    if (request.metadata?.endDate) {
      logger.info(`Scheduled user deactivation for ${request.metadata.endDate}`);
      // In a real implementation, you would schedule this with a job queue
    } else {
      // Immediate deactivation
      await this.deactivateUser(user.id);
    }

    return {
      workflowId,
      status: 'in-progress'
    };
  }

  private async triggerSystemProvisioning(system: string, user: OktaUser, metadata: any) {
    logger.info(`Triggering ${system} provisioning for user ${user.id}`);
    
    if (system === 'aws') {
      await this.triggerTerraformExecution({
        action: 'apply',
        variables: {
          demo_user_name: user.profile.login.replace('@', '-').replace('.', '-'),
          okta_user_id: user.id,
          user_email: user.profile.email,
          user_department: user.profile.department || metadata.department || 'Engineering',
          user_role: metadata.role || 'developer',
          employee_type: 'fulltime',
          manager_email: user.profile.manager || metadata.manager || 'manager@atlasit.pro',
          start_date: new Date().toISOString().split('T')[0],
          jml_action: 'joiner'
        }
      });
    }
    
    // Add other system provisioning logic here
    logger.info(`${system} provisioning completed for user ${user.id}`);
  }

  private async triggerSystemUpdate(system: string, user: OktaUser, metadata: any) {
    logger.info(`Triggering ${system} update for user ${user.id}`);
    
    if (system === 'aws') {
      await this.triggerTerraformExecution({
        action: 'apply',
        variables: {
          demo_user_name: user.profile.login.replace('@', '-').replace('.', '-'),
          okta_user_id: user.id,
          user_email: user.profile.email,
          user_department: metadata.department || user.profile.department || 'Engineering',
          user_role: metadata.role || 'developer',
          previous_role: metadata.previousRole || '',
          jml_action: 'mover'
        }
      });
    }
    
    logger.info(`${system} update completed for user ${user.id}`);
  }

  private async triggerSystemDeprovisioning(system: string, user: OktaUser, metadata: any) {
    logger.info(`Triggering ${system} deprovisioning for user ${user.id}`);
    
    if (system === 'aws') {
      // For leaver, we might want to destroy the user but keep audit logs
      await this.triggerTerraformExecution({
        action: 'destroy',
        variables: {
          demo_user_name: user.profile.login.replace('@', '-').replace('.', '-'),
          okta_user_id: user.id,
          jml_action: 'leaver'
        }
      });
    }
    
    logger.info(`${system} deprovisioning completed for user ${user.id}`);
  }

  private async triggerTerraformExecution(request: TerraformExecutionRequest): Promise<void> {
    try {
      logger.info('Triggering Terraform execution', request);
      
      // In a real implementation, this would:
      // 1. Queue the terraform job
      // 2. Execute terraform with proper state management
      // 3. Return execution ID for tracking
      
      // For demo purposes, we'll simulate the execution
      logger.info('Terraform execution queued', {
        action: request.action,
        variables: Object.keys(request.variables)
      });
      
    } catch (error) {
      logger.error('Error triggering Terraform execution', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; oktaDomain: string; timestamp: string }> {
    try {
      // Try to fetch current user info as a health check
      await this.client.get('/api/v1/users/me');
      return {
        status: 'healthy',
        oktaDomain: config.okta.domain,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Okta health check failed', error);
      return {
        status: 'unhealthy',
        oktaDomain: config.okta.domain,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const oktaService = new OktaApiService();
