import type { APIRoute } from 'astro';

type IntegrationKey = 'okta' | 'aws' | 'entra' | 'ad' | 'google' | 'knowbe4';

type StepState = 'pending' | 'provisioning' | 'completed' | 'error' | 'removed';

interface IntegrationDescriptor {
  id: IntegrationKey;
  name: string;
  description: string;
  oktaGroup: string;
  mechanism: string;
  references: string[];
}

interface JoinerWorkflowStep {
  system: IntegrationKey;
  state: StepState;
  logs: string[];
  lastUpdated: number;
}

interface JoinerWorkflow {
  id: string;
  userId: string;
  requester: string;
  submittedAt: number;
  targetSystems: IntegrationKey[];
  steps: JoinerWorkflowStep[];
  status: 'pending' | 'in-flight' | 'completed' | 'failed';
}

interface DirectoryUser {
  id: string;
  name: string;
  title: string;
  location: string;
  email: string;
  oktaGroups: string[];
  systems: IntegrationKey[];
}

// --- Action Request Type System (added for stronger type safety on POST handler) ---
interface StartWorkflowActionRequest {
  action: 'start-workflow';
  userId: string;
  requester?: string;
  systems?: IntegrationKey[]; // Optional subset/ordering for target systems
}

interface AdvanceWorkflowActionRequest {
  action: 'advance-workflow';
  workflowId: string;
  system: IntegrationKey;
  outcome?: StepState; // Defaults to 'completed' in handler
  note?: string;
}

interface SyncGroupsActionRequest {
  action: 'sync-groups';
  userId: string;
  groups: string[]; // Replacement list of Okta group names
}

interface ResetActionRequest {
  action: 'reset';
}

type AutomationActionRequest =
  | StartWorkflowActionRequest
  | AdvanceWorkflowActionRequest
  | SyncGroupsActionRequest
  | ResetActionRequest;

// Type guards (lightweight – defensive runtime validation will live in parsing helper)
function isStartWorkflowAction(v: any): v is StartWorkflowActionRequest {
  return v?.action === 'start-workflow' && typeof v?.userId === 'string';
}
function isAdvanceWorkflowAction(v: any): v is AdvanceWorkflowActionRequest {
  return v?.action === 'advance-workflow' && typeof v?.workflowId === 'string' && typeof v?.system === 'string';
}
function isSyncGroupsAction(v: any): v is SyncGroupsActionRequest {
  return v?.action === 'sync-groups' && typeof v?.userId === 'string' && Array.isArray(v?.groups);
}
function isResetAction(v: any): v is ResetActionRequest {
  return v?.action === 'reset';
}

const integrationCatalog: IntegrationDescriptor[] = [
  {
    id: 'okta',
    name: 'Okta Identity Cloud',
    description: 'System of record for Joiner/Mover/Leaver events. Drives downstream provisioning via groups and workflows.',
    oktaGroup: 'AtlasIT Workforce',
    mechanism: 'Okta Workflows + API triggers',
    references: [
      'IAM_AUTOMATION_OVERVIEW.md#1-okta-as-the-central-idp',
    ],
  },
  {
    id: 'aws',
    name: 'AWS IAM (Terraform)',
    description: 'Terraform pipelines provision IAM roles, policies, and access keys in AWS when Okta assigns AWS Access.',
    oktaGroup: 'AWS Access',
    mechanism: 'Terraform + AWS IAM provider',
    references: [
      'IAM_AUTOMATION_OVERVIEW.md#2-aws-iam-automation-via-terraform',
      'atlasit/terraform/aws-iam-demo/',
    ],
  },
  {
    id: 'entra',
    name: 'Microsoft Entra ID',
    description: 'Okta Microsoft 365 integration provisions users and assigns groups/roles in Entra ID.',
    oktaGroup: 'Azure Access',
    mechanism: 'Okta + Entra ID connector (SCIM/Graph API)',
    references: ['IAM_AUTOMATION_OVERVIEW.md#3-microsoft-entra-id-azure-ad-integration'],
  },
  {
    id: 'ad',
    name: 'Active Directory',
    description: 'Okta AD Agent syncs users and group membership with on-prem Active Directory.',
    oktaGroup: 'AD Access',
    mechanism: 'Okta AD Agent',
    references: ['IAM_AUTOMATION_OVERVIEW.md#4-active-directory-ad-integration'],
  },
  {
    id: 'google',
    name: 'Google Workspace',
    description: 'Okta Google Workspace integration provisions accounts and manages groups.',
    oktaGroup: 'Google Workspace Access',
    mechanism: 'Okta Google Workspace (SCIM) integration',
    references: ['IAM_AUTOMATION_OVERVIEW.md#5-google-workspace-g-suite-integration'],
  },
  {
    id: 'knowbe4',
    name: 'KnowBe4 Security Awareness',
    description: 'Okta KnowBe4 integration provisions users for security awareness campaigns.',
    oktaGroup: 'KnowBe4 Access',
    mechanism: 'Okta KnowBe4 integration (SCIM/API)',
    references: ['IAM_AUTOMATION_OVERVIEW.md#6-knowbe4-integration'],
  },
];

