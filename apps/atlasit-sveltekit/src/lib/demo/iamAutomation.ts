const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

type Integration = {
  id: string;
  name: string;
  description: string;
  mechanism: string;
  oktaGroup: string;
  automation: {
    level: 'full' | 'partial' | 'manual';
    summary: string;
    highlights: string[];
  };
  capabilities: {
    supportsScim: boolean;
    supportsXaas: boolean;
    connectors: Array<'joiner' | 'mover' | 'leaver'>;
    notes?: string;
  };
};

type WorkflowStep = {
  system: string;
  state: 'completed' | 'provisioning' | 'pending' | 'manual_required' | 'error';
  automation: 'automated' | 'manual';
  notes: string;
};

type WorkflowRun = {
  id: string;
  userId: string;
  persona: string;
  type: 'joiner' | 'mover' | 'leaver';
  status: 'completed' | 'provisioning' | 'pending' | 'failed';
  automationSummary: string;
  submittedAt: string;
  completedAt?: string;
  steps: WorkflowStep[];
};

type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  location: string;
  manager: string;
  startDate?: string;
  lifecycleState: 'Joiner' | 'Mover' | 'Active' | 'Leaver Pending';
  systems: string[];
  automationFlags: {
    sourceOfTruth: string;
    scimEnabled: boolean;
    provisioningPolicy: string;
  };
  recentChanges: string[];
};

type LifecycleEvent = {
  id: string;
  persona: string;
  type: 'joiner' | 'mover' | 'leaver';
  occursAt: string;
  summary: string;
  automated: boolean;
  surfacedIn: Array<'dashboard' | 'onboarding' | 'marketplace' | 'orchestrator'>;
};

type IamAutomationData = {
  users: DirectoryUser[];
  workflows: WorkflowRun[];
  integrations: Integration[];
  lifecycle: LifecycleEvent[];
};

export type AutomationAnalytics = {
  totalWorkflows: number;
  automatedSteps: number;
  manualSteps: number;
  manualSystems: Array<{ system: string; count: number }>;
  paycomManualSteps: number;
  joinerCount: number;
  moverCount: number;
  leaverCount: number;
};

