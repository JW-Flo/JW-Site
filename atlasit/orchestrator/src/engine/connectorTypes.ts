import type { RetryOptions } from '@atlasit/core';

export type ConnectorResourceConfig =
  | string
  | {
      id: string;
      metadata?: Record<string, unknown>;
      authRef?: string;
      retry?: RetryOptions;
    };

export interface ResolvedConnectorResource {
  id: string;
  metadata?: Record<string, unknown>;
  authRef?: string;
  retry?: RetryOptions;
}