const initialUsers: DirectoryUser[] = [
  {
    id: 'u-okta-001',
    name: 'Jordan Miles',
    title: 'Security Engineer',
    email: 'jordan.miles@atlasit.pro',
    location: 'Austin, TX',
    oktaGroups: ['AWS Access', 'Google Workspace Access'],
    systems: ['okta', 'aws', 'google'],
  },
  {
    id: 'u-okta-002',
    name: 'Farah Castillo',
    title: 'Identity Governance Lead',
    email: 'farah.castillo@atlasit.pro',
    location: 'Denver, CO',
    oktaGroups: ['Azure Access', 'KnowBe4 Access'],
    systems: ['okta', 'entra', 'knowbe4'],
  },
  {
    id: 'u-okta-003',
    name: 'Maya Greene',
    title: 'Clinical Data Analyst',
    email: 'maya.greene@atlasit.pro',
    location: 'Boston, MA',
    oktaGroups: ['AD Access', 'Google Workspace Access'],
    systems: ['okta', 'ad', 'google'],
  },
];

let users = deepClone(initialUsers);
let workflows: JoinerWorkflow[] = [];

const oktaSystemFirst = (systems: IntegrationKey[]): IntegrationKey[] => {
  const unique = Array.from(new Set(systems));
  if (!unique.includes('okta')) {
    unique.unshift('okta');
  }
  return unique;
};

