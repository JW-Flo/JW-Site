export type DemoUserStatus = 'Active' | 'Provisioning' | 'Pending Approval' | 'Suspended' | 'Dormant';

export interface DemoUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  company: string;
  role: string;
  department: string;
  status: DemoUserStatus;
  onboardingStage: 'Discovery' | 'Provisioning' | 'Approvals' | 'Completed';
  location: string;
  manager: string;
  startDate: string;
  lastActive: string;
  persona: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface DemoApprovalStep {
  stage: 'Requester' | 'Manager' | 'Security' | 'Compliance' | 'Automation';
  approver: string;
  status: 'approved' | 'pending' | 'denied';
  completedAt?: string;
}

export interface DemoOnboardingRequest {
  id: string;
  userId: string;
  title: string;
  status: 'pending' | 'in-flight' | 'completed' | 'denied';
  submittedAt: string;
  targetGroups: string[];
  targetApps: string[];
  approvals: DemoApprovalStep[];
  slaMinutes: number;
}

export interface DemoMetricSummary {
  activeUsers: number;
  pendingRequests: number;
  connectedSystems: number;
  activeWorkflows: number;
  securityScore: number;
  automationCoverage: number;
  avgProvisioningTimeMinutes: number;
  trends: DemoMetricTrend;
}

export interface DemoMetricTrend {
  weeklyActiveUsers: number[];
  monthlySecurityScore: number[];
  automationCoverage: number[];
  onboardingCompletionMinutes: number[];
}

export interface DemoActivityItem {
  id: string;
  type: 'onboarding' | 'security' | 'automation' | 'compliance';
  title: string;
  description: string;
  timestamp: string;
  relativeTime: string;
  status: 'success' | 'warning' | 'info';
}