const initialData: IamAutomationData = {
  users: [
    {
      id: 'EMP-1042',
      name: 'Maya Patel',
      email: 'maya.patel@atlasit.app',
      title: 'Senior Data Engineer',
      department: 'Data Platform',
      location: 'Austin, TX, USA',
      manager: 'Liam Carter',
      startDate: '2025-09-18',
      lifecycleState: 'Joiner',
      systems: ['Google Workspace', 'Snowflake', 'AWS', 'Atlassian'],
      automationFlags: {
        sourceOfTruth: 'Workday → Okta Lifecycle Policy',
        scimEnabled: true,
        provisioningPolicy: 'Joiner - Data Platform',
      },
      recentChanges: [
        'Joiner event processed 2 hours ago',
        'Snowflake role created via Terraform worker',
        'AWS SSO account pending confirmation email',
      ],
    },
    {
      id: 'EMP-0881',
      name: 'Andre Lowe',
      email: 'andre.lowe@atlasit.app',
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote - Denver, CO',
      manager: 'Sierra Jensen',
      lifecycleState: 'Mover',
      systems: ['Google Workspace', 'Salesforce', 'Gainsight'],
      automationFlags: {
        sourceOfTruth: 'Workday → Okta Lifecycle Policy',
        scimEnabled: true,
        provisioningPolicy: 'Mover - Success to Enterprise',
      },
      recentChanges: [
        'Department change approved yesterday',
        'Gainsight license upgraded automatically',
        'Salesforce permission set audit scheduled',
      ],
    },
    {
      id: 'EMP-0670',
      name: 'Paige Dorsey',
      email: 'paige.dorsey@atlasit.app',
      title: 'Payroll Analyst',
      department: 'Finance',
      location: 'Nashville, TN',
      manager: 'Dana Rios',
      lifecycleState: 'Active',
      systems: ['Google Workspace', 'Paycom HR', 'Netsuite'],
      automationFlags: {
        sourceOfTruth: 'Workday → Paycom export',
        scimEnabled: false,
        provisioningPolicy: 'Manual - Payroll exceptions',
      },
      recentChanges: [
        'Paycom HR task assigned for new earnings codes',
        'Manual XaaS catalog entry required (provider lacks API)',
      ],
    },
  ],
  workflows: [
    {
      id: 'JML-2025-09-17-01',
      userId: 'maya.patel',
      persona: 'Maya Patel',
      type: 'joiner',
      status: 'provisioning',
      automationSummary: '7 of 8 systems automated; Paycom requires task handoff',
      submittedAt: '2025-09-17T13:05:00Z',
      steps: [
        {
          system: 'Workday',
          state: 'completed',
          automation: 'automated',
          notes: 'New hire event consumed by HRIS webhook',
        },
        {
          system: 'Okta',
          state: 'completed',
          automation: 'automated',
          notes: 'Lifecycle policy assigned group memberships',
        },
        {
          system: 'Google Workspace',
          state: 'completed',
          automation: 'automated',
          notes: 'SCIM provisioning created account + group aliases',
        },
        {
          system: 'Snowflake',
          state: 'completed',
          automation: 'automated',
          notes: 'Terraform runner applied warehouse + role bindings',
        },
        {
          system: 'AWS SSO',
          state: 'provisioning',
          automation: 'automated',
          notes: 'Account creation queued in AWS Organizations',
        },
        {
          system: 'Atlassian',
          state: 'pending',
          automation: 'automated',
          notes: 'Awaiting SCIM delta sync (runs every 15 minutes)',
        },
        {
          system: 'Paycom HR',
          state: 'manual_required',
          automation: 'manual',
          notes: 'XaaS catalog not supported; finance operations ticket generated',
        },
      ],
    },
    {
      id: 'JML-2025-09-16-04',
      userId: 'andre.lowe',
      persona: 'Andre Lowe',
      type: 'mover',
      status: 'completed',
      automationSummary: 'Role change + license updates completed end-to-end',
      submittedAt: '2025-09-16T16:22:00Z',
      completedAt: '2025-09-16T16:40:00Z',
      steps: [
        {
          system: 'Workday',
          state: 'completed',
          automation: 'automated',
          notes: 'Manager initiated job change workflow',
        },
        {
          system: 'Okta',
          state: 'completed',
          automation: 'automated',
          notes: 'Rule evaluated department change and applied policies',
        },
        {
          system: 'Salesforce',
          state: 'completed',
          automation: 'automated',
          notes: 'Permission set group switched (Enterprise tier)',
        },
        {
          system: 'Gainsight',
          state: 'completed',
          automation: 'automated',
          notes: 'REST API call increased seat count and assigned playbooks',
        },
      ],
    },
    {
      id: 'JML-2025-09-15-02',
      userId: 'paige.dorsey',
      persona: 'Paige Dorsey',
      type: 'leaver',
      status: 'pending',
      automationSummary: 'Core SaaS disabled; payroll exit checklist pending HR sign-off',
      submittedAt: '2025-09-15T22:10:00Z',
      steps: [
        {
          system: 'Workday',
          state: 'completed',
          automation: 'automated',
          notes: 'Termination date synced to downstream systems',
        },
        {
          system: 'Okta',
          state: 'completed',
          automation: 'automated',
          notes: 'Grace period policy triggered staged deactivation',
        },
        {
          system: 'Google Workspace',
          state: 'completed',
          automation: 'automated',
          notes: 'Mailbox transfer scheduled to manager automatically',
        },
        {
          system: 'Paycom HR',
          state: 'manual_required',
          automation: 'manual',
          notes: 'Manual COBRA documentation required; automated reminder sent to HR',
        },
      ],
    },
  ],
  integrations: [
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      description: 'SCIM provisioning, group automation, calendar resource sync.',
      mechanism: 'SCIM + Admin SDK',
      oktaGroup: 'grp_google_workspace_core',
      automation: {
        level: 'full',
        summary: 'Joiner/Mover/Leaver fully automated with zero-touch routing.',
        highlights: [
          'SCIM handles identities and aliases instantly',
          'Drive + Calendar policies tied to lifecycle events',
          'Suspension triggers vault + takeout automation',
        ],
      },
      capabilities: {
        supportsScim: true,
        supportsXaas: true,
        connectors: ['joiner', 'mover', 'leaver'],
      },
    },
    {
      id: 'microsoft-entra',
      name: 'Microsoft 365 / Entra ID',
      description: 'Hybrid identity, role assignments, and Intune compliance.',
      mechanism: 'Graph API + SCIM',
      oktaGroup: 'grp_m365_core',
      automation: {
        level: 'full',
        summary: 'Group-based provisioning with conditional access hooks.',
        highlights: [
          'Role assignments synced from Okta to Entra',
          'Intune compliance sets deployed automatically',
        ],
      },
      capabilities: {
        supportsScim: true,
        supportsXaas: true,
        connectors: ['joiner', 'mover', 'leaver'],
      },
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'License management, permission set groups, territory alignment.',
      mechanism: 'REST API',
      oktaGroup: 'grp_salesforce_enterprise',
      automation: {
        level: 'partial',
        summary: 'Licenses automated; territory alignment needs manager approval.',
        highlights: [
          'Provision/deprovision seats via Flow + API integration',
          'Permission set groups derived from Okta roles',
        ],
      },
      capabilities: {
        supportsScim: false,
        supportsXaas: true,
        connectors: ['joiner', 'mover', 'leaver'],
        notes: 'Relies on custom Flow for mover approvals',
      },
    },
    {
      id: 'aws-iam-identity-center',
      name: 'AWS IAM Identity Center',
      description: 'Account provisioning & permission sets mapped from Okta.',
      mechanism: 'Provisioning Connector + API',
      oktaGroup: 'grp_aws_engineering',
      automation: {
        level: 'partial',
        summary: 'Accounts automated; permission set reviews remain manual quarterly.',
        highlights: [
          'Automated account + permission set assignment',
          'Terraform hooks for advanced roles',
        ],
      },
      capabilities: {
        supportsScim: true,
        supportsXaas: true,
        connectors: ['joiner', 'mover'],
        notes: 'Quarterly re-certification manual',
      },
    },
    {
      id: 'paycom',
      name: 'Paycom HR',
      description: 'Payroll and benefits administration with limited API coverage.',
      mechanism: 'Secure File Transfer + Limited API',
      oktaGroup: 'grp_payroll_specialists',
      automation: {
        level: 'manual',
        summary: 'Exports and tasks generated automatically but HR must execute steps.',
        highlights: [
          'HR ticket created with pre-filled checklist',
          'Benefit termination dates surfaced in dashboard',
        ],
      },
      capabilities: {
        supportsScim: false,
        supportsXaas: false,
        connectors: ['joiner', 'leaver'],
        notes: 'Provider does not support XaaS catalog ingestion; manual payroll steps required',
      },
    },
  ],
  lifecycle: [
    {
      id: 'life-001',
      persona: 'Maya Patel',
      type: 'joiner',
      occursAt: '2025-09-17T13:05:00Z',
      summary: 'Joiner workflow kicked off from Workday new hire event.',
      automated: true,
      surfacedIn: ['dashboard', 'onboarding', 'orchestrator'],
    },
    {
      id: 'life-002',
      persona: 'Andre Lowe',
      type: 'mover',
      occursAt: '2025-09-16T16:22:00Z',
      summary: 'Role change triggered license adjustments in Salesforce and Gainsight.',
      automated: true,
      surfacedIn: ['dashboard', 'onboarding'],
    },
    {
      id: 'life-003',
      persona: 'Paige Dorsey',
      type: 'leaver',
      occursAt: '2025-09-15T22:10:00Z',
      summary: 'Leaver workflow paused awaiting Paycom manual confirmation.',
      automated: false,
      surfacedIn: ['dashboard', 'onboarding', 'marketplace'],
    },
  ],
};