function createWorkflow(userId: string, requester: string, targetSystems: IntegrationKey[]): JoinerWorkflow {
  const id = `wf-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const orderedSystems = oktaSystemFirst(targetSystems);
  const steps = orderedSystems.map<JoinerWorkflowStep>((system) => ({
    system,
    state: system === 'okta' ? 'completed' : 'pending',
    logs:
      system === 'okta'
        ? ['Okta group assignment recorded']
        : ['Waiting for Okta trigger from orchestrator'],
    lastUpdated: Date.now(),
  }));
  return {
    id,
    userId,
    requester,
    submittedAt: Date.now(),
    targetSystems: orderedSystems,
    steps,
    status: orderedSystems.length === 1 ? 'completed' : 'in-flight',
  };
}

function findIntegration(system: IntegrationKey) {
  return integrationCatalog.find((integration) => integration.id === system);
}

function applySystemOutcome(userId: string, system: IntegrationKey, outcome: StepState) {
  const user = users.find((u) => u.id === userId);
  if (!user) return;
  if (!Array.isArray(user.systems)) {
    user.systems = [];
  }
  if (outcome === 'completed' && !user.systems.includes(system)) {
    user.systems.push(system);
  }
  if (outcome === 'removed') {
    user.systems = user.systems.filter((entry) => entry !== system);
  }
}

function advanceWorkflow(workflow: JoinerWorkflow, system: IntegrationKey, outcome: StepState, note?: string) {
  const step = workflow.steps.find((s) => s.system === system);
  if (!step) return;
  step.state = outcome;
  step.lastUpdated = Date.now();
  const integration = findIntegration(system);
  const label = integration?.name ?? system.toUpperCase();
  step.logs.push(`Status changed to ${outcome} at ${new Date().toISOString()}`);
  if (note) step.logs.push(note);
  if (outcome === 'completed') {
    step.logs.push(`Provisioned via ${label}`);
  }
  if (outcome === 'removed') {
    step.logs.push(`Deprovisioned via ${label}`);
  }
  applySystemOutcome(workflow.userId, system, outcome);
  if (outcome === 'error') {
    workflow.status = 'failed';
    return;
  }
  workflow.steps = workflow.steps.map((s) => {
    if (s.state === 'pending' && workflow.status !== 'failed') {
      s.state = 'provisioning';
      s.logs.push(`Provisioning started at ${new Date().toISOString()}`);
      s.lastUpdated = Date.now();
      workflow.status = 'in-flight';
      return s;
    }
    return s;
  });
  if (workflow.steps.every((s) => ['completed', 'removed'].includes(s.state) || s.system === 'okta')) {
    workflow.status = 'completed';
  }
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function resetState() {
  users = deepClone(initialUsers);
  workflows = [];
}

// Exported test helper expected by demoFlows.test and demo reset API route.
// It performs an in-memory reset of IAM automation demo data so tests start
// from a clean deterministic baseline without cross-test pollution.
export function resetIamAutomationDemoData() {
  resetState();
  return { users: users.length, workflows: workflows.length };
}

function serializeWorkflow(workflow: JoinerWorkflow) {
  return {
    ...workflow,
    steps: workflow.steps.map((step) => ({
      ...step,
      logs: step.logs.slice(-5),
    })),
  };
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  switch (type) {
    case 'users':
      return new Response(JSON.stringify(users));
    case 'integrations':
      return new Response(JSON.stringify(integrationCatalog));
    case 'workflows':
      return new Response(JSON.stringify(workflows.map(serializeWorkflow)));
    default:
      return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const raw = await request.json();
    const body: AutomationActionRequest | undefined = ((): AutomationActionRequest | undefined => {
      if (isStartWorkflowAction(raw)) return raw;
      if (isAdvanceWorkflowAction(raw)) return raw;
      if (isSyncGroupsAction(raw)) return raw;
      if (isResetAction(raw)) return raw;
      return undefined;
    })();
    if (!body) {
      return new Response(JSON.stringify({ error: 'Missing or invalid action' }), { status: 400 });
    }

    switch (body.action) {
      case 'start-workflow': {
        const { userId, requester = 'okta-demo@atlasit.pro', systems } = body;
        const user = users.find((u) => u.id === userId);
        if (!user) {
          return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }
        const targetSystems: IntegrationKey[] = systems?.length ? systems : ['aws', 'entra', 'ad', 'google', 'knowbe4'];
        const wf = createWorkflow(userId, requester, targetSystems);
        workflows.push(wf);
        return new Response(JSON.stringify(serializeWorkflow(wf)), { status: 201 });
      }
      case 'advance-workflow': {
        const { workflowId, system, outcome = 'completed', note } = body;
        const wf = workflows.find((w) => w.id === workflowId);
        if (!wf) {
          return new Response(JSON.stringify({ error: 'Workflow not found' }), { status: 404 });
        }
        advanceWorkflow(wf, system, outcome, note);
        return new Response(JSON.stringify(serializeWorkflow(wf)));
      }
      case 'sync-groups': {
        const { userId, groups } = body;
        const user = users.find((u) => u.id === userId);
        if (!user) {
          return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }
        user.oktaGroups = Array.from(new Set(groups));
        return new Response(JSON.stringify(user));
      }
      case 'reset': {
        resetState();
        return new Response(JSON.stringify({ success: true }));
      }
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'Unknown error' }), { status: 500 });
  }
};