export const demoUsers: DemoUser[] = [
  {
    id: 'demo-usr-001',
    tenantId: 'acme-robotics',
    name: 'Jordan Miles',
    email: 'jordan.miles@acme.ai',
    company: 'Acme Robotics',
    role: 'Security Engineer',
    department: 'Security Operations',
    status: 'Active',
    onboardingStage: 'Completed',
    location: 'Austin, TX',
    manager: 'Priya Patel',
    startDate: '2024-11-04',
    lastActive: '2025-01-16T13:42:00Z',
    persona: 'Zero Trust Champion',
    riskLevel: 'Low',
  },
  {
    id: 'demo-usr-002',
    tenantId: 'northwind-energy',
    name: 'Farah Castillo',
    email: 'fcastillo@northwind.energy',
    company: 'Northwind Energy',
    role: 'Identity Governance Lead',
    department: 'IT Governance',
    status: 'Provisioning',
    onboardingStage: 'Provisioning',
    location: 'Denver, CO',
    manager: 'Miguel Alvarez',
    startDate: '2025-01-08',
    lastActive: '2025-01-16T12:05:00Z',
    persona: 'Segregation-of-Duties SME',
    riskLevel: 'Medium',
  },
  {
    id: 'demo-usr-003',
    tenantId: 'stellar-bank',
    name: 'Lena Novik',
    email: 'lena.novik@stellarbank.com',
    company: 'Stellar Bank',
    role: 'Cloud Administrator',
    department: 'Cloud Platform',
    status: 'Pending Approval',
    onboardingStage: 'Approvals',
    location: 'Toronto, ON',
    manager: 'Aaron Stein',
    startDate: '2025-01-22',
    lastActive: '2025-01-15T21:18:00Z',
    persona: 'Multi-cloud Operator',
    riskLevel: 'Medium',
  },
  {
    id: 'demo-usr-004',
    tenantId: 'helix-biotech',
    name: 'Maya Greene',
    email: 'maya.greene@helix.bio',
    company: 'Helix Biotech',
    role: 'Clinical Data Analyst',
    department: 'Clinical Analytics',
    status: 'Active',
    onboardingStage: 'Completed',
    location: 'Boston, MA',
    manager: 'Daniel Kim',
    startDate: '2024-12-12',
    lastActive: '2025-01-16T09:55:00Z',
    persona: 'Data Guardian',
    riskLevel: 'Low',
  },
  {
    id: 'demo-usr-005',
    tenantId: 'postlight-media',
    name: 'Noah Idris',
    email: 'nidris@postlight.media',
    company: 'Postlight Media',
    role: 'DevOps Engineer',
    department: 'Platform Engineering',
    status: 'Suspended',
    onboardingStage: 'Discovery',
    location: 'London, UK',
    manager: 'Amelia Rowe',
    startDate: '2024-09-18',
    lastActive: '2025-01-04T17:20:00Z',
    persona: 'Automation Architect',
    riskLevel: 'High',
  },
  {
    id: 'demo-usr-006',
    tenantId: 'skyline-retail',
    name: 'Caroline Wu',
    email: 'caroline.wu@skyline.retail',
    company: 'Skyline Retail',
    role: 'Retail Systems Director',
    department: 'Retail Technology',
    status: 'Active',
    onboardingStage: 'Completed',
    location: 'Seattle, WA',
    manager: 'Jonah Park',
    startDate: '2023-07-01',
    lastActive: '2025-01-16T07:40:00Z',
    persona: 'Omni-channel Strategist',
    riskLevel: 'Medium',
  },
  {
    id: 'demo-usr-007',
    tenantId: 'aurora-health',
    name: 'Sofia Rahman',
    email: 'srahman@aurora.health',
    company: 'Aurora Health Network',
    role: 'Chief Privacy Officer',
    department: 'Compliance & Privacy',
    status: 'Pending Approval',
    onboardingStage: 'Approvals',
    location: 'Chicago, IL',
    manager: 'Board Audit Committee',
    startDate: '2025-02-03',
    lastActive: '2025-01-13T18:20:00Z',
    persona: 'PHI Guardian',
    riskLevel: 'High',
  },
  {
    id: 'demo-usr-008',
    tenantId: 'orbital-space',
    name: 'Malik Osei',
    email: 'mosei@orbital.space',
    company: 'Orbital Space Systems',
    role: 'Satellite Operations Specialist',
    department: 'Mission Control',
    status: 'Provisioning',
    onboardingStage: 'Provisioning',
    location: 'Cape Canaveral, FL',
    manager: 'Evelyn Carter',
    startDate: '2025-01-20',
    lastActive: '2025-01-16T02:17:00Z',
    persona: 'Launch Pad Engineer',
    riskLevel: 'Medium',
  },
  {
    id: 'demo-usr-009',
    tenantId: 'atlas-contractor',
    name: 'Gabriela Sandoval',
    email: 'gsandoval@contractors.atlasit',
    company: 'AtlasIT (Contractor)',
    role: 'IAM Contractor',
    department: 'Professional Services',
    status: 'Dormant',
    onboardingStage: 'Discovery',
    location: 'Remote - EU',
    manager: 'Contract Management Office',
    startDate: '2024-04-15',
    lastActive: '2024-12-20T16:00:00Z',
    persona: 'Seasonal Specialist',
    riskLevel: 'Low',
  },
  {
    id: 'demo-usr-010',
    tenantId: 'nova-fintech',
    name: 'Dmitri Volkov',
    email: 'dvolkov@nova.fintech',
    company: 'Nova Fintech',
    role: 'Global Admin',
    department: 'Enterprise IT',
    status: 'Suspended',
    onboardingStage: 'Approvals',
    location: 'Zurich, Switzerland',
    manager: 'Chief Risk Office',
    startDate: '2024-10-09',
    lastActive: '2025-01-10T14:10:00Z',
    persona: 'High Privilege Operator',
    riskLevel: 'High',
  },
];

