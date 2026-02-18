import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { buildItemPool } from './itemPoolService';
import { SwipeRecord } from '../types/swipe-trading';
import * as firestore from 'firebase/firestore';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('../utils/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn(async (fn, options) => {
    // Execute the function directly for testing
    return await fn();
  }),
}));

describe('itemPoolService', () => {
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Property-Based Tests', () => {
    describe('Property 7: Query Metrics Logging', () => {
      /**
       * **Validates: Requirements 4.2, 4.3**
       * 
       * For any Firestore query execution in the item pool service, the system must log 
       * the query parameters (user ID, swipe history count, limit), execution time in 
       * milliseconds, and result count.
       */
      it('should log query parameters and metrics for any valid input', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              userId: fc.string({ minLength: 1, maxLength: 50 }),
              historyCount: fc.integer({ min: 0, max: 100 }),
              limit: fc.integer({ min: 1, max: 100 }),
              resultCount: fc.integer({ min: 0, max: 100 }),
            }),
            async ({ userId, historyCount, limit, resultCount }) => {
              // Create mock swipe history
              const swipeHistory: SwipeRecord[] = Array.from({ length: historyCount }, (_, i) => ({
                itemId: `item-${i}`,
                direction: 'left' as const,
                timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
              }));
              
              // Mock Firestore response
              const mockDocs = Array.from({ length: resultCount }, (_, i) => ({
                id: `result-item-${i}`,
                data: () => ({
                  title: `Item ${i}`,
                  status: 'available',
                  ownerId: 'other-user',
                  createdAt: Date.now(),
                }),
              }));
              
              vi.mocked(firestore.getDocs).mockResolvedValue({
                docs: mockDocs,
                empty: resultCount === 0,
              } as any);
              
              // Clear previous logs
              consoleLogSpy.mockClear();
              
              // Execute function
              await buildItemPool(userId, swipeHistory, limit);
              
              // Verify entry logging with query parameters
              expect(consoleLogSpy).toHaveBeenCalledWith(
                '[itemPoolService] Building item pool:',
                expect.objectContaining({
                  queryId: expect.any(Number),
                  userId,
                  historyCount,
                  limit,
                  hasLastDoc: false,
                })
              );
              
              // Verify query execution logging
              expect(consoleLogSpy).toHaveBeenCalledWith('[itemPoolService] Executing Firestore query...');
              
              // Verify query completion logging with metrics
              const queryCompletionCall = consoleLogSpy.mock.calls.find(
                (call: any[]) => call[0] === '[itemPoolService] Query completed:'
              );
              
              expect(queryCompletionCall).toBeDefined();
              expect(queryCompletionCall[1]).toMatchObject({
                queryId: expect.any(Number),
                resultCount,
                empty: resultCount === 0,
              });
              
              // Verify queryTimeMs is logged and is a number
              expect(queryCompletionCall[1]).toHaveProperty('queryTimeMs');
              expect(typeof queryCompletionCall[1].queryTimeMs).toBe('number');
              expect(queryCompletionCall[1].queryTimeMs).toBeGreaterThanOrEqual(0);
            }
          ),
          { numRuns: 100, timeout: 30000 }
        );
      }, 35000);
    });

    describe('Property 8: Filtering Statistics Logging', () => {
      /**
       * **Validates: Requirements 4.5**
       * 
       * For any item pool filtering operation, the system must log both the pre-filter 
       * count (raw query results) and post-filter count (after excluding swiped items), 
       * along with the number of items filtered out.
       */
      it('should log filtering statistics for any combination of results and swipe history', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              userId: fc.string({ minLength: 1, maxLength: 50 }),
              resultCount: fc.integer({ min: 0, max: 50 }),
              swipedItemsInResults: fc.integer({ min: 0, max: 50 }),
            }),
            async ({ userId, resultCount, swipedItemsInResults }) => {
              // Ensure swipedItemsInResults doesn't exceed resultCount
              const actualSwipedInResults = Math.min(swipedItemsInResults, resultCount);
              
              // Create mock swipe history with some items that will be in results
              const swipeHistory: SwipeRecord[] = Array.from({ length: actualSwipedInResults }, (_, i) => ({
                itemId: `result-item-${i}`, // These will match result items
                direction: 'right' as const,
                timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
              }));
              
              // Mock Firestore response
              const mockDocs = Array.from({ length: resultCount }, (_, i) => ({
                id: `result-item-${i}`,
                data: () => ({
                  title: `Item ${i}`,
                  status: 'available',
                  ownerId: 'other-user',
                  createdAt: Date.now(),
                }),
              }));
              
              vi.mocked(firestore.getDocs).mockResolvedValue({
                docs: mockDocs,
                empty: resultCount === 0,
              } as any);
              
              // Clear previous logs
              consoleLogSpy.mockClear();
              
              // Execute function
              await buildItemPool(userId, swipeHistory, 20);
              
              // Verify filtering statistics logging
              const filteringCall = consoleLogSpy.mock.calls.find(
                (call: any[]) => call[0] === '[itemPoolService] Filtering results:'
              );
              
              expect(filteringCall).toBeDefined();
              expect(filteringCall[1]).toMatchObject({
                queryId: expect.any(Number),
                preFilterCount: resultCount,
                postFilterCount: resultCount - actualSwipedInResults,
                filteredOut: actualSwipedInResults,
              });
            }
          ),
          { numRuns: 100, timeout: 30000 }
        );
      }, 35000);
    });

    describe('Property 2: Empty Pool State Distinction', () => {
      /**
       * **Validates: Requirements 1.4, 2.5**
       * 
       * For any item pool loading result that returns an empty array, the system must 
       * correctly distinguish and log whether this was due to no available items in 
       * the database or all items being filtered out by swipe history.
       */
      it('should distinguish between no items and all filtered for empty results', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              userId: fc.string({ minLength: 1, maxLength: 50 }),
              scenario: fc.constantFrom('no-items', 'all-filtered'),
            }),
            async ({ userId, scenario }) => {
              let swipeHistory: SwipeRecord[];
              let mockDocs: any[];
              
              if (scenario === 'no-items') {
                // Scenario 1: No items in database
                swipeHistory = [];
                mockDocs = [];
              } else {
                // Scenario 2: Items exist but all are filtered out
                const itemCount = 5;
                swipeHistory = Array.from({ length: itemCount }, (_, i) => ({
                  itemId: `result-item-${i}`,
                  direction: 'right' as const,
                  timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
                }));
                
                mockDocs = Array.from({ length: itemCount }, (_, i) => ({
                  id: `result-item-${i}`,
                  data: () => ({
                    title: `Item ${i}`,
                    status: 'available',
                    ownerId: 'other-user',
                    createdAt: Date.now(),
                  }),
                }));
              }
              
              vi.mocked(firestore.getDocs).mockResolvedValue({
                docs: mockDocs,
                empty: mockDocs.length === 0,
              } as any);
              
              // Clear previous logs
              consoleLogSpy.mockClear();
              
              // Execute function
              const result = await buildItemPool(userId, swipeHistory, 20);
              
              // Verify result is empty
              expect(result).toHaveLength(0);
              
              // Verify correct distinction logging
              if (scenario === 'no-items') {
                expect(consoleLogSpy).toHaveBeenCalledWith(
                  '[itemPoolService] Empty result: No items available in database',
                  expect.objectContaining({ queryId: expect.any(Number) })
                );
              } else {
                expect(consoleLogSpy).toHaveBeenCalledWith(
                  '[itemPoolService] Empty result: All items filtered out by swipe history',
                  expect.objectContaining({ queryId: expect.any(Number) })
                );
              }
            }
          ),
          { numRuns: 100, timeout: 30000 }
        );
      }, 35000);
    });

    describe('Property 9: Sequential Query Execution', () => {
      /**
       * **Validates: Requirements 5.3**
       * 
       * For any scenario requiring multiple Firestore queries, the queries must execute 
       * sequentially (one completes before the next begins) rather than in parallel, to 
       * avoid overwhelming Firestore and causing race conditions.
       */
      it('should execute multiple queries sequentially, not in parallel', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              userId: fc.string({ minLength: 1, maxLength: 50 }),
              queryCount: fc.integer({ min: 2, max: 5 }),
            }),
            async ({ userId, queryCount }) => {
              // Track query execution with unique IDs assigned at call time
              const queryCallOrder: number[] = []; // Order queries were called
              const queryStartOrder: number[] = []; // Order queries actually started executing
              const startTimes: Map<number, number> = new Map();
              const endTimes: Map<number, number> = new Map();
              let nextQueryId = 0;
              
              // Mock getDocs to track execution timing
              vi.mocked(firestore.getDocs).mockImplementation(async () => {
                const currentQueryId = nextQueryId++;
                queryStartOrder.push(currentQueryId);
                startTimes.set(currentQueryId, Date.now());
                
                // Simulate query execution time
                await new Promise(resolve => setTimeout(resolve, 10));
                
                endTimes.set(currentQueryId, Date.now());
                
                return {
                  docs: [],
                  empty: true,
                } as any;
              });
              
              // Execute multiple queries in parallel (but they should be queued)
              const promises = Array.from({ length: queryCount }, (_, i) => {
                queryCallOrder.push(i);
                return buildItemPool(`${userId}-${i}`, [], 20);
              });
              
              await Promise.all(promises);
              
              // Verify queries executed sequentially
              // Each query should start after the previous one ends
              for (let i = 1; i < queryCount; i++) {
                const prevQueryId = queryStartOrder[i - 1];
                const currentQueryId = queryStartOrder[i];
                
                const prevEndTime = endTimes.get(prevQueryId)!;
                const currentStartTime = startTimes.get(currentQueryId)!;
                
                // Current query should start after previous query ends
                expect(currentStartTime).toBeGreaterThanOrEqual(prevEndTime);
              }
              
              // Verify execution order matches call order (sequential)
              expect(queryStartOrder).toEqual(Array.from({ length: queryCount }, (_, i) => i));
            }
          ),
          { numRuns: 100, timeout: 30000 }
        );
      }, 35000);
    });
  });
});
