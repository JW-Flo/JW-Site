import { applyApiKey, getDefaultFetch } from '../auth';
import { retryWithBackoff } from '../retry';
import type { ConnectorImplementation } from '../types';

export const paycomManualConnector: ConnectorImplementation = {
  manifest: {
    id: 'paycom-manual',
    version: '1.0.0',
    displayName: 'Paycom Manual Connector',
    description: 'Provides manual trigger and polling hooks for Paycom where full automation is limited.',
    categories: ['provisioning', 'notifications'],
    auth: [
      {
        type: 'api_key',
        headerName: 'X-API-Key',
        location: 'header',
        description: 'Paycom API key issued per-tenant for manual operations.',
      },
      {
        type: 'basic',
        usernameField: { key: 'username', label: 'Console username', required: true, secret: false },
        passwordField: { key: 'password', label: 'Console password', required: true, secret: true },
      },
    ],
    capabilities: [
      {
        category: 'provisioning',
        actions: [
          {
            key: 'triggerManualSync',
            name: 'Trigger Manual Sync',
            description: 'Kick off a manual Paycom synchronization workflow and notify operators.',
            supportsBatching: false,
          },
          {
            key: 'checkStatus',
            name: 'Check Sync Status',
            description: 'Poll the manual sync endpoint for completion state.',
            supportsBatching: false,
          },
        ],
        events: [],
      },
      {
        category: 'notifications',
        actions: [
          {
            key: 'notifyOperators',
            name: 'Notify Operators',
            description: 'Send reminders to operators when manual intervention is required.',
            supportsBatching: false,
          },
        ],
        events: [],
      },
    ],
    polling: [
      {
        intervalSeconds: 600,
        description: 'Poll Paycom status endpoints for manual job updates.',
      },
    ],
    rateLimits: [
      {
        type: 'per_hour',
        limit: 200,
      },
    ],
    webhooks: [],
    metadata: {
      productUrl: 'https://www.paycom.com/',
      docsUrl: 'https://developer.paycom.com/',
    },
  },
  actions: {
    async triggerManualSync(parameters, context) {
      const { endpoint, payload = {}, method = 'POST' } = parameters;
      if (!endpoint) {
        throw new Error('endpoint is required for triggerManualSync');
      }

      const simulateFlag = context.metadata?.simulate !== false;
      const apiKeyHeader = Object.keys(context.authHeaders).find((key) => key.toLowerCase().includes('key'));
      const apiKeyValue = apiKeyHeader ? context.authHeaders[apiKeyHeader] : undefined;

      if (!apiKeyValue) {
        throw new Error('API key header missing from connector context');
      }

      if (simulateFlag) {
      return {
        simulated: true,
        connector: 'paycom-manual',
        request: {
          endpoint,
          method,
          payload,
        },
        dispatchedAt: new Date().toISOString(),
        metadata: context.metadata ?? {},
      };
      }

      const applyResult = applyApiKey(endpoint, apiKeyValue, {
        headerName: apiKeyHeader,
      });

      const url = new URL(endpoint);
      applyResult.searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });

      const headers = {
        ...context.authHeaders,
        ...applyResult.headers,
        'Content-Type': 'application/json',
      };

      const fetchImpl = context.fetchImpl ?? getDefaultFetch();

      return retryWithBackoff(async () => {
        const response = await fetchImpl(url.toString(), {
          method,
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          const error = new Error(`Paycom manual trigger failed (${response.status}): ${errorBody}`);
          (error as Error & { status?: number }).status = response.status;
          throw error;
        }

        if (response.status === 204) {
          return { success: true };
        }

        return response.json();
      }, context.retryOptions);
    },

    async checkStatus(parameters, context) {
      const { endpoint, jobId } = parameters;
      if (!endpoint || !jobId) {
        throw new Error('endpoint and jobId are required for checkStatus');
      }

      const simulateFlag = context.metadata?.simulate !== false;
      if (simulateFlag) {
        return {
          simulated: true,
          connector: 'paycom-manual',
          jobId,
          status: 'PENDING',
          checkedAt: new Date().toISOString(),
          metadata: context.metadata ?? {},
        };
      }

      const fetchImpl = context.fetchImpl ?? getDefaultFetch();
      const url = new URL(endpoint);
      url.searchParams.set('jobId', String(jobId));

      return retryWithBackoff(async () => {
        const response = await fetchImpl(url.toString(), {
          method: 'GET',
          headers: context.authHeaders,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          const error = new Error(`Paycom status polling failed (${response.status}): ${errorBody}`);
          (error as Error & { status?: number }).status = response.status;
          throw error;
        }

        return response.json();
      }, context.retryOptions);
    },

    async notifyOperators(parameters, context) {
      const { operators = [], message } = parameters;
      if (!operators.length) {
        throw new Error('At least one operator must be provided');
      }

      return {
        simulated: true,
        connector: 'paycom-manual',
        message: message || 'Manual Paycom action required',
        operators,
        notifiedAt: new Date().toISOString(),
        metadata: context.metadata ?? {},
      };
    },
  },
};
