import type { ConnectorContext, ConnectorImplementation } from '../types';

const buildResponse = (action: string, payload: Record<string, unknown>, context: ConnectorContext) => ({
  simulated: true,
  connector: 'confluence-cloud',
  action,
  metadata: context.metadata ?? {},
  timestamp: new Date().toISOString(),
  payload,
});

export const confluenceCloudConnector: ConnectorImplementation = {
  manifest: {
    id: 'confluence-cloud',
    version: '1.0.0',
    displayName: 'Confluence Cloud (Simulated)',
    description: 'Simulated connector for documenting deployments and operational runbooks in Confluence.',
    categories: ['compliance', 'notifications', 'reporting'],
    auth: [
      {
        type: 'api_key',
        headerName: 'Authorization',
        description: 'Confluence API token using Basic auth headers.',
        location: 'header',
      },
    ],
    capabilities: [
      {
        category: 'compliance',
        actions: [
          {
            key: 'publish-page',
            name: 'Publish Release Notes',
            description: 'Simulate publishing a Confluence page with release documentation.',
            supportsBatching: false,
          },
          {
            key: 'update-page',
            name: 'Update Documentation Page',
            description: 'Simulate updating an existing page with new content.',
            supportsBatching: false,
          },
          {
            key: 'attach-artifact',
            name: 'Attach Deployment Artifact',
            description: 'Simulate attaching files or evidence to a Confluence page.',
            supportsBatching: true,
          },
        ],
        events: [],
      },
      {
        category: 'reporting',
        actions: [
          {
            key: 'fetch-page',
            name: 'Fetch Documentation Page',
            description: 'Retrieve structured information about a Confluence page.',
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
      reference: 'Confluence Cloud',
    },
  },
  actions: {
    async ['publish-page'](parameters, context) {
      const { spaceKey, title, body, labels = [] } = parameters;
      if (!spaceKey || !title || !body) {
        throw new Error('publish-page requires spaceKey, title, and body');
      }

      return buildResponse('publish-page', {
        spaceKey,
        title,
        labels,
        pageId: `${spaceKey}-${Math.floor(Math.random() * 9000 + 1000)}`,
        url: `https://confluence.example.com/${spaceKey}/${encodeURIComponent(title)}`,
      }, context);
    },

    async ['update-page'](parameters, context) {
      const { pageId, body, version } = parameters;
      if (!pageId || !body) {
        throw new Error('update-page requires pageId and body');
      }

      return buildResponse('update-page', {
        pageId,
        body,
        version: version ?? Math.floor(Math.random() * 10 + 1),
        updatedAt: new Date().toISOString(),
      }, context);
    },

    async ['attach-artifact'](parameters, context) {
      const { pageId, artifactName, artifactUrl } = parameters;
      if (!pageId || !artifactName || !artifactUrl) {
        throw new Error('attach-artifact requires pageId, artifactName, and artifactUrl');
      }

      return buildResponse('attach-artifact', {
        pageId,
        artifactName,
        artifactUrl,
        attachedAt: new Date().toISOString(),
      }, context);
    },

    async ['fetch-page'](parameters, context) {
      const { pageId } = parameters;
      if (!pageId) {
        throw new Error('fetch-page requires pageId');
      }

      return buildResponse('fetch-page', {
        pageId,
        title: context.metadata?.defaultTitle ?? 'Simulated Change Documentation',
        status: 'current',
        lastUpdatedBy: 'automation@atlasit',
      }, context);
    },
  },
};
