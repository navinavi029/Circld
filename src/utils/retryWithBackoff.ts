/**
 * Retry utility with exponential backoff for handling network errors
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> & Pick<RetryOptions, 'onRetry'> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
};

/**
 * Executes a function with retry logic and exponential backoff
 * 
 * @param fn - Async function to execute
 * @param options - Retry configuration options
 * @returns Result of the function execution
 * @throws Error if all retries are exhausted
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      console.log('[retryWithBackoff] Attempt', attempt + 1, 'of', config.maxRetries + 1);
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      console.error('[retryWithBackoff] Attempt', attempt + 1, 'failed:', lastError.message);

      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        console.log('[retryWithBackoff] Non-retryable error, throwing immediately');
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === config.maxRetries) {
        console.error('[retryWithBackoff] All retries exhausted');
        throw new Error(
          `Operation failed after ${config.maxRetries} retries: ${lastError.message}`
        );
      }

      // Call retry callback if provided
      if (config.onRetry) {
        config.onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      console.log('[retryWithBackoff] Waiting', delay, 'ms before retry');
      await sleep(delay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * config.backoffFactor, config.maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Determines if an error should not be retried
 */
function isNonRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  // Don't retry permission errors, not found errors, or validation errors
  return (
    message.includes('permission') ||
    message.includes('not found') ||
    message.includes('invalid') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')
  );
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
