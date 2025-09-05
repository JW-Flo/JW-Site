import { z } from 'zod';
import { FlowWeaveComponent, FlowWeaveComponentPort, componentLibrary } from '../core/flowweave';
import { getSystemAuthHeaders } from '../services/authManager';
import { logger } from '@atlasit/shared';

// Active Directory User Management Component
export const ADUserComponent: FlowWeaveComponent = {
  id: 'ad-user-management',
  name: 'Active Directory User',
  category: 'identity',
  version: '1.0.0',
  description: 'Manage Active Directory user accounts',
  icon: '👤',
  schema: z.object({
    action: z.enum(['create', 'update', 'disable', 'enable', 'delete']),
    userPrincipalName: z.string().email(),
    displayName: z.string().optional(),
    department: z.string().optional(),
    manager: z.string().optional(),
    groups: z.array(z.string()).optional()
  }),
  inputs: [
    {
      name: 'action',
      type: 'string',
      required: true,
      description: 'Action to perform on the user account'
    },
    {
      name: 'userData',
      type: 'object',
      required: true,
      description: 'User account data'
    }
  ],
  outputs: [
    {
      name: 'success',
      type: 'boolean',
      required: true,
      description: 'Whether the operation was successful'
    },
    {
      name: 'userId',
      type: 'string',
      required: false,
      description: 'The created/updated user ID'
    },
    {
      name: 'errors',
      type: 'array',
      required: false,
      description: 'Any errors that occurred'
    }
  ],
  config: {
    domainController: '{{systems.activeDirectory.domainController}}',
    baseDN: '{{systems.activeDirectory.baseDN}}'
  },
  execute: async (inputs, config) => {
    const { action, userData } = inputs;
    const { domainController, baseDN } = config;

    try {
      const authHeaders = await getSystemAuthHeaders('activeDirectory');

      // Simulate AD operation
      logger.info('Executing AD user operation', { action, userPrincipalName: userData.userPrincipalName });

      // In real implementation, this would make actual LDAP calls
      const result = {
        success: true,
        userId: `AD-${userData.userPrincipalName}`,
        errors: []
      };

      return result;
    } catch (error) {
      logger.error('AD user operation failed', error);
      return {
        success: false,
        userId: null,
        errors: [error.message]
      };
    }
  }
};

// Office 365 License Management Component
export const O365LicenseComponent: FlowWeaveComponent = {
  id: 'o365-license-management',
  name: 'Office 365 License',
  category: 'productivity',
  version: '1.0.0',
  description: 'Manage Office 365 user licenses',
  icon: '📧',
  schema: z.object({
    action: z.enum(['assign', 'remove', 'update']),
    userId: z.string(),
    licenseSku: z.string(),
    location: z.string().optional()
  }),
  inputs: [
    {
      name: 'action',
      type: 'string',
      required: true,
      description: 'License action to perform'
    },
    {
      name: 'userId',
      type: 'string',
      required: true,
      description: 'User ID to manage license for'
    },
    {
      name: 'licenseData',
      type: 'object',
      required: true,
      description: 'License configuration data'
    }
  ],
  outputs: [
    {
      name: 'success',
      type: 'boolean',
      required: true,
      description: 'Whether the license operation was successful'
    },
    {
      name: 'licenseId',
      type: 'string',
      required: false,
      description: 'The assigned license ID'
    }
  ],
  config: {
    tenantId: '{{systems.office365.tenantId}}',
    clientId: '{{systems.office365.clientId}}'
  },
  execute: async (inputs, config) => {
    const { action, userId, licenseData } = inputs;

    try {
      const authHeaders = await getSystemAuthHeaders('office365');

      logger.info('Executing O365 license operation', { action, userId, licenseSku: licenseData.licenseSku });

      // Simulate Microsoft Graph API call
      const result = {
        success: true,
        licenseId: `LIC-${userId}-${licenseData.licenseSku}`
      };

      return result;
    } catch (error) {
      logger.error('O365 license operation failed', error);
      return {
        success: false,
        licenseId: null
      };
    }
  }
};

// Slack User Management Component
export const SlackUserComponent: FlowWeaveComponent = {
  id: 'slack-user-management',
  name: 'Slack User',
  category: 'communication',
  version: '1.0.0',
  description: 'Manage Slack workspace users',
  icon: '💬',
  schema: z.object({
    action: z.enum(['invite', 'update', 'deactivate', 'reactivate']),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    channels: z.array(z.string()).optional()
  }),
  inputs: [
    {
      name: 'action',
      type: 'string',
      required: true,
      description: 'User action to perform'
    },
    {
      name: 'userData',
      type: 'object',
      required: true,
      description: 'User data for Slack'
    }
  ],
  outputs: [
    {
      name: 'success',
      type: 'boolean',
      required: true,
      description: 'Whether the Slack operation was successful'
    },
    {
      name: 'slackUserId',
      type: 'string',
      required: false,
      description: 'The Slack user ID'
    }
  ],
  config: {
    workspaceId: '{{systems.slack.workspaceId}}',
    defaultChannels: '{{systems.slack.defaultChannels}}'
  },
  execute: async (inputs, config) => {
    const { action, userData } = inputs;

    try {
      const authHeaders = await getSystemAuthHeaders('slack');

      logger.info('Executing Slack user operation', { action, email: userData.email });

      // Simulate Slack API call
      const result = {
        success: true,
        slackUserId: `SLACK-${userData.email.replace('@', '-').replace('.', '-')}`
      };

      return result;
    } catch (error) {
      logger.error('Slack user operation failed', error);
      return {
        success: false,
        slackUserId: null
      };
    }
  }
};

