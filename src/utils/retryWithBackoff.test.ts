import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { retryWithBackoff } from './retryWithBackoff';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid cluttering test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('basic functionality', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');
      
      const result = await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after exhausting all retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(
        retryWithBackoff(fn, { maxRetries: 2, initialDelay: 10 })
      ).rejects.toThrow('Operation failed after 2 retries: Network error');
      
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Permission denied'));
      
      await expect(
        retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 })
      ).rejects.toThrow('Permission denied');
      
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('logging', () => {
    it('should log retry attempts', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');
      
      await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 });
      
      expect(console.log).toHaveBeenCalledWith('[retryWithBackoff] Attempt', 1, 'of', 4);
      expect(console.log).toHaveBeenCalledWith('[retryWithBackoff] Attempt', 2, 'of', 4);
    });

    it('should log retry delays', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');
      
      await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 100 });
      
      expect(console.log).toHaveBeenCalledWith('[retryWithBackoff] Waiting', 100, 'ms before retry');
    });

    it('should log when retries are exhausted', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(
        retryWithBackoff(fn, { maxRetries: 1, initialDelay: 10 })
      ).rejects.toThrow();
      
      expect(console.error).toHaveBeenCalledWith('[retryWithBackoff] All retries exhausted');
    });

    it('should log non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Permission denied'));
      
      await expect(
        retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 })
      ).rejects.toThrow();
      
      expect(console.log).toHaveBeenCalledWith('[retryWithBackoff] Non-retryable error, throwing immediately');
    });

    it('should log error messages on failure', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(
        retryWithBackoff(fn, { maxRetries: 1, initialDelay: 10 })
      ).rejects.toThrow();
      
      expect(console.error).toHaveBeenCalledWith('[retryWithBackoff] Attempt', 1, 'failed:', 'Test error');
    });
  });

  describe('onRetry callback', () => {
    it('should call onRetry callback on each retry', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');
      
      const onRetry = vi.fn();
      
      await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10, onRetry });
      
      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.objectContaining({ message: 'Error 1' }));
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.objectContaining({ message: 'Error 2' }));
    });

    it('should not call onRetry on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const onRetry = vi.fn();
      
      await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10, onRetry });
      
      expect(onRetry).not.toHaveBeenCalled();
    });

    it('should not call onRetry for non-retryable errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Permission denied'));
      const onRetry = vi.fn();
      
      await expect(
        retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10, onRetry })
      ).rejects.toThrow();
      
      expect(onRetry).not.toHaveBeenCalled();
    });

    it('should not call onRetry after exhausting retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Network error'));
      const onRetry = vi.fn();
      
      await expect(
        retryWithBackoff(fn, { maxRetries: 2, initialDelay: 10, onRetry })
      ).rejects.toThrow();
      
      expect(onRetry).toHaveBeenCalledTimes(2); // Only for the 2 retries, not the final failure
    });
  });

  describe('exponential backoff', () => {
    it('should increase delay exponentially', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');
      
      await retryWithBackoff(fn, { 
        maxRetries: 3, 
        initialDelay: 100, 
        backoffFactor: 2 
      });
      
      expect(console.log).toHaveBeenCalledWith('[retryWithBackoff] Waiting', 100, 'ms before retry');
      expect(console.log).toHaveBeenCalledWith('[retryWithBackoff] Waiting', 200, 'ms before retry');
    });

    it('should respect maxDelay', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');
      
      await retryWithBackoff(fn, { 
        maxRetries: 3, 
        initialDelay: 100, 
        backoffFactor: 10,
        maxDelay: 150
      });
      
      expect(console.log).toHaveBeenCalledWith('[retryWithBackoff] Waiting', 100, 'ms before retry');
      expect(console.log).toHaveBeenCalledWith('[retryWithBackoff] Waiting', 150, 'ms before retry');
    });
  });

  describe('non-retryable errors', () => {
    const nonRetryableErrors = [
      'Permission denied',
      'Not found',
      'Invalid argument',
      'Unauthorized access',
      'Forbidden resource',
    ];

    nonRetryableErrors.forEach(errorMessage => {
      it(`should not retry on error: ${errorMessage}`, async () => {
        const fn = vi.fn().mockRejectedValue(new Error(errorMessage));
        
        await expect(
          retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 })
        ).rejects.toThrow(errorMessage);
        
        expect(fn).toHaveBeenCalledTimes(1);
      });
    });
  });
});

