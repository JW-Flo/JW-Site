import { buildOAuth2AuthorizationUrl, createPkcePair, getDefaultFetch } from '../auth';
import { retryWithBackoff, type RetryOptions } from '../retry';
import type { ConnectorImplementation, ConnectorContext } from '../types';

const defaultRetry: RetryOptions = {
  maxAttempts: 4,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  jitter: 'full',
  factor: 2,
};

const callGoogleApi = async <T>(
  context: ConnectorContext,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  query?: Record<string, string | undefined>
): Promise<T> => {
  const simulate = context.metadata?.simulate !== false;

  const requestDetails = {
    method,
    path,
    body,
    query,
  };

  if (simulate) {
    return {
      simulated: true,
      request: requestDetails,
      connector: 'google-workspace',
      timestamp: new Date().toISOString(),
      metadata: context.metadata ?? {},
    } as unknown as T;
  }

  const fetchImpl = context.fetchImpl ?? getDefaultFetch();
  const url = new URL(path, 'https://admin.googleapis.com');
  for (const [key, value] of Object.entries(query || {})) {
    if (typeof value !== 'undefined') {
      url.searchParams.set(key, value);
    }
  }

  return retryWithBackoff(async () => {
    const response = await fetchImpl(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...context.authHeaders,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error(
        `Google Workspace API request failed (${response.status}): ${errorBody}`
      );
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    if (response.status === 204) {
      return { success: true } as unknown as T;
    }

    const result = (await response.json()) as T;
    return result;
  }, context.retryOptions ?? defaultRetry);
};

export const googleWorkspaceConnector: ConnectorImplementation = {
  manifest: {
    id: 'google-workspace',
    version: '1.0.0',
    displayName: 'Google Workspace',
    description: 'Manage Google Workspace users, groups, and licenses via Admin SDK and Directory APIs.',
    categories: ['identity', 'provisioning'],
    auth: [
      {
        type: 'oauth2',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: [
          'https://www.googleapis.com/auth/admin.directory.user',
          'https://www.googleapis.com/auth/admin.directory.group',
          'https://www.googleapis.com/auth/apps.groups.migration',
        ],
        defaultScopes: [
          'https://www.googleapis.com/auth/admin.directory.user.readonly',
        ],
        pkce: true,
      },
      {
        type: 'service_account',
          fields: [
            { key: 'client_email', label: 'Service account email', required: true, secret: false },
            { key: 'private_key', label: 'Private key', required: true, secret: true },
            { key: 'delegated_user', label: 'Delegated admin user', required: true, secret: false },
          ],
      },
    ],
    capabilities: [
      {
        category: 'provisioning',
        actions: [
            {
              key: 'createUser',
              name: 'Create Directory User',
              description: 'Provision a user account with profile, password, and org unit.',
              supportsBatching: true,
            },
            {
              key: 'suspendUser',
              name: 'Suspend User',
              description: 'Disable an account and optionally archive associated licenses.',
              supportsBatching: false,
            },
            {
              key: 'listGroups',
              name: 'List Groups',
              description: 'Fetch all groups for a domain or org unit.',
              supportsBatching: false,
            },
        ],
        events: [
          {
            key: 'adminActivity',
            name: 'Admin Activity',
            description: 'Receives admin audit events via Pub/Sub push.',
            delivery: 'webhook',
            defaultCursorField: 'id.time',
          },
        ],
      },
    ],
    webhooks: [
      {
        path: '/google-workspace/events',
        description: 'Endpoint for Google Workspace admin activity notifications.',
        verification: {
          type: 'public_key',
          header: 'X-Goog-Signature',
        },
      },
    ],
    polling: [
      {
        intervalSeconds: 900,
        description: 'Periodic sync of suspended accounts and group memberships.',
      },
    ],
    rateLimits: [
      {
        type: 'per_minute',
        limit: 1500,
      },
    ],
    metadata: {
      productUrl: 'https://workspace.google.com/',
      docsUrl: 'https://developers.google.com/admin-sdk',
    },
  },
  actions: {
    async createUser(parameters, context) {
      const { primaryEmail, givenName, familyName, password, orgUnitPath } = parameters;

      if (!primaryEmail || !givenName || !familyName || !password) {
        throw new Error('Missing required parameters for createUser');
      }

      return callGoogleApi(context, 'POST', '/admin/directory/v1/users', {
        primaryEmail,
        password,
        name: {
          givenName,
          familyName,
        },
        orgUnitPath,
      });
    },

    async suspendUser(parameters, context) {
      const { userKey, suspended = true } = parameters;
      if (!userKey) {
        throw new Error('Missing userKey parameter for suspendUser');
      }

      return callGoogleApi(context, 'PUT', `/admin/directory/v1/users/${encodeURIComponent(userKey)}`, {
        suspended,
      });
    },

    async listGroups(parameters, context) {
      const { domain, userKey } = parameters;

      return callGoogleApi<{ groups?: unknown[] }>(
        context,
        'GET',
        '/admin/directory/v1/groups',
        undefined,
        {
          domain,
          userKey,
        }
      );
    },

    async buildAuthorizationUrl(parameters) {
      const { clientId, redirectUri, scopes = [], state } = parameters;
      if (!clientId || !redirectUri) {
        throw new Error('clientId and redirectUri are required to build authorization URL');
      }

      const pkce = parameters.pkce !== false ? createPkcePair() : undefined;

      const url = buildOAuth2AuthorizationUrl({
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        clientId,
        redirectUri,
        scopes: scopes.length ? scopes : [
          'https://www.googleapis.com/auth/admin.directory.user.readonly',
        ],
        state,
        codeChallenge: pkce?.challenge,
        codeChallengeMethod: pkce ? 'S256' : undefined,
      });

      return Promise.resolve({
        authorizationUrl: url,
        codeVerifier: pkce?.verifier,
      });
    },
  },
};
