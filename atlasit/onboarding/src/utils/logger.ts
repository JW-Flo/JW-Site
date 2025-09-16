import { logger as sharedLogger, Logger } from '@atlasit/shared';
import type { OnboardingContext } from '../types';

export const appLogger = sharedLogger.withContext({ service: 'atlasit-onboarding' });

export function getRequestLogger(
  c: OnboardingContext,
  context: Record<string, unknown> = {}
): Logger {
  const requestLogger = c.get('logger') as Logger | undefined;
  const baseLogger = requestLogger ?? appLogger;
  return Object.keys(context).length > 0 ? baseLogger.withContext(context) : baseLogger;
}

export function getRequestId(c: OnboardingContext): string {
  return (c.get('requestId') as string | undefined) ?? crypto.randomUUID();
}
