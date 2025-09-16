import { getDefaultFetch } from '../auth';
import { retryWithBackoff } from '../retry';
import type { ConnectorImplementation, ConnectorContext } from '../types';

const defaultTeamEndpoint = 'https://api.dropboxapi.com/2/team';

const callDropboxApi = async <T>(
  context: ConnectorContext,
  route: string,
  body: Record<string, unknown>
): Promise<T> => {
  const simulate = context.metadata?.simulate !== false;
  const request = {
    route,
    body,
  };

  if (simulate) {
    return {
      simulated: true,
      connector: 'dropbox-business',
      request,
      timestamp: new Date().toISOString(),
      metadata: context.metadata ?? {},
    } as unknown as T;
  }

  const fetchImpl = context.fetchImpl ?? getDefaultFetch();
  const url = `${defaultTeamEndpoint}${route}`;

  return retryWithBackoff(async () => {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': context.authHeaders['Authorization'] || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const error = new Error(`Dropbox API request failed (${response.status}): ${errorBody}`);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    return (await response.json()) as T;
  }, context.retryOptions);
};

export const dropboxBusinessConnector: ConnectorImplementation = {
  manifest: {
    id: 'dropbox-business',
    version: '1.0.0',
    displayName: 'Dropbox Business',
    description: 'Automate Dropbox Business team management and file governance.',
    categories: ['provisioning', 'compliance'],
    auth: [
      {
        type: 'oauth2',
        authorizationUrl: 'https://www.dropbox.com/oauth2/authorize',
        tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
        scopes: ['team_info.read', 'team_data.member', 'team_data.content.write'],
        pkce: false,
      },
      {
        type: 'api_key',
        headerName: 'Authorization',
        location: 'header',
        description: 'Long-lived team access token using Bearer format.',
      },
    ],
    capabilities: [
      {
        category: 'provisioning',
        actions: [
          {
            key: 'provisionTeamMember',
            name: 'Provision Team Member',
            description: 'Invite a new member and assign default permissions.',
            supportsBatching: false,
          },
          {
            key: 'disableTeamMember',
            name: 'Disable Team Member',
            description: 'Suspend or remove a member from the team.',
            supportsBatching: false,
          },
        ],
        events: [
          {
            key: 'memberEvents',
            name: 'Member Activity',
            description: 'Webhook events related to team member lifecycle.',
            delivery: 'webhook',
            defaultCursorField: 'event_id',
          },
        ],
      },
      {
        category: 'compliance',
        actions: [
          {
            key: 'listTeamFolders',
            name: 'List Team Folders',
            description: 'Retrieve folders for auditing and sharing detection.',
            supportsBatching: false,
          },
        ],
        events: [],
      },
    ],
    webhooks: [
      {
        path: '/dropbox/webhook',
        description: 'Dropbox webhook receiver for team activity.',
        verification: {
          type: 'shared_secret',
          header: 'X-Dropbox-Signature',
        },
      },
    ],
    polling: [
      {
        intervalSeconds: 1800,
        description: 'Poll for sharing permissions and external collaborators.',
      },
    ],
    rateLimits: [
      {
        type: 'per_minute',
        limit: 1000,
      },
    ],
    metadata: {
      productUrl: 'https://dropbox.com/business',
      docsUrl: 'https://developers.dropbox.com/',
    },
  },
  actions: {
    async provisionTeamMember(parameters, context) {
      const { email, givenName, surname, sendWelcomeEmail = true } = parameters;
      if (!email || !givenName || !surname) {
        throw new Error('email, givenName, and surname are required for provisionTeamMember');
      }

      return callDropboxApi(context, '/members/add', {
        new_members: [
          {
            member_email: email,
            member_given_name: givenName,
            member_surname: surname,
            send_welcome_email: sendWelcomeEmail,
          },
        ],
      });
    },

    async disableTeamMember(parameters, context) {
      const { teamMemberId, wipeData = false } = parameters;
      if (!teamMemberId) {
        throw new Error('teamMemberId is required for disableTeamMember');
      }

      return callDropboxApi(context, '/members/disable', {
        user: {
          '.tag': 'team_member_id',
          team_member_id: teamMemberId,
        },
        wipe_data: wipeData,
      });
    },

    async listTeamFolders(parameters, context) {
      const { limit = 100 } = parameters;

      return callDropboxApi(context, '/team_folder/list', {
        limit,
      });
    },
  },
};
