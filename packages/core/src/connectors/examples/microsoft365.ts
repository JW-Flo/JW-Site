import type { ConnectorImplementation, ConnectorContext } from '../types';

const buildResponse = (action: string, payload: Record<string, unknown>, context: ConnectorContext) => ({
  simulated: true,
  connector: 'microsoft-365',
  action,
  metadata: context.metadata ?? {},
  timestamp: new Date().toISOString(),
  payload,
});

export const microsoft365Connector: ConnectorImplementation = {
  manifest: {
    id: 'microsoft-365',
    version: '1.0.0',
    displayName: 'Microsoft 365 (Simulated)',
    description: 'Simulated Microsoft 365 connector covering user provisioning and license workflows.',
    categories: ['identity', 'provisioning', 'notifications'],
    auth: [
      {
        type: 'oauth2',
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scopes: ['https://graph.microsoft.com/.default'],
        pkce: false,
      },
      {
        type: 'api_key',
        headerName: 'Authorization',
        description: 'Simulated Graph API bearer token.',
        location: 'header',
      },
    ],
    capabilities: [
      {
        category: 'provisioning',
        actions: [
          {
            key: 'create-user',
            name: 'Create Entra ID User',
            description: 'Simulate provisioning a Microsoft 365/Entra ID user.',
            supportsBatching: true,
          },
          {
            key: 'assign-license',
            name: 'Assign Microsoft 365 License',
            description: 'Simulate assigning licenses to a user.',
            supportsBatching: true,
          },
          {
            key: 'enable-mailbox',
            name: 'Enable Exchange Mailbox',
            description: 'Simulate mailbox enablement for the user.',
            supportsBatching: false,
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
      reference: 'Microsoft 365',
    },
  },
  actions: {
    async ['create-user'](parameters, context) {
      const { email, firstName, lastName, licenses = [] } = parameters;
      if (!email || !firstName || !lastName) {
        throw new Error('create-user requires email, firstName, and lastName');
      }

      return buildResponse('create-user', {
        email,
        firstName,
        lastName,
        licenses,
        userId: `m365-${Buffer.from(email).toString('base64url').slice(0, 10)}`,
      }, context);
    },

    async ['assign-license'](parameters, context) {
      const { email, licenses = [] } = parameters;
      if (!email) {
        throw new Error('assign-license requires email');
      }

      return buildResponse('assign-license', {
        email,
        licenses,
      }, context);
    },

    async ['enable-mailbox'](parameters, context) {
      const { email } = parameters;
      if (!email) {
        throw new Error('enable-mailbox requires email');
      }

      return buildResponse('enable-mailbox', { email, mailboxStatus: 'enabled' }, context);
    },
  },
};
