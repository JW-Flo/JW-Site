import { z } from 'zod';

// Auth schemas
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    tenantId: z.string(),
  }),
});

export const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});

// Tenancy schemas
export const CreateTenantRequestSchema = z.object({
  name: z.string().min(1),
});

export const TenantResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'suspended']),
  plan: z.string(),
  createdAt: z.string(),
});

export const TenantMembersResponseSchema = z.object({
  members: z.array(z.object({
    id: z.string(),
    email: z.string(),
    role: z.enum(['owner', 'admin', 'analyst', 'readonly']),
    invitedAt: z.string(),
    acceptedAt: z.string().nullable(),
  })),
});

// Policy schemas
export const CreatePolicyRequestSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  spec: z.record(z.any()),
});

export const PolicyResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  type: z.string(),
  spec: z.record(z.any()),
  status: z.enum(['active', 'inactive']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PolicyListResponseSchema = z.object({
  policies: z.array(PolicyResponseSchema),
});

export const ExecutePolicyRequestSchema = z.object({
  policyId: z.string(),
});

export const JobResponseSchema = z.object({
  id: z.string(),
  policyId: z.string(),
  tenantId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  log: z.string().nullable(),
});

// Security schemas
export const MfaEnrollRequestSchema = z.object({
  method: z.enum(['totp']).default('totp'),
});

export const MfaEnrollResponseSchema = z.object({
  secret: z.string(),
  qrCodeUrl: z.string(),
});

export const MfaVerifyRequestSchema = z.object({
  code: z.string().length(6),
});

// Consent schemas
export const ConsentConfigSchema = z.object({
  categories: z.record(z.boolean()),
});

export const ConsentEventSchema = z.object({
  subjectRef: z.string(), // user_id or anonymous_id
  region: z.string(),
  granted: z.record(z.boolean()),
});

// Audit schemas
export const AuditQuerySchema = z.object({
  tenantId: z.string().optional(),
  type: z.string().optional(),
  limit: z.number().max(100).default(50),
});

export const AuditEventSchema = z.object({
  id: z.string(),
  ts: z.string(),
  actorUserId: z.string(),
  tenantId: z.string(),
  type: z.string(),
  payload: z.record(z.any()),
});

export const AuditListResponseSchema = z.object({
  events: z.array(AuditEventSchema),
});