export const onboardingRequests: DemoOnboardingRequest[] = [
  {
    id: 'req-2041',
    userId: 'demo-usr-002',
    title: 'Grant Entra & SAP Analytics Access',
    status: 'in-flight',
    submittedAt: '2025-01-15T15:23:00Z',
    targetGroups: ['Entra Analytics Admins', 'SAP Finance Analysts'],
    targetApps: ['Microsoft Entra', 'SAP Analytics Cloud'],
    slaMinutes: 180,
    approvals: [
      { stage: 'Requester', approver: 'Farah Castillo', status: 'approved', completedAt: '2025-01-15T15:23:00Z' },
      { stage: 'Manager', approver: 'Miguel Alvarez', status: 'approved', completedAt: '2025-01-15T15:45:00Z' },
      { stage: 'Security', approver: 'Priya Patel', status: 'pending' },
    ],
  },
  {
    id: 'req-2042',
    userId: 'demo-usr-003',
    title: 'Provision AWS Privileged Access',
    status: 'pending',
    submittedAt: '2025-01-16T11:12:00Z',
    targetGroups: ['AWS Privileged Operators'],
    targetApps: ['AWS Console'],
    slaMinutes: 240,
    approvals: [
      { stage: 'Requester', approver: 'Lena Novik', status: 'approved', completedAt: '2025-01-16T11:12:00Z' },
      { stage: 'Manager', approver: 'Aaron Stein', status: 'pending' },
      { stage: 'Security', approver: 'Priya Patel', status: 'pending' },
    ],
  },
  {
    id: 'req-2038',
    userId: 'demo-usr-005',
    title: 'Suspend CI/CD Deployment Role',
    status: 'completed',
    submittedAt: '2025-01-08T08:40:00Z',
    targetGroups: ['Jenkins Deployers'],
    targetApps: ['GitHub Enterprise', 'Jenkins'],
    slaMinutes: 90,
    approvals: [
      { stage: 'Requester', approver: 'Amelia Rowe', status: 'approved', completedAt: '2025-01-08T08:41:00Z' },
      { stage: 'Security', approver: 'Priya Patel', status: 'approved', completedAt: '2025-01-08T09:10:00Z' },
      { stage: 'Automation', approver: 'AtlasIT Bot', status: 'approved', completedAt: '2025-01-08T09:12:00Z' },
    ],
  },
  {
    id: 'req-2045',
    userId: 'demo-usr-006',
    title: 'Roll out retail analytics sandbox',
    status: 'completed',
    submittedAt: '2025-01-11T09:05:00Z',
    targetGroups: ['Retail Data Scientists'],
    targetApps: ['Snowflake', 'Looker'],
    slaMinutes: 150,
    approvals: [
      { stage: 'Requester', approver: 'Caroline Wu', status: 'approved', completedAt: '2025-01-11T09:05:00Z' },
      { stage: 'Manager', approver: 'Jonah Park', status: 'approved', completedAt: '2025-01-11T09:20:00Z' },
      { stage: 'Compliance', approver: 'Legal Ops', status: 'approved', completedAt: '2025-01-11T09:30:00Z' },
    ],
  },
  {
    id: 'req-2046',
    userId: 'demo-usr-007',
    title: 'Elevate PHI data steward role',
    status: 'pending',
    submittedAt: '2025-01-16T14:55:00Z',
    targetGroups: ['PHI Data Stewards'],
    targetApps: ['ServiceNow GRC', 'Azure Key Vault'],
    slaMinutes: 360,
    approvals: [
      { stage: 'Requester', approver: 'Sofia Rahman', status: 'approved', completedAt: '2025-01-16T14:55:00Z' },
      { stage: 'Manager', approver: 'Board Audit Committee', status: 'pending' },
      { stage: 'Security', approver: 'Priya Patel', status: 'pending' },
      { stage: 'Compliance', approver: 'Chief Legal Counsel', status: 'pending' },
    ],
  },
  {
    id: 'req-2047',
    userId: 'demo-usr-010',
    title: 'Reinstate global admin privileges',
    status: 'denied',
    submittedAt: '2025-01-14T07:25:00Z',
    targetGroups: ['Global Admins'],
    targetApps: ['Microsoft Entra', 'Okta Admin Console'],
    slaMinutes: 480,
    approvals: [
      { stage: 'Requester', approver: 'Dmitri Volkov', status: 'approved', completedAt: '2025-01-14T07:25:00Z' },
      { stage: 'Manager', approver: 'Chief Risk Office', status: 'denied', completedAt: '2025-01-14T08:10:00Z' },
      { stage: 'Security', approver: 'Global Security Team', status: 'pending' },
    ],
  },
  {
    id: 'req-2048',
    userId: 'demo-usr-009',
    title: 'Deactivate contractor profiles',
    status: 'completed',
    submittedAt: '2025-01-05T12:05:00Z',
    targetGroups: ['AtlasIT Contractors'],
    targetApps: ['Okta', 'Jira Service Management'],
    slaMinutes: 60,
    approvals: [
      { stage: 'Requester', approver: 'Contract Management Office', status: 'approved', completedAt: '2025-01-05T12:05:00Z' },
      { stage: 'Automation', approver: 'AtlasIT Bot', status: 'approved', completedAt: '2025-01-05T12:12:00Z' },
    ],
  },
];

