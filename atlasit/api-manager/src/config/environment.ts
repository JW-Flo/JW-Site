import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  server: z.object({
    port: z.number().min(1000).max(65535),
    environment: z.enum(['development', 'staging', 'production']),
    allowedOrigins: z.array(z.string().url())
  }),
  auth: z.object({
    jwtSecret: z.string().min(32),
    apiKey: z.string().min(1),
  }),
  okta: z.object({
    domain: z.string().min(1),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    apiToken: z.string().min(1),
    privateKey: z.string().optional()
  }),
  aws: z.object({
    region: z.string().min(1),
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
    accountId: z.string().min(1)
  }),
  terraform: z.object({
    workspacePath: z.string().min(1),
    stateBucket: z.string().optional(),
    lockTable: z.string().optional()
  }),
  azure: z.object({
    tenantId: z.string().min(1),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1)
  }),
  google: z.object({
    workspaceDomain: z.string().min(1),
    serviceAccountKey: z.string().min(1)
  }),
  knowbe4: z.object({
    apiToken: z.string().min(1),
    domain: z.string().min(1)
  }),
  activeDirectory: z.object({
    domain: z.string().min(1),
    server: z.string().min(1),
    username: z.string().min(1),
    password: z.string().min(1)
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']),
    file: z.string().min(1),
    metricsEnabled: z.boolean()
  }),
  rateLimit: z.object({
    windowMs: z.number().min(1000),
    maxRequests: z.number().min(1)
  }),
  demo: z.object({
    mode: z.boolean(),
    dataResetInterval: z.number().min(1000)
  }),
  hris: z.object({
    apiKey: z.string().min(1),
    baseUrl: z.string().min(1)
  })
});

const rawConfig = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:4321').split(',')
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-for-dev-only',
    apiKey: process.env.API_KEY || 'atlasit-demo-api-key'
  },
  okta: {
    domain: process.env.OKTA_DOMAIN || 'dev-demo.okta.com',
    clientId: process.env.OKTA_CLIENT_ID || 'demo-client-id',
    clientSecret: process.env.OKTA_CLIENT_SECRET || 'demo-client-secret',
    apiToken: process.env.OKTA_API_TOKEN || 'demo-api-token',
    privateKey: process.env.OKTA_PRIVATE_KEY
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'demo-access-key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'demo-secret-key',
    accountId: process.env.AWS_ACCOUNT_ID || '123456789012'
  },
  terraform: {
    workspacePath: process.env.TERRAFORM_WORKSPACE_PATH || '../terraform/aws-iam-demo',
    stateBucket: process.env.TERRAFORM_STATE_BUCKET,
    lockTable: process.env.TERRAFORM_LOCK_TABLE
  },
  azure: {
    tenantId: process.env.AZURE_TENANT_ID || 'demo-tenant-id',
    clientId: process.env.AZURE_CLIENT_ID || 'demo-azure-client-id',
    clientSecret: process.env.AZURE_CLIENT_SECRET || 'demo-azure-client-secret'
  },
  google: {
    workspaceDomain: process.env.GOOGLE_WORKSPACE_DOMAIN || 'atlasit.pro',
    serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || 'demo-service-account.json'
  },
  knowbe4: {
    apiToken: process.env.KNOWBE4_API_TOKEN || 'demo-knowbe4-token',
    domain: process.env.KNOWBE4_DOMAIN || 'demo-knowbe4-domain'
  },
  activeDirectory: {
    domain: process.env.AD_DOMAIN || 'corp.atlasit.local',
    server: process.env.AD_SERVER || 'dc01.corp.atlasit.local',
    username: process.env.AD_USERNAME || 'svc-atlasit-automation',
    password: process.env.AD_PASSWORD || 'demo-ad-password'
  },
  logging: {
    level: (process.env.LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug',
    file: process.env.LOG_FILE || 'logs/api-manager.log',
    metricsEnabled: process.env.METRICS_ENABLED === 'true'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  demo: {
    mode: process.env.DEMO_MODE !== 'false',
    dataResetInterval: parseInt(process.env.DEMO_DATA_RESET_INTERVAL || '3600000', 10)
  },
  hris: {
    apiKey: process.env.HRIS_API_KEY || 'demo-hris-key',
    baseUrl: process.env.HRIS_BASE_URL || 'https://api.bamboohr.com/api/gateway.php/atlasit'
  }
};

export const config = configSchema.parse(rawConfig);

export type Config = z.infer<typeof configSchema>;
