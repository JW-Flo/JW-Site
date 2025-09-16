import type { ConnectorContext, ConnectorImplementation } from '../types';

const buildResponse = (action: string, payload: Record<string, unknown>, context: ConnectorContext) => ({
  simulated: true,
  connector: 'slack-enterprise',
  action,
  metadata: context.metadata ?? {},
  timestamp: new Date().toISOString(),
  payload,
});

export const slackEnterpriseConnector: ConnectorImplementation = {
  manifest: {
    id: 'slack-enterprise',
    version: '1.0.0',
    displayName: 'Slack Enterprise (Simulated)',
    description: 'Simulated Slack connector for inviting users and managing channels.',
    categories: ['notifications', 'collaboration'],
    auth: [
      {
        type: 'api_key',
        headerName: 'Authorization',
        description: 'Slack Bot token (simulated).',
        location: 'header',
      },
    ],
    capabilities: [
      {
        category: 'notifications',
        actions: [
          {
            key: 'invite-user',
            name: 'Invite User',
            description: 'Simulate inviting a user to Slack.',
            supportsBatching: false,
          },
          {
            key: 'assign-channels',
            name: 'Assign Channels',
            description: 'Simulate adding the user to Slack channels.',
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
      reference: 'Slack',
    },
  },
  actions: {
    async ['invite-user'](parameters, context) {
      const { email, channels = [], message = 'Welcome to Slack!' } = parameters;
      if (!email) {
        throw new Error('invite-user requires email');
      }

      return buildResponse('invite-user', { email, channels, message }, context);
    },

    async ['assign-channels'](parameters, context) {
      const { email, channels = [] } = parameters;
      if (!email) {
        throw new Error('assign-channels requires email');
      }

      return buildResponse('assign-channels', { email, channels }, context);
    },
  },
};