let state: IamAutomationData = clone(initialData);

export const getIamAutomationState = () => clone(state);

export const getIamAutomationSection = (type: string | null) => {
  const data = getIamAutomationState();
  switch (type) {
    case 'users':
      return data.users;
    case 'workflows':
      return data.workflows;
    case 'integrations':
      return data.integrations;
    case 'lifecycle':
      return data.lifecycle;
    case 'analytics':
      return getIamAutomationAnalytics();
    case 'summary':
    case null:
    case undefined:
      return data;
    default:
      throw new Error(`Unsupported IAM automation type: ${type}`);
  }
};

export const resetIamAutomationState = () => {
  state = clone(initialData);
  return getIamAutomationState();
};

export const getIamAutomationAnalytics = (): AutomationAnalytics => {
  const data = getIamAutomationState();
  let automatedSteps = 0;
  let manualSteps = 0;
  const manualSystems = new Map<string, number>();
  const typeCounts: Record<'joiner' | 'mover' | 'leaver', number> = {
    joiner: 0,
    mover: 0,
    leaver: 0,
  };

  data.workflows.forEach((workflow) => {
    typeCounts[workflow.type] += 1;
    workflow.steps.forEach((step) => {
      if (step.automation === 'automated') {
        automatedSteps += 1;
      } else {
        manualSteps += 1;
        manualSystems.set(step.system, (manualSystems.get(step.system) ?? 0) + 1);
      }
    });
  });

  return {
    totalWorkflows: data.workflows.length,
    automatedSteps,
    manualSteps,
    manualSystems: Array.from(manualSystems.entries()).map(([system, count]) => ({ system, count })),
    paycomManualSteps: manualSystems.get('Paycom HR') ?? 0,
    joinerCount: typeCounts.joiner,
    moverCount: typeCounts.mover,
    leaverCount: typeCounts.leaver,
  };
};

export const recordLifecycleEvent = (event: Partial<LifecycleEvent> & { persona?: string; type?: 'joiner' | 'mover' | 'leaver'; summary?: string }) => {
  if (!event.persona || !event.summary || !event.type) {
    throw new Error('Lifecycle events require persona, summary, and type');
  }
  const now = new Date().toISOString();
  const newEvent: LifecycleEvent = {
    id: `life-${Date.now()}`,
    occursAt: now,
    automated: event.automated ?? true,
    persona: event.persona,
    type: event.type,
    summary: event.summary,
    surfacedIn: event.surfacedIn ?? ['dashboard', 'onboarding'],
  } as LifecycleEvent;

  state.lifecycle = [newEvent, ...state.lifecycle].slice(0, 15);
  return clone(newEvent);
};
