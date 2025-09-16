import type { ConnectorImplementation, ConnectorContext } from '../types';

const buildResponse = (action: string, payload: Record<string, unknown>, context: ConnectorContext) => ({
  simulated: true,
  connector: 'active-directory',
  action,
  metadata: context.metadata ?? {},
  timestamp: new Date().toISOString(),
  payload,
});

export const activeDirectoryConnector: ConnectorImplementation = {
  manifest: {
    id: 'active-directory',
    version: '1.0.0',
    displayName: 'Active Directory (Simulated)',
    description: 'Simulated Active Directory connector for workflow testing and demos.',
    categories: ['identity', 'provisioning'],
    auth: [
      {
        type: 'basic',
        usernameField: { key: 'username', label: 'Directory admin user', required: true, secret: false },
        passwordField: { key: 'password', label: 'Directory admin password', required: true, secret: true },
      },
    ],
    capabilities: [
      {
        category: 'provisioning',
        actions: [
          {
            key: 'create-user',
            name: 'Create Directory User',
            description: 'Simulate provisioning a directory user with group membership.',
            supportsBatching: true,
          },
          {
            key: 'disable-user',
            name: 'Disable Directory User',
            description: 'Simulate disabling or locking a directory account.',
            supportsBatching: false,
          },
          {
            key: 'assign-groups',
            name: 'Assign Groups',
            description: 'Simulate group assignments for a directory user.',
            supportsBatching: true,
          },
        ],
        events: [],
      },
    ],
    polling: [],
    webhooks: [],
    rateLimits: [],
    metadata: {
      simulate: true,
      reference: 'Active Directory',
    },
  },
  actions: {
    async ['create-user'](parameters, context) {
      const { email, firstName, lastName, department, groups = [] } = parameters;
      if (!email || !firstName || !lastName) {
        throw new Error('create-user requires email, firstName, and lastName');
      }

      return buildResponse('create-user', {
        email,
        firstName,
        lastName,
        department,
        groups,
        accountId: `ad-${Buffer.from(email).toString('hex').slice(0, 8)}`,
      }, context);
    },

    async ['disable-user'](parameters, context) {
      const { email, reason = 'not supplied' } = parameters;
      if (!email) {
        throw new Error('disable-user requires email');
      }

      return buildResponse('disable-user', { email, reason }, context);
    },

    async ['assign-groups'](parameters, context) {
      const { email, groups = [] } = parameters;
      if (!email) {
        throw new Error('assign-groups requires email');
      }

      return buildResponse('assign-groups', { email, groups }, context);
    },
  },
};
