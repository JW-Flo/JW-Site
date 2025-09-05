// AtlasIT Shared Utilities
// This package provides common utilities used across all AtlasIT services

// Logger
export { Logger, logger, type LogContext, type LogLevel } from './logger';

// Environment validation
export {
  EnvValidator,
  envValidator,
  validateEnvironment,
  baseEnvSchema,
  databaseEnvSchema,
  authEnvSchema,
  aiEnvSchema,
  rateLimitEnvSchema,
  cloudflareEnvSchema,
  envSchema,
  type EnvConfig
} from './env';

// AI abstraction
export {
  AIService,
  aiService,
  OpenAIProvider,
  AnthropicProvider,
  MockAIProvider,
  type AIProvider,
  type AIRequest,
  type AIResponse,
  type AIProviderConfig,
  type BaseAIProvider
} from './ai';

// HTTP client
export {
  HttpClient,
  httpClient,
  get,
  post,
  put,
  del,
  patch,
  type HttpRequestOptions,
  type HttpResponse
} from './http';

// Common types
export type {
  Tenant,
  User,
  APIKey,
  Workflow,
  WorkflowStep,
  AuditEvent,
  OnboardingConfig,
  OnboardingQuestion,
  MarketplaceApp,
  Integration,
  APIResponse,
  PaginatedResponse,
  Industry,
  Requirement
} from './types';

export { AtlasITError } from './types';
