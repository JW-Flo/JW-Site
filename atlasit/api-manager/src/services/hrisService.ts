import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { oktaService } from './oktaService';
import axios, { AxiosInstance } from 'axios';

export interface HRISEmployee {
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    startDate: string;
    endDate?: string;
  };
  jobInfo: {
    title: string;
    department: string;
    manager: string;
    employeeType: 'fulltime' | 'contractor' | 'intern';
    costCenter: string;
    location: string;
  };
  status: 'active' | 'inactive' | 'terminated';
  systemAccess: {
    needsAWS: boolean;
    needsEntra: boolean;
    needsGoogle: boolean;
    needsAD: boolean;
    role: 'developer' | 'security_engineer' | 'data_analyst' | 'contractor';
  };
}

export interface HRISWebhookPayload {
  eventType: 'employee.created' | 'employee.updated' | 'employee.terminated';
  timestamp: string;
  employee: HRISEmployee;
  changes?: Partial<HRISEmployee>;
}

export class HRISIntegrationService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.bamboohr.com/api/gateway.php/atlasit', // Example HRIS
      headers: {
        'Authorization': `Basic ${Buffer.from(config.hris.apiKey + ':x').toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  // Process HRIS webhook events
  async processWebhookEvent(payload: HRISWebhookPayload): Promise<{ status: string; actions: string[] }> {
    logger.info('Processing HRIS webhook event', { eventType: payload.eventType, employeeId: payload.employee.employeeId });

    const actions: string[] = [];
    
    try {
      switch (payload.eventType) {
        case 'employee.created':
          return await this.handleNewEmployee(payload.employee, actions);
        case 'employee.updated':
          return await this.handleEmployeeUpdate(payload.employee, payload.changes || {}, actions);
        case 'employee.terminated':
          return await this.handleEmployeeTermination(payload.employee, actions);
        default:
          throw new Error(`Unknown event type: ${payload.eventType}`);
      }
    } catch (error) {
      logger.error('Error processing HRIS webhook', error);
      throw error;
    }
  }

  private async handleNewEmployee(employee: HRISEmployee, actions: string[]): Promise<{ status: string; actions: string[] }> {
    logger.info('Handling new employee', { employeeId: employee.employeeId });

    // 1. Create user in Okta
    const oktaUserData = {
      profile: {
        firstName: employee.personalInfo.firstName,
        lastName: employee.personalInfo.lastName,
        email: employee.personalInfo.email,
        login: employee.personalInfo.email,
        department: employee.jobInfo.department,
        title: employee.jobInfo.title,
        employeeNumber: employee.employeeId,
        manager: employee.jobInfo.manager,
        costCenter: employee.jobInfo.costCenter
      },
      activate: true
    };

    try {
      const oktaUser = await oktaService.createUser(oktaUserData);
      actions.push(`Created Okta user: ${oktaUser.id}`);

      // 2. Assign to appropriate groups based on system access needs
      const groupAssignments = this.determineGroupAssignments(employee);
      
      for (const groupName of groupAssignments) {
        try {
          const groups = await oktaService.getGroups();
          const group = groups.find(g => g.profile.name === groupName);
          
          if (group) {
            await oktaService.addUserToGroup(oktaUser.id, group.id);
            actions.push(`Added to group: ${groupName}`);
          }
        } catch (error) {
          logger.warn(`Failed to add user to group ${groupName}`, error);
        }
      }

      // 3. Trigger downstream provisioning
      if (employee.systemAccess.needsAWS) {
        await oktaService.triggerJMLWorkflow({
          userId: oktaUser.id,
          action: 'joiner',
          targetSystems: this.getTargetSystems(employee),
          metadata: {
            department: employee.jobInfo.department,
            role: employee.systemAccess.role,
            startDate: employee.personalInfo.startDate,
            manager: employee.jobInfo.manager
          }
        });
        actions.push('Triggered AWS provisioning workflow');
      }

    } catch (error) {
      logger.error('Error creating Okta user from HRIS data', error);
      actions.push(`Failed to create Okta user: ${error}`);
    }

    return { status: 'completed', actions };
  }

  private async handleEmployeeUpdate(employee: HRISEmployee, changes: Partial<HRISEmployee>, actions: string[]): Promise<{ status: string; actions: string[] }> {
    logger.info('Handling employee update', { employeeId: employee.employeeId, changes: Object.keys(changes) });

    try {
      // Find existing Okta user
      const users = await oktaService.getUsers(employee.personalInfo.email);
      const oktaUser = users.find(u => u.profile.email === employee.personalInfo.email);

      if (!oktaUser) {
        throw new Error(`Okta user not found for employee ${employee.employeeId}`);
      }

      // Update profile if job info changed
      if (changes.jobInfo) {
        const profileUpdates: any = {};
        if (changes.jobInfo.title) profileUpdates.title = employee.jobInfo.title;
        if (changes.jobInfo.department) profileUpdates.department = employee.jobInfo.department;
        if (changes.jobInfo.manager) profileUpdates.manager = employee.jobInfo.manager;

        if (Object.keys(profileUpdates).length > 0) {
          await oktaService.updateUser(oktaUser.id, { profile: profileUpdates });
          actions.push('Updated Okta profile');
        }
      }

      // Handle role/access changes
      if (changes.systemAccess) {
        await oktaService.triggerJMLWorkflow({
          userId: oktaUser.id,
          action: 'mover',
          targetSystems: this.getTargetSystems(employee),
          metadata: {
            department: employee.jobInfo.department,
            role: employee.systemAccess.role,
            previousRole: changes.systemAccess?.role || employee.systemAccess.role
          }
        });
        actions.push('Triggered mover workflow for access changes');
      }

    } catch (error) {
      logger.error('Error updating employee in Okta', error);
      actions.push(`Failed to update Okta user: ${error}`);
    }

    return { status: 'completed', actions };
  }

  private async handleEmployeeTermination(employee: HRISEmployee, actions: string[]): Promise<{ status: string; actions: string[] }> {
    logger.info('Handling employee termination', { employeeId: employee.employeeId });

    try {
      // Find existing Okta user
      const users = await oktaService.getUsers(employee.personalInfo.email);
      const oktaUser = users.find(u => u.profile.email === employee.personalInfo.email);

      if (!oktaUser) {
        throw new Error(`Okta user not found for employee ${employee.employeeId}`);
      }

      // Trigger leaver workflow
      await oktaService.triggerJMLWorkflow({
        userId: oktaUser.id,
        action: 'leaver',
        targetSystems: this.getTargetSystems(employee),
        metadata: {
          endDate: employee.personalInfo.endDate || new Date().toISOString().split('T')[0],
          reason: 'Employment terminated'
        }
      });
      actions.push('Triggered leaver workflow');

      // Deactivate user in Okta
      await oktaService.deactivateUser(oktaUser.id);
      actions.push('Deactivated Okta user');

    } catch (error) {
      logger.error('Error processing employee termination', error);
      actions.push(`Failed to process termination: ${error}`);
    }

    return { status: 'completed', actions };
  }

  private determineGroupAssignments(employee: HRISEmployee): string[] {
    const groups: string[] = ['AtlasIT Workforce']; // Base group for all employees

    if (employee.systemAccess.needsAWS) groups.push('AWS Access');
    if (employee.systemAccess.needsEntra) groups.push('Azure Access');
    if (employee.systemAccess.needsAD) groups.push('AD Access');
    if (employee.systemAccess.needsGoogle) groups.push('Google Workspace Access');

    // Role-based groups
    switch (employee.systemAccess.role) {
      case 'security_engineer':
        groups.push('Security Team');
        break;
      case 'developer':
        groups.push('Engineering Team');
        break;
      case 'data_analyst':
        groups.push('Data Team');
        break;
    }

    return groups;
  }

  private getTargetSystems(employee: HRISEmployee): ('aws' | 'entra' | 'ad' | 'google' | 'knowbe4')[] {
    const systems: ('aws' | 'entra' | 'ad' | 'google' | 'knowbe4')[] = [];
    
    if (employee.systemAccess.needsAWS) systems.push('aws');
    if (employee.systemAccess.needsEntra) systems.push('entra');
    if (employee.systemAccess.needsAD) systems.push('ad');
    if (employee.systemAccess.needsGoogle) systems.push('google');
    
    // Everyone gets security awareness training
    systems.push('knowbe4');

    return systems;
  }

  // Sync all employees from HRIS (for initial setup or bulk sync)
  async syncAllEmployees(): Promise<{ processed: number; errors: number; actions: string[] }> {
    logger.info('Starting bulk employee sync from HRIS');

    const results = { processed: 0, errors: 0, actions: [] as string[] };

    try {
      // In a real implementation, this would fetch from the actual HRIS API
      const mockEmployees: HRISEmployee[] = [
        {
          employeeId: 'EMP001',
          personalInfo: {
            firstName: 'Jordan',
            lastName: 'Miles',
            email: 'jordan.miles@atlasit.pro',
            startDate: '2025-01-15'
          },
          jobInfo: {
            title: 'Security Engineer',
            department: 'Security',
            manager: 'security-lead@atlasit.pro',
            employeeType: 'fulltime',
            costCenter: 'SEC-001',
            location: 'Austin, TX'
          },
          status: 'active',
          systemAccess: {
            needsAWS: true,
            needsEntra: true,
            needsGoogle: true,
            needsAD: false,
            role: 'security_engineer'
          }
        },
        {
          employeeId: 'EMP002',
          personalInfo: {
            firstName: 'Maya',
            lastName: 'Greene',
            email: 'maya.greene@atlasit.pro',
            startDate: '2024-06-01'
          },
          jobInfo: {
            title: 'Senior Data Analyst',
            department: 'Data',
            manager: 'data-lead@atlasit.pro',
            employeeType: 'fulltime',
            costCenter: 'DATA-001',
            location: 'Boston, MA'
          },
          status: 'active',
          systemAccess: {
            needsAWS: true,
            needsEntra: false,
            needsGoogle: true,
            needsAD: true,
            role: 'data_analyst'
          }
        }
      ];

      for (const employee of mockEmployees) {
        try {
          const result = await this.handleNewEmployee(employee, []);
          results.processed++;
          results.actions.push(`Processed ${employee.personalInfo.email}: ${result.actions.join(', ')}`);
        } catch (error) {
          results.errors++;
          results.actions.push(`Failed to process ${employee.personalInfo.email}: ${error}`);
        }
      }

    } catch (error) {
      logger.error('Error in bulk employee sync', error);
      results.errors++;
    }

    logger.info('Bulk employee sync completed', results);
    return results;
  }

  async healthCheck(): Promise<{ status: string; hrisConnected: boolean; timestamp: string }> {
    try {
      // In a real implementation, this would ping the HRIS API
      return {
        status: 'healthy',
        hrisConnected: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        hrisConnected: false,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const hrisService = new HRISIntegrationService();