// AWS IAM User Management Component
export const AWSIAMComponent: FlowWeaveComponent = {
  id: 'aws-iam-management',
  name: 'AWS IAM User',
  category: 'cloud',
  version: '1.0.0',
  description: 'Manage AWS IAM users and permissions',
  icon: '☁️',
  schema: z.object({
    action: z.enum(['create', 'update', 'delete', 'attach-policy', 'detach-policy']),
    userName: z.string(),
    policies: z.array(z.string()).optional(),
    groups: z.array(z.string()).optional()
  }),
  inputs: [
    {
      name: 'action',
      type: 'string',
      required: true,
      description: 'IAM action to perform'
    },
    {
      name: 'userData',
      type: 'object',
      required: true,
      description: 'AWS user configuration'
    }
  ],
  outputs: [
    {
      name: 'success',
      type: 'boolean',
      required: true,
      description: 'Whether the AWS operation was successful'
    },
    {
      name: 'awsUserArn',
      type: 'string',
      required: false,
      description: 'The AWS user ARN'
    }
  ],
  config: {
    region: '{{systems.aws.region}}',
    accountId: '{{systems.aws.accountId}}'
  },
  execute: async (inputs, config) => {
    const { action, userData } = inputs;
    const { region, accountId } = config;

    try {
      const authHeaders = await getSystemAuthHeaders('aws');

      logger.info('Executing AWS IAM operation', { action, userName: userData.userName });

      // Simulate AWS IAM API call
      const result = {
        success: true,
        awsUserArn: `arn:aws:iam::${accountId}:user/${userData.userName}`
      };

      return result;
    } catch (error) {
      logger.error('AWS IAM operation failed', error);
      return {
        success: false,
        awsUserArn: null
      };
    }
  }
};

// Data Transformation Component
export const DataTransformComponent: FlowWeaveComponent = {
  id: 'data-transformer',
  name: 'Data Transformer',
  category: 'data',
  version: '1.0.0',
  description: 'Transform data between different formats',
  icon: '🔄',
  schema: z.object({
    transformation: z.enum(['map', 'filter', 'aggregate', 'merge']),
    sourceFormat: z.string(),
    targetFormat: z.string(),
    mapping: z.record(z.string()).optional()
  }),
  inputs: [
    {
      name: 'data',
      type: 'any',
      required: true,
      description: 'Input data to transform'
    },
    {
      name: 'config',
      type: 'object',
      required: true,
      description: 'Transformation configuration'
    }
  ],
  outputs: [
    {
      name: 'transformedData',
      type: 'any',
      required: true,
      description: 'Transformed output data'
    },
    {
      name: 'metadata',
      type: 'object',
      required: false,
      description: 'Transformation metadata'
    }
  ],
  config: {},
  execute: async (inputs, config) => {
    const { data, config: transformConfig } = inputs;

    try {
      logger.info('Executing data transformation', { transformation: transformConfig.transformation });

      let transformedData: any;
      const metadata = { recordsProcessed: 0, duration: 0 };

      const startTime = Date.now();

      switch (transformConfig.transformation) {
        case 'map':
          transformedData = applyMapping(data, transformConfig.mapping);
          break;
        case 'filter':
          transformedData = applyFiltering(data, transformConfig.condition);
          break;
        case 'aggregate':
          transformedData = applyAggregation(data, transformConfig.operation);
          break;
        case 'merge':
          transformedData = applyMerging(data, transformConfig.sources);
          break;
        default:
          transformedData = data;
      }

      metadata.recordsProcessed = Array.isArray(transformedData) ? transformedData.length : 1;
      metadata.duration = Date.now() - startTime;

      return {
        transformedData,
        metadata
      };
    } catch (error) {
      logger.error('Data transformation failed', error);
      return {
        transformedData: null,
        metadata: { error: error.message }
      };
    }
  }
};

