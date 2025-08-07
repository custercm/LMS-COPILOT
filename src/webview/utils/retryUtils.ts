/**
 * Retry utility with exponential backoff and jitter
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
  onRetry?: (error: Error, attempt: number) => void;
  shouldRetry?: (error: Error) => boolean;
}

export interface RetryResult<T> {
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  onRetry: () => {},
  shouldRetry: () => true
};

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on the last attempt
      if (attempt > opts.maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (!opts.shouldRetry(lastError)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(attempt - 1, opts);
      
      // Call retry callback
      opts.onRetry(lastError, attempt);
      
      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Create a retryable version of a function
 */
export function createRetryable<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = {}
) {
  return async (...args: T): Promise<R> => {
    return withRetry(() => fn(...args), options);
  };
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const exponentialDelay = Math.min(
    options.baseDelay * Math.pow(options.backoffFactor, attempt),
    options.maxDelay
  );

  if (options.jitter) {
    // Add jitter to prevent thundering herd
    const jitterRange = exponentialDelay * 0.1;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(0, exponentialDelay + jitter);
  }

  return exponentialDelay;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Common retry predicates
 */
export const RetryPredicates = {
  // Retry on network errors
  networkErrors: (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return message.includes('network') ||
           message.includes('timeout') ||
           message.includes('fetch') ||
           message.includes('connection') ||
           message.includes('enotfound') ||
           message.includes('econnrefused');
  },

  // Retry on HTTP 5xx errors
  serverErrors: (error: Error): boolean => {
    const message = error.message;
    return /HTTP 5\d\d/.test(message) ||
           message.includes('Internal Server Error') ||
           message.includes('Bad Gateway') ||
           message.includes('Service Unavailable');
  },

  // Retry on specific HTTP status codes
  httpStatuses: (codes: number[]) => (error: Error): boolean => {
    const statusMatch = error.message.match(/HTTP (\d+)/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1], 10);
      return codes.includes(status);
    }
    return false;
  },

  // Don't retry on authentication errors
  notAuthErrors: (error: Error): boolean => {
    const message = error.message.toLowerCase();
    return !message.includes('unauthorized') &&
           !message.includes('forbidden') &&
           !message.includes('authentication') &&
           !message.includes('401') &&
           !message.includes('403');
  }
};

/**
 * Circuit breaker implementation for preventing cascade failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000, // 1 minute
    private halfOpenMaxCalls = 3
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeout) {
        throw new Error('Circuit breaker is OPEN');
      } else {
        this.state = 'HALF_OPEN';
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED';
  }
}

/**
 * Request timeout wrapper
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    })
  ]);
}

/**
 * Batch retry operations
 */
export async function retryBatch<T>(
  operations: (() => Promise<T>)[],
  options: RetryOptions = {}
): Promise<RetryResult<T>[]> {
  const results = await Promise.allSettled(
    operations.map(op => withRetry(op, options))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        result: result.value,
        attempts: 1, // This would need to be tracked more carefully
        totalTime: 0
      };
    } else {
      return {
        error: result.reason,
        attempts: (options.maxRetries || 3) + 1,
        totalTime: 0
      };
    }
  });
}
