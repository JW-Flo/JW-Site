import type { ConnectorResourceConfig } from '../engine/connectorTypes';
import type { RetryOptions } from '@atlasit/core';
import { AuthenticationManager, type AuthConfig } from '../services/authManager';

interface SimulatedConnectorProfile {
  authSystem: string;
  auth: AuthConfig;
  resource: {
    id: string;
    metadata?: Record<string, unknown>;
    retry?: RetryOptions;
    authRef?: string;
  };
  aliases?: string[];
}

const profiles: SimulatedConnectorProfile[] = [
  {
    authSystem: 'google-workspace',
    auth: {
      type: 'bearer',
      credentials: {
        token: 'SIMULATED_GOOGLE_ADMIN_TOKEN',
      },
      baseUrl: 'https://admin.googleapis.com',
      retryConfig: {
        maxAttempts: 3,
        backoffMs: 1000,
      },
    },
    resource: {
      id: 'google-workspace',
      metadata: {
        simulate: true,
        directorySnapshot: 'simulations/google-workspace/directory.json',
        licenseSnapshot: 'simulations/google-workspace/licenses.json',
      },
      retry: {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 15000,
        factor: 2,
        jitter: 'full',
      },
    },
    aliases: ['googleWorkspace', 'entraGoogle'],
  },
  {
    authSystem: 'activeDirectory',
    auth: {
      type: 'basic',
      credentials: {
        username: 'SIMULATED_AD_ADMIN',
        password: 'SIMULATED_PASSWORD',
      },
      baseUrl: 'https://graph.windows.net',
      retryConfig: {
        maxAttempts: 3,
        backoffMs: 1200,
      },
    },
    resource: {
      id: 'active-directory',
      metadata: {
        simulate: true,
        aliasOf: 'active-directory',
        displayName: 'Active Directory (Simulated)',
      },
      retry: {
        maxAttempts: 3,
        baseDelayMs: 1200,
        maxDelayMs: 20000,
        factor: 2,
        jitter: 'full',
      },
    },
    aliases: ['ad', 'entraId', 'entra-id'],
  },
  {
    authSystem: 'dropbox-business',
    auth: {
      type: 'bearer',
      credentials: {
        token: 'SIMULATED_DROPBOX_TEAM_TOKEN',
      },
      baseUrl: 'https://api.dropboxapi.com/2',
      retryConfig: {
        maxAttempts: 4,
        backoffMs: 800,
      },
    },
    resource: {
      id: 'dropbox-business',
      metadata: {
        simulate: true,
        teamSnapshot: 'simulations/dropbox/team.json',
      },
      retry: {
        maxAttempts: 4,
        baseDelayMs: 800,
        maxDelayMs: 20000,
        factor: 2,
        jitter: 'full',
      },
    },
    aliases: ['dropboxBusiness', 'dropbox'],
  },
  {
    authSystem: 'office365',
    auth: {
      type: 'bearer',
      credentials: {
        token: 'SIMULATED_MICROSOFT_GRAPH_TOKEN',
      },
      baseUrl: 'https://graph.microsoft.com/v1.0',
      retryConfig: {
        maxAttempts: 4,
        backoffMs: 900,
      },
    },
    resource: {
      id: 'microsoft-365',
      authRef: 'office365',
      metadata: {
        simulate: true,
        aliasOf: 'microsoft-365',
        displayName: 'Microsoft 365 (Simulated)',
      },
      retry: {
        maxAttempts: 4,
        baseDelayMs: 900,
        maxDelayMs: 22000,
        factor: 2,
        jitter: 'full',
      },
    },
    aliases: ['microsoft365', 'm365', 'entra'],
  },
  {
    authSystem: 'paycom-manual',
    auth: {
      type: 'api-key',
      credentials: {
        apiKey: 'SIMULATED_PAYCOM_API_KEY',
        headerName: 'X-API-Key',
      },
      baseUrl: 'https://api.paycom.com',
    },
    resource: {
      id: 'paycom-manual',
      metadata: {
        simulate: true,
        manual: true,
        workflowUrl: 'simulations/paycom/manual-workflow.json',
      },
      retry: {
        maxAttempts: 5,
        baseDelayMs: 1500,
        maxDelayMs: 30000,
        factor: 2,
        jitter: 'decorrelated',
      },
    },
    aliases: ['paycomManual', 'paycom'],
  },
  {
    authSystem: 'slack',
    auth: {
      type: 'api-key',
      credentials: {
        apiKey: 'SIMULATED_SLACK_BOT_TOKEN',
        headerName: 'Authorization',
      },
      baseUrl: 'https://slack.com/api',
    },
    resource: {
      id: 'slack-enterprise',
      authRef: 'slack',
      metadata: {
        simulate: true,
        aliasOf: 'slack-enterprise',
        displayName: 'Slack Enterprise (Simulated)',
      },
      retry: {
        maxAttempts: 3,
        baseDelayMs: 700,
        maxDelayMs: 15000,
        factor: 2,
        jitter: 'full',
      },
    },
    aliases: ['slackEnterprise', 'slackPlus'],
  },
  {
    authSystem: 'jira',
    auth: {
      type: 'api-key',
      credentials: {
        apiKey: 'SIMULATED_JIRA_TOKEN',
        headerName: 'Authorization',
      },
      baseUrl: 'https://jira.example.com/rest/api/3',
    },
    resource: {
      id: 'jira-cloud',
      authRef: 'jira',
      metadata: {
        simulate: true,
        aliasOf: 'jira-cloud',
        displayName: 'Jira Cloud (Simulated)',
      },
      retry: {
        maxAttempts: 4,
        baseDelayMs: 1000,
        maxDelayMs: 20000,
        factor: 2,
        jitter: 'full',
      },
    },
    aliases: ['jiraCloud', 'change-approvals'],
  },
  {
    authSystem: 'confluence',
    auth: {
      type: 'api-key',
      credentials: {
        apiKey: 'SIMULATED_CONFLUENCE_TOKEN',
        headerName: 'Authorization',
      },
      baseUrl: 'https://confluence.example.com/rest/api',
    },
    resource: {
      id: 'confluence-cloud',
      authRef: 'confluence',
      metadata: {
        simulate: true,
        aliasOf: 'confluence-cloud',
        displayName: 'Confluence Cloud (Simulated)',
      },
      retry: {
        maxAttempts: 3,
        baseDelayMs: 900,
        maxDelayMs: 18000,
        factor: 2,
        jitter: 'full',
      },
    },
    aliases: ['documentation', 'release-docs'],
  },
];

const createResourceMap = (): Record<string, ConnectorResourceConfig> => {
  const resources: Record<string, ConnectorResourceConfig> = {};

  for (const profile of profiles) {
    const config: ConnectorResourceConfig = {
      id: profile.resource.id,
      metadata: profile.resource.metadata,
      authRef: profile.resource.authRef ?? profile.authSystem,
      retry: profile.resource.retry,
    };

    resources[profile.authSystem] = config;
    for (const alias of profile.aliases ?? []) {
      resources[alias] = config;
    }
  }

  return resources;
};

export const SIMULATED_CONNECTOR_RESOURCES: Record<string, ConnectorResourceConfig> = createResourceMap();

export function registerSimulatedConnectorAuth(manager: AuthenticationManager): void {
  for (const profile of profiles) {
    manager.registerAuth(profile.authSystem, profile.auth);
  }
}

export function getSimulatedConnectorProfile(authSystem: string): SimulatedConnectorProfile | undefined {
  return profiles.find((profile) =>
    profile.authSystem === authSystem || (profile.aliases ?? []).includes(authSystem)
  );
}