// Approval Workflow Component
export const ApprovalComponent: FlowWeaveComponent = {
  id: 'approval-workflow',
  name: 'Approval Workflow',
  category: 'governance',
  version: '1.0.0',
  description: 'Handle approval workflows with multiple reviewers',
  icon: '✅',
  schema: z.object({
    requestType: z.string(),
    requester: z.string(),
    reviewers: z.array(z.string()),
    approvalType: z.enum(['any', 'all', 'sequential']),
    timeout: z.number().optional()
  }),
  inputs: [
    {
      name: 'requestData',
      type: 'object',
      required: true,
      description: 'Approval request data'
    },
    {
      name: 'approvalConfig',
      type: 'object',
      required: true,
      description: 'Approval workflow configuration'
    }
  ],
  outputs: [
    {
      name: 'approved',
      type: 'boolean',
      required: true,
      description: 'Whether the request was approved'
    },
    {
      name: 'approver',
      type: 'string',
      required: false,
      description: 'Who approved the request'
    },
    {
      name: 'comments',
      type: 'string',
      required: false,
      description: 'Approval comments'
    }
  ],
  config: {
    notificationSystem: '{{systems.notifications.type}}',
    defaultTimeout: 604800000 // 7 days
  },
  execute: async (inputs, config) => {
    const { requestData, approvalConfig } = inputs;

    try {
      logger.info('Executing approval workflow', {
        requestType: requestData.requestType,
        requester: requestData.requester,
        reviewerCount: approvalConfig.reviewers.length
      });

      // Simulate approval workflow
      // In real implementation, this would:
      // 1. Create approval request
      // 2. Send notifications to reviewers
      // 3. Wait for responses
      // 4. Handle timeouts
      // 5. Return final decision

      const result = {
        approved: true, // Simulate approval
        approver: approvalConfig.reviewers[0],
        comments: 'Approved via automated workflow'
      };

      return result;
    } catch (error) {
      logger.error('Approval workflow failed', error);
      return {
        approved: false,
        approver: null,
        comments: `Error: ${error.message}`
      };
    }
  }
};

// Notification Component
export const NotificationComponent: FlowWeaveComponent = {
  id: 'notification-sender',
  name: 'Notification Sender',
  category: 'communication',
  version: '1.0.0',
  description: 'Send notifications via various channels',
  icon: '📢',
  schema: z.object({
    channel: z.enum(['email', 'slack', 'teams', 'sms']),
    recipients: z.array(z.string()),
    subject: z.string(),
    message: z.string(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional()
  }),
  inputs: [
    {
      name: 'notificationData',
      type: 'object',
      required: true,
      description: 'Notification data'
    }
  ],
  outputs: [
    {
      name: 'sent',
      type: 'boolean',
      required: true,
      description: 'Whether the notification was sent successfully'
    },
    {
      name: 'messageId',
      type: 'string',
      required: false,
      description: 'Notification message ID'
    }
  ],
  config: {
    emailService: '{{systems.notifications.email.service}}',
    slackWebhook: '{{systems.notifications.slack.webhook}}'
  },
  execute: async (inputs, config) => {
    const { notificationData } = inputs;

    try {
      logger.info('Sending notification', {
        channel: notificationData.channel,
        recipientCount: notificationData.recipients.length,
        priority: notificationData.priority
      });

      // Simulate notification sending
      const result = {
        sent: true,
        messageId: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      return result;
    } catch (error) {
      logger.error('Notification sending failed', error);
      return {
        sent: false,
        messageId: null
      };
    }
  }
};

// Helper functions for data transformations
function applyMapping(data: any, mapping: Record<string, string>): any {
  if (Array.isArray(data)) {
    return data.map(item => mapObject(item, mapping));
  }
  return mapObject(data, mapping);
}

function mapObject(obj: any, mapping: Record<string, string>): any {
  const result: any = {};
  for (const [targetKey, sourcePath] of Object.entries(mapping)) {
    result[targetKey] = getNestedValue(obj, sourcePath);
  }
  return result;
}

function applyFiltering(data: any, condition: any): any {
  if (!Array.isArray(data)) return data;
  return data.filter(item => evaluateCondition(item, condition));
}

function applyAggregation(data: any, operation: any): any {
  if (!Array.isArray(data)) return data;

  const { field, type } = operation;

  switch (type) {
    case 'count':
      return data.length;
    case 'sum':
      return data.reduce((sum, item) => sum + Number(getNestedValue(item, field) || 0), 0);
    case 'average':
      const sum = data.reduce((acc, item) => acc + Number(getNestedValue(item, field) || 0), 0);
      return sum / data.length;
    case 'max':
      return Math.max(...data.map(item => Number(getNestedValue(item, field) || 0)));
    case 'min':
      return Math.min(...data.map(item => Number(getNestedValue(item, field) || 0)));
    default:
      return data;
  }
}

function applyMerging(data: any, sources: any[]): any {
  // Simple merge logic - combine multiple data sources
  if (!Array.isArray(sources)) return data;
  return sources.reduce((merged, source) => ({ ...merged, ...source }), data);
}

function evaluateCondition(item: any, condition: any): boolean {
  // Simple condition evaluation
  return true; // Placeholder
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Register all components
export function registerBuiltInComponents(): void {
  componentLibrary.register(ADUserComponent);
  componentLibrary.register(O365LicenseComponent);
  componentLibrary.register(SlackUserComponent);
  componentLibrary.register(AWSIAMComponent);
  componentLibrary.register(DataTransformComponent);
  componentLibrary.register(ApprovalComponent);
  componentLibrary.register(NotificationComponent);

  logger.info('Registered all built-in FlowWeave components');
}