export const dashboardMetrics: DemoMetricSummary = {
  activeUsers: 134,
  pendingRequests: onboardingRequests.filter((r) => r.status !== 'completed').length,
  connectedSystems: 14,
  activeWorkflows: 11,
  securityScore: 92,
  automationCoverage: 81,
  avgProvisioningTimeMinutes: Math.round(
    onboardingRequests.reduce((total, request) => total + request.slaMinutes, 0) / onboardingRequests.length
  ),
  trends: {
    weeklyActiveUsers: [118, 121, 124, 130, 134],
    monthlySecurityScore: [88, 90, 91, 92],
    automationCoverage: [65, 72, 78, 81],
    onboardingCompletionMinutes: [210, 195, 180, 165, 150],
  },
};

export const activityFeed: DemoActivityItem[] = [
  {
    id: 'activity-501',
    type: 'onboarding',
    title: 'New user onboarded',
    description: 'Jordan Miles completed provisioning for AWS, Entra, and Okta.',
    timestamp: '2025-01-16T13:42:00Z',
    relativeTime: '45m ago',
    status: 'success',
  },
  {
    id: 'activity-499',
    type: 'security',
    title: 'Security scan completed',
    description: 'Weekly scan resolved 3 medium-risk issues across AWS accounts.',
    timestamp: '2025-01-16T11:05:00Z',
    relativeTime: '3h ago',
    status: 'success',
  },
  {
    id: 'activity-497',
    type: 'automation',
    title: 'Workflow executed',
    description: 'Automated onboarding workflow ran for Helix Biotech with zero manual steps.',
    timestamp: '2025-01-16T09:32:00Z',
    relativeTime: '5h ago',
    status: 'success',
  },
  {
    id: 'activity-493',
    type: 'compliance',
    title: 'Access review pending',
    description: 'Quarterly access certification opened for Finance organization.',
    timestamp: '2025-01-15T21:00:00Z',
    relativeTime: '18h ago',
    status: 'warning',
  },
  {
    id: 'activity-490',
    type: 'onboarding',
    title: 'Contractor offboarding automated',
    description: 'AtlasIT Bot deprovisioned 12 dormant contractor accounts.',
    timestamp: '2025-01-15T17:30:00Z',
    relativeTime: '22h ago',
    status: 'success',
  },
  {
    id: 'activity-488',
    type: 'security',
    title: 'Privileged access request denied',
    description: 'Chief Risk Office declined reinstating Nova Fintech global admin rights.',
    timestamp: '2025-01-14T08:12:00Z',
    relativeTime: '1d ago',
    status: 'warning',
  },
  {
    id: 'activity-485',
    type: 'automation',
    title: 'Weekly workflow run rate up 12%',
    description: 'Automation coverage increased after new SAP connector rollout.',
    timestamp: '2025-01-13T19:45:00Z',
    relativeTime: '2d ago',
    status: 'info',
  },
];

export function getDemoUserById(id: string): DemoUser | undefined {
  return demoUsers.find((user) => user.id === id);
}
