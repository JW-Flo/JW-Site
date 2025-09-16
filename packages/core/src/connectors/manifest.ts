import { z } from 'zod';

const CredentialFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  required: z.boolean().default(true),
  secret: z.boolean().default(false),
  description: z.string().optional(),
});

const OAuth2AuthSchema = z.object({
  type: z.literal('oauth2'),
  authorizationUrl: z.string(),
  tokenUrl: z.string(),
  scopes: z.array(z.string()).nonempty(),
  defaultScopes: z.array(z.string()).optional(),
  refreshUrl: z.string().optional(),
  pkce: z.boolean().default(false),
});

const OidcAuthSchema = z.object({
  type: z.literal('oidc'),
  discoveryUrl: z.string(),
  scopes: z.array(z.string()).nonempty(),
  defaultScopes: z.array(z.string()).optional(),
});

const ApiKeyAuthSchema = z.object({
  type: z.literal('api_key'),
  headerName: z.string(),
  location: z.enum(['header', 'query']).default('header'),
  description: z.string().optional(),
});

const BasicAuthSchema = z.object({
  type: z.literal('basic'),
  usernameField: CredentialFieldSchema.optional(),
  passwordField: CredentialFieldSchema.optional(),
});

const ServiceAccountAuthSchema = z.object({
  type: z.literal('service_account'),
  fields: z.array(CredentialFieldSchema).min(1),
});

export const AuthMethodSchema = z.discriminatedUnion('type', [
  OAuth2AuthSchema,
  OidcAuthSchema,
  ApiKeyAuthSchema,
  BasicAuthSchema,
  ServiceAccountAuthSchema,
]);

const ActionSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  inputSchema: z.record(z.any()).optional(),
  outputSchema: z.record(z.any()).optional(),
  supportsBatching: z.boolean().default(false),
  defaultSchedule: z
    .object({
      type: z.enum(['cron', 'interval']),
      expression: z.string(),
    })
    .optional(),
});

const EventSubscriptionSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  delivery: z.enum(['webhook', 'polling']),
  defaultCursorField: z.string().optional(),
});

const RateLimitSchema = z.object({
  type: z.enum(['per_minute', 'per_hour', 'per_day']),
  limit: z.number().positive(),
});

const CapabilitySchema = z.object({
  category: z.enum([
    'provisioning',
    'identity',
    'compliance',
    'notifications',
    'reporting',
    'scripting',
  ]),
  actions: z.array(ActionSchema).default([]),
  events: z.array(EventSubscriptionSchema).default([]),
});

const PollingConfigSchema = z.object({
  intervalSeconds: z.number().int().positive(),
  description: z.string().optional(),
});

const WebhookConfigSchema = z.object({
  path: z.string(),
  description: z.string().optional(),
  verification: z
    .object({
      type: z.enum(['shared_secret', 'public_key', 'none']).default('none'),
      header: z.string().optional(),
    })
    .optional(),
});

export const ConnectorManifestSchema = z.object({
  id: z.string(),
  version: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  categories: z.array(z.string()).default([]),
  auth: z.array(AuthMethodSchema).nonempty(),
  capabilities: z.array(CapabilitySchema).default([]),
  webhooks: z.array(WebhookConfigSchema).default([]),
  polling: z.array(PollingConfigSchema).default([]),
  rateLimits: z.array(RateLimitSchema).default([]),
  metadata: z.record(z.any()).default({}),
});

export type CredentialField = z.infer<typeof CredentialFieldSchema>;
export type AuthMethod = z.infer<typeof AuthMethodSchema>;
export type ConnectorAction = z.infer<typeof ActionSchema>;
export type ConnectorEventSubscription = z.infer<typeof EventSubscriptionSchema>;
export type ConnectorCapability = z.infer<typeof CapabilitySchema>;
export type ConnectorManifest = z.infer<typeof ConnectorManifestSchema>;
