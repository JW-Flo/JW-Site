import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { OktaStyleWorkflowEngine, type OktaStyleWorkflow } from './oktaStyleWorkflowEngine';

describe('OktaStyleWorkflowEngine simulated connectors', () => {
  it('resolves connector aliases and surfaces simulation metadata', async () => {
    const engine = new OktaStyleWorkflowEngine('tenant-sim');

    const workflow: OktaStyleWorkflow = {
      name: 'Simulated Connector Workflow',
      description: 'Validates alias resolution for simulated connectors.',
      version: '1.0.0',
      resources: {
        idp: {},
      },
      cards: [
        {
          id: 'trigger-card',
          type: 'trigger',
          name: 'Inbound Request',
          config: {
            schema: {
              email: z.string().email(),
              firstName: z.string(),
              lastName: z.string(),
              department: z.string(),
            },
          },
          outputs: {
            userData: 'userData',
          },
        },
        {
          id: 'ad-step',
          type: 'connector-action',
          name: 'Provision Directory',
          config: {
            connector: 'activeDirectory',
            action: 'create-user',
            parameters: {
              email: '{{userData.email}}',
              firstName: '{{userData.firstName}}',
              lastName: '{{userData.lastName}}',
              department: '{{userData.department}}',
              groups: ['Engineering'],
            },
          },
        },
        {
          id: 'office-step',
          type: 'connector-action',
          name: 'Provision Microsoft 365',
          config: {
            connector: 'office365',
            action: 'create-user',
            parameters: {
              email: '{{userData.email}}',
              firstName: '{{userData.firstName}}',
              lastName: '{{userData.lastName}}',
              licenses: ['E3', 'Teams'],
            },
          },
        },
        {
          id: 'slack-step',
          type: 'connector-action',
          name: 'Invite to Slack',
          config: {
            connector: 'slack',
            action: 'invite-user',
            parameters: {
              email: '{{userData.email}}',
              channels: ['engineering'],
            },
          },
        },
      ],
      connections: [
        { from: 'trigger-card', to: 'ad-step', type: 'flow' },
        { from: 'ad-step', to: 'office-step', type: 'flow' },
        { from: 'office-step', to: 'slack-step', type: 'flow' },
      ],
      variables: {
        global: {},
        flow: {
          userData: null,
        },
      },
      errorHandling: {
        retryPolicy: {
          maxAttempts: 1,
          backoffMs: 100,
          exponential: false,
        },
      },
    };

    const input = {
      email: 'engineer@example.com',
      firstName: 'Engi',
      lastName: 'Neer',
      department: 'Engineering',
    };

    const result = await engine.executeWorkflow(workflow, input);

    expect(result.success).toBe(true);

    const adState = result.cardStates['ad-step'];
    expect(adState.connector).toBe('active-directory');
    expect(adState.metadata?.simulate).toBe(true);

    const officeState = result.cardStates['office-step'];
    expect(officeState.connector).toBe('microsoft-365');
    expect(officeState.metadata?.simulate).toBe(true);
    expect(officeState.output.payload.email).toBe(input.email);

    const slackState = result.cardStates['slack-step'];
    expect(slackState.connector).toBe('slack-enterprise');
    expect(slackState.metadata?.simulate).toBe(true);
    expect(slackState.output.simulated).toBe(true);
    expect(slackState.output.metadata).toMatchObject({ simulate: true });
  });

  it('runs change-management approvals via Jira with auto-documentation in Confluence', async () => {
    const engine = new OktaStyleWorkflowEngine('tenant-change');

    const workflow: OktaStyleWorkflow = {
      name: 'Change Management Workflow',
      description: 'Simulates a deployment requiring Jira approvals and Confluence documentation.',
      version: '1.0.0',
      resources: {
        idp: {},
      },
      cards: [
        {
          id: 'trigger-card',
          type: 'trigger',
          name: 'Deployment Request',
          config: {
            schema: {
              service: z.string(),
              summary: z.string(),
              description: z.string(),
            },
          },
          outputs: {
            change: 'change',
          },
        },
        {
          id: 'create-jira',
          type: 'connector-action',
          name: 'Create Change Ticket',
          config: {
            connector: 'jira',
            action: 'create-issue',
            parameters: {
              projectKey: 'OPS',
              summary: '{{change.summary}}',
              description: '{{change.description}}',
              changeType: 'Standard',
              approvers: ['ops-lead@example.com'],
            },
          },
        },
        {
          id: 'approve-jira',
          type: 'connector-action',
          name: 'Approve Change Ticket',
          config: {
            connector: 'jira',
            action: 'transition-issue',
            parameters: {
              issueKey: '{{card.create-jira.output.payload.issueKey}}',
              status: 'Approved',
            },
          },
        },
        {
          id: 'document-change',
          type: 'connector-action',
          name: 'Publish Documentation',
          config: {
            connector: 'confluence',
            action: 'publish-page',
            parameters: {
              spaceKey: 'OPS',
              title: '{{change.summary}}',
              body: '{{change.description}}',
              labels: ['change-management', '{{change.service}}'],
            },
          },
        },
      ],
      connections: [
        { from: 'trigger-card', to: 'create-jira', type: 'flow' },
        { from: 'create-jira', to: 'approve-jira', type: 'flow' },
        { from: 'approve-jira', to: 'document-change', type: 'flow' },
      ],
      variables: {
        global: {},
        flow: {
          change: null,
        },
      },
    };

    const input = {
      service: 'directory-service',
      summary: 'Deploy v2.1.0 to production',
      description: 'Includes security patches and performance optimisations.',
    };

    const result = await engine.executeWorkflow(workflow, input);
    expect(result.success).toBe(true);

    const createState = result.cardStates['create-jira'];
    expect(createState.connector).toBe('jira-cloud');
    expect(createState.metadata?.simulate).toBe(true);
    expect(createState.output.payload.approvers).toContain('ops-lead@example.com');

    const approveState = result.cardStates['approve-jira'];
    expect(approveState.connector).toBe('jira-cloud');
    expect(approveState.output.payload.status).toBe('Approved');

    const docState = result.cardStates['document-change'];
    expect(docState.connector).toBe('confluence-cloud');
    expect(docState.output.payload.title).toBe(input.summary);
    expect(docState.output.metadata?.simulate).toBe(true);
  });
});
