import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retryWithBackoff } from './retryWithBackoff';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await retryWithBackoff(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success');
    
    const result = await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Network error'));
    
    await expect(
      retryWithBackoff(fn, { maxRetries: 2, initialDelay: 10 })
    ).rejects.toThrow('Operation failed after 2 retries');
    
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should not retry on permission errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Permission denied'));
    
    await expect(
      retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 })
    ).rejects.toThrow('Permission denied');
    
    expect(fn).toHaveBeenCalledTimes(1); // No retries
  });

  it('should not retry on not found errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Item not found'));
    
    await expect(
      retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 })
    ).rejects.toThrow('Item not found');
    
    expect(fn).toHaveBeenCalledTimes(1); // No retries
  });

  it('should not retry on invalid errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Invalid input'));
    
    await expect(
      retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 })
    ).rejects.toThrow('Invalid input');
    
    expect(fn).toHaveBeenCalledTimes(1); // No retries
  });

  it('should use exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success');
    
    const startTime = Date.now();
    await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 50, backoffFactor: 2 });
    const endTime = Date.now();
    
    // Should wait at least 50ms + 100ms = 150ms
    expect(endTime - startTime).toBeGreaterThanOrEqual(150);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect max delay', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success');
    
    const startTime = Date.now();
    await retryWithBackoff(fn, { 
      maxRetries: 3, 
      initialDelay: 100, 
      maxDelay: 150,
      backoffFactor: 10 
    });
    const endTime = Date.now();
    
    // Should wait 100ms + 150ms (capped) = 250ms, not 100ms + 1000ms
    expect(endTime - startTime).toBeLessThan(400);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
