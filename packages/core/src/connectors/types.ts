import type { ConnectorManifest } from './manifest';
import type { RetryOptions } from './retry';
import type { FetchLike } from './auth';

export interface ConnectorContext {
  tenantId: string;
  authHeaders: Record<string, string>;
  fetchImpl?: FetchLike;
  retryOptions?: RetryOptions;
  metadata?: Record<string, unknown>;
}

export type ConnectorActionHandler = (
  parameters: Record<string, any>,
  context: ConnectorContext
) => Promise<any>;

export interface ConnectorImplementation {
  manifest: ConnectorManifest;
  actions: Record<string, ConnectorActionHandler>;
}

export type ConnectorRegistry = Record<string, ConnectorImplementation>;

export const buildRegistry = (
  ...connectors: ConnectorImplementation[]
): ConnectorRegistry => {
  const registry: ConnectorRegistry = {};
  for (const connector of connectors) {
    registry[connector.manifest.id] = connector;
  }
  return registry;
};
