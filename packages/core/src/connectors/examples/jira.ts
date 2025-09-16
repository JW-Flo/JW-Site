import type { ConnectorContext, ConnectorImplementation } from '../types';

const buildResponse = (action: string, payload: Record<string, unknown>, context: ConnectorContext) => ({
  simulated: true,
  connector: 'jira-cloud',
  action,
  metadata: context.metadata ?? {},
  timestamp: new Date().toISOString(),
  payload,
});

export const jiraCloudConnector: ConnectorImplementation = {
  manifest: {
    id: 'jira-cloud',
    version: '1.0.0',
    displayName: 'Jira Cloud (Simulated)',
    description: 'Simulated Jira Cloud connector for change-management workflows and task orchestration.',
    categories: ['compliance', 'notifications', 'reporting'],
    auth: [
      {
        type: 'api_key',
        headerName: 'Authorization',
        description: 'Jira API token using Basic auth format.',
        location: 'header',
      },
    ],
    capabilities: [
      {
        category: 'compliance',
        actions: [
          {
            key: 'create-issue',
            name: 'Create Change Request',
            description: 'Simulate creating a Jira issue for change approval.',
            supportsBatching: false,
          },
          {
            key: 'transition-issue',
            name: 'Transition Change Request',
            description: 'Simulate moving a Jira change request to a new status.',
            supportsBatching: false,
          },
          {
            key: 'add-comment',
            name: 'Add Change Log Comment',
            description: 'Simulate adding a comment detailing deployment notes.',
            supportsBatching: true,
          },
        ],
        events: [],
      },
      {
        category: 'reporting',
        actions: [
          {
            key: 'fetch-issue',
            name: 'Fetch Change Request',
            description: 'Retrieve a simulated Jira issue with approval metadata.',
            supportsBatching: true,
          },
        ],
        events: [],
      },
    ],
    webhooks: [],
    polling: [],
    rateLimits: [],
    metadata: {
      simulate: true,
      reference: 'Jira Cloud',
    },
  },
  actions: {
    async ['create-issue'](parameters, context) {
      const { projectKey, summary, description, changeType = 'Standard', approvers = [] } = parameters;
      if (!projectKey || !summary) {
        throw new Error('create-issue requires projectKey and summary');
      }

      return buildResponse('create-issue', {
        projectKey,
        summary,
        description,
        changeType,
        approvers,
        issueKey: `${projectKey}-${Math.floor(Math.random() * 9000 + 1000)}`,
        status: 'Awaiting Approval',
      }, context);
    },

    async ['transition-issue'](parameters, context) {
      const { issueKey, status } = parameters;
      if (!issueKey || !status) {
        throw new Error('transition-issue requires issueKey and status');
      }

      return buildResponse('transition-issue', {
        issueKey,
        status,
        transitionedAt: new Date().toISOString(),
      }, context);
    },

    async ['add-comment'](parameters, context) {
      const { issueKey, comment } = parameters;
      if (!issueKey || !comment) {
        throw new Error('add-comment requires issueKey and comment');
      }

      return buildResponse('add-comment', {
        issueKey,
        comment,
        author: context.metadata?.actor ?? 'automation@atlasit',
      }, context);
    },

    async ['fetch-issue'](parameters, context) {
      const { issueKey } = parameters;
      if (!issueKey) {
        throw new Error('fetch-issue requires issueKey');
      }

      return buildResponse('fetch-issue', {
        issueKey,
        status: 'Awaiting Approval',
        approvals: [],
        changePlanUrl: context.metadata?.changePlanUrl ?? 'https://docs.example.com/change-plan',
      }, context);
    },
  },
};
