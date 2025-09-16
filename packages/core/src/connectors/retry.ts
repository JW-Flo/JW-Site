export type ShouldRetry = (error: unknown, attempt: number) => boolean;
export type OnRetry = (error: unknown, attempt: number, delayMs: number) => void;

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitter?: 'none' | 'full' | 'decorrelated';
  shouldRetry?: ShouldRetry;
  onRetry?: OnRetry;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const computeDelay = (
  attempt: number,
  baseDelayMs: number,
  factor: number,
  maxDelayMs: number,
  jitter: RetryOptions['jitter']
): number => {
  const rawDelay = Math.min(baseDelayMs * Math.pow(factor, attempt - 1), maxDelayMs);

  switch (jitter) {
    case 'full':
      return Math.random() * rawDelay;
    case 'decorrelated':
      return Math.min(maxDelayMs, Math.random() * rawDelay + baseDelayMs);
    case 'none':
    default:
      return rawDelay;
  }
};

export const retryWithBackoff = async <T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 5,
    baseDelayMs = 500,
    maxDelayMs = 30_000,
    factor = 2,
    jitter = 'full',
    shouldRetry = () => true,
    onRetry,
  } = options;

  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    attempt += 1;

    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt >= maxAttempts;
      if (isLastAttempt || !shouldRetry(error, attempt)) {
        break;
      }

      const delayMs = computeDelay(attempt, baseDelayMs, factor, maxDelayMs, jitter);
      if (onRetry) {
        onRetry(error, attempt, delayMs);
      }
      await wait(delayMs);
    }
  }

  throw lastError ?? new Error('Retry operation failed without capturing an error');
};