describe('Property-Based Tests', () => {
  describe('Property 3: Retry with Exponential Backoff', () => {
    /**
     * **Validates: Requirements 2.1, 4.4, 5.2**
     * 
     * For any Firestore query that fails with a retryable error, the system must retry 
     * up to 3 times with exponentially increasing delays (1s, 2s, 4s), and log each retry attempt.
     */
    it('should retry with exponential backoff for any retryable error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            errorMessage: fc.constantFrom('Network error', 'Timeout error', 'Connection refused', 'Service unavailable'),
            maxRetries: fc.integer({ min: 1, max: 2 }),
            initialDelay: fc.integer({ min: 10, max: 30 }),
            backoffFactor: fc.constant(2),
          }),
          async ({ errorMessage, maxRetries, initialDelay, backoffFactor }) => {
            let callCount = 0;
            const fn = async () => {
              callCount++;
              throw new Error(errorMessage);
            };
            
            let retryCount = 0;
            const onRetry = () => {
              retryCount++;
            };
            
            // Capture console logs
            const logs: string[] = [];
            const originalLog = console.log;
            const originalError = console.error;
            console.log = (...args: any[]) => logs.push(args.join(' '));
            console.error = (...args: any[]) => logs.push(args.join(' '));
            
            try {
              await retryWithBackoff(fn, { maxRetries, initialDelay, backoffFactor, onRetry });
            } catch (error) {
              // Expected to fail after retries
            } finally {
              console.log = originalLog;
              console.error = originalError;
            }
            
            // Verify retry attempts
            expect(callCount).toBe(maxRetries + 1); // Initial + retries
            expect(retryCount).toBe(maxRetries);
            
            // Verify exponential backoff delays were logged
            let expectedDelay = initialDelay;
            for (let i = 0; i < maxRetries; i++) {
              const delayLog = `[retryWithBackoff] Waiting ${expectedDelay} ms before retry`;
              expect(logs).toContain(delayLog);
              expectedDelay = expectedDelay * backoffFactor;
            }
            
            // Verify exhaustion logging
            expect(logs.some(log => log.includes('All retries exhausted'))).toBe(true);
          }
        ),
        { numRuns: 50, timeout: 15000 }
      );
    }, 20000);

    it('should respect maxDelay cap during exponential backoff', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            maxRetries: fc.integer({ min: 2, max: 3 }),
            initialDelay: fc.integer({ min: 50, max: 100 }),
          }),
          async ({ maxRetries, initialDelay }) => {
            const backoffFactor = 2;
            const maxDelay = initialDelay * backoffFactor;
            
            const fn = async () => {
              throw new Error('Network timeout error');
            };
            
            // Capture console logs
            const logs: string[] = [];
            const originalLog = console.log;
            const originalError = console.error;
            console.log = (...args: any[]) => logs.push(args.join(' '));
            console.error = (...args: any[]) => logs.push(args.join(' '));
            
            try {
              await retryWithBackoff(fn, { maxRetries, initialDelay, maxDelay, backoffFactor });
            } catch (error) {
              // Expected to fail
            } finally {
              console.log = originalLog;
              console.error = originalError;
            }
            
            // Extract delay values from logs
            const delayLogs = logs.filter(log => log.includes('[retryWithBackoff] Waiting') && log.includes('ms before retry'));
            const delays = delayLogs.map(log => {
              const match = log.match(/Waiting (\d+) ms/);
              return match ? parseInt(match[1]) : 0;
            });
            
            // Verify no delay exceeds maxDelay
            delays.forEach(delay => {
              expect(delay).toBeLessThanOrEqual(maxDelay);
            });
          }
        ),
        { numRuns: 50, timeout: 15000 }
      );
    }, 20000);
  });

  describe('Property 4: Error Propagation After Retry Exhaustion', () => {
    /**
     * **Validates: Requirements 2.2, 5.5**
     * 
     * For any operation where all retry attempts are exhausted, the system must throw 
     * a descriptive error containing the original failure reason and the number of retries attempted.
     */
    it('should throw descriptive error with retry count after exhaustion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            errorMessage: fc.constantFrom('Network error', 'Timeout error', 'Connection refused', 'Service unavailable'),
            maxRetries: fc.integer({ min: 1, max: 2 }),
          }),
          async ({ errorMessage, maxRetries }) => {
            let callCount = 0;
            const fn = async () => {
              callCount++;
              throw new Error(errorMessage);
            };
            
            // Suppress console output
            const originalLog = console.log;
            const originalError = console.error;
            console.log = () => {};
            console.error = () => {};
            
            let thrownError: Error | null = null;
            try {
              await retryWithBackoff(fn, { maxRetries, initialDelay: 10 });
            } catch (error) {
              thrownError = error as Error;
            } finally {
              console.log = originalLog;
              console.error = originalError;
            }
            
            // Verify error was thrown
            expect(thrownError).not.toBeNull();
            
            // Verify error message contains retry count
            expect(thrownError!.message).toContain(`failed after ${maxRetries} retries`);
            
            // Verify error message contains original error message
            expect(thrownError!.message).toContain(errorMessage);
            
            // Verify all retries were attempted
            expect(callCount).toBe(maxRetries + 1);
          }
        ),
        { numRuns: 50, timeout: 15000 }
      );
    }, 20000);

    it('should immediately throw non-retryable errors without retry count', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant('Permission denied'),
            fc.constant('Not found'),
            fc.constant('Invalid argument'),
            fc.constant('Unauthorized'),
            fc.constant('Forbidden')
          ),
          fc.integer({ min: 1, max: 3 }),
          async (errorMessage, maxRetries) => {
            let callCount = 0;
            const fn = async () => {
              callCount++;
              throw new Error(errorMessage);
            };
            
            // Capture console logs
            const logs: string[] = [];
            const originalLog = console.log;
            const originalError = console.error;
            console.log = (...args: any[]) => logs.push(args.join(' '));
            console.error = (...args: any[]) => logs.push(args.join(' '));
            
            let thrownError: Error | null = null;
            try {
              await retryWithBackoff(fn, { maxRetries, initialDelay: 10 });
            } catch (error) {
              thrownError = error as Error;
            } finally {
              console.log = originalLog;
              console.error = originalError;
            }
            
            // Verify error was thrown
            expect(thrownError).not.toBeNull();
            
            // Verify error message is the original error (not wrapped with retry count)
            expect(thrownError!.message).toBe(errorMessage);
            expect(thrownError!.message).not.toContain('failed after');
            
            // Verify no retries were attempted
            expect(callCount).toBe(1);
            
            // Verify non-retryable error logging
            expect(logs.some(log => log.includes('Non-retryable error, throwing immediately'))).toBe(true);
          }
        ),
        { numRuns: 50, timeout: 10000 }
      );
    }, 15000);

    it('should propagate original error details through retry wrapper', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            errorMessage: fc.constantFrom('Network error', 'Timeout error', 'Connection refused', 'Service unavailable'),
            maxRetries: fc.integer({ min: 1, max: 2 }),
          }),
          async ({ errorMessage, maxRetries }) => {
            let callCount = 0;
            const fn = async () => {
              callCount++;
              throw new Error(errorMessage);
            };
            
            // Capture console logs
            const logs: string[] = [];
            const originalLog = console.log;
            const originalError = console.error;
            console.log = (...args: any[]) => logs.push(args.join(' '));
            console.error = (...args: any[]) => logs.push(args.join(' '));
            
            let thrownError: Error | null = null;
            try {
              await retryWithBackoff(fn, { maxRetries, initialDelay: 10 });
            } catch (error) {
              thrownError = error as Error;
            } finally {
              console.log = originalLog;
              console.error = originalError;
            }
            
            // Verify the thrown error contains the original error message
            expect(thrownError).not.toBeNull();
            expect(thrownError!.message).toContain(errorMessage);
            
            // Verify error was logged on each attempt
            const attemptFailureLogs = logs.filter(log => 
              log.includes('[retryWithBackoff] Attempt') && log.includes('failed:') && log.includes(errorMessage)
            );
            
            // Should have maxRetries + 1 attempt failure logs
            expect(attemptFailureLogs.length).toBe(maxRetries + 1);
          }
        ),
        { numRuns: 50, timeout: 15000 }
      );
    }, 20000);
  });
});


