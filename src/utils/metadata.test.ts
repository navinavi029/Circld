import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  incrementViewCount,
  toggleFavorite,
  getFavoriteStatus,
  getItemMetadata,
} from './metadata';
import {
  getDoc,
  getDocs,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  updateDoc: vi.fn(),
  increment: vi.fn((val) => ({ _increment: val })),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
  runTransaction: vi.fn(),
}));

describe('metadata utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('incrementViewCount', () => {
    it('should increment view count when user has not viewed in last 24 hours', async () => {
      // Mock no existing views
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock transaction
      vi.mocked(runTransaction).mockImplementation(async (_db, callback) => {
        const mockTransaction = {
          set: vi.fn(),
          update: vi.fn(),
        };
        await callback(mockTransaction as any);
        return undefined as any;
      });

      await incrementViewCount('item123', 'user456');

      expect(runTransaction).toHaveBeenCalled();
    });

    it('should not increment view count when user has viewed within 24 hours', async () => {
      // Mock existing view within 24 hours
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'view1' }],
      } as any);

      await incrementViewCount('item123', 'user456');

      // Transaction should not be called
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it('should handle anonymous users (null userId)', async () => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      vi.mocked(runTransaction).mockImplementation(async (_db, callback) => {
        const mockTransaction = {
          set: vi.fn(),
          update: vi.fn(),
        };
        await callback(mockTransaction as any);
        return undefined as any;
      });

      await incrementViewCount('item123', null);

      expect(runTransaction).toHaveBeenCalled();
    });

    it('should throw error when Firestore operation fails', async () => {
      vi.mocked(getDocs).mockRejectedValueOnce(new Error('Firestore error'));

      await expect(incrementViewCount('item123', 'user456')).rejects.toThrow('Firestore error');
    });
  });

  describe('Property-Based Tests', () => {
    describe('Property 12: View deduplication', () => {
      it('should only increment view count once for multiple views within 24 hours', async () => {
        /**
         * Feature: enhanced-listing-experience, Property 12: View deduplication
         * **Validates: Requirements 4.9**
         * 
         * For any item, if the same user views the item multiple times within 24 hours,
         * the view count should only increment once.
         */
        const fc = await import('fast-check');

        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }), // itemId
            fc.oneof(fc.string({ minLength: 1 }), fc.constant(null)), // userId (can be null for anonymous)
            fc.integer({ min: 2, max: 10 }), // number of view attempts
            async (itemId, userId, viewAttempts) => {
              vi.clearAllMocks();

              let transactionCallCount = 0;

              // First view: no existing views
              vi.mocked(getDocs).mockResolvedValueOnce({
                empty: true,
                docs: [],
              } as any);

              // Mock transaction for first view
              vi.mocked(runTransaction).mockImplementation(async (_db, callback) => {
                transactionCallCount++;
                const mockTransaction = {
                  set: vi.fn(),
                  update: vi.fn(),
                };
                await callback(mockTransaction as any);
                return undefined as any;
              });

              // First view should succeed
              await incrementViewCount(itemId, userId);

              // Subsequent views: existing view found
              for (let i = 1; i < viewAttempts; i++) {
                vi.mocked(getDocs).mockResolvedValueOnce({
                  empty: false,
                  docs: [{ id: `view${i}` }],
                } as any);

                await incrementViewCount(itemId, userId);
              }

              // Property: Transaction should only be called once (for the first view)
              expect(transactionCallCount).toBe(1);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Property 8: Favorite toggle behavior', () => {
      it('should toggle favorite status from false to true and true to false', async () => {
        /**
         * Feature: enhanced-listing-experience, Property 8: Favorite toggle behavior
         * **Validates: Requirements 4.2**
         * 
         * For any item, clicking the favorite button should toggle the favorite status
         * from true to false or false to true.
         */
        const fc = await import('fast-check');

        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }), // itemId
            fc.string({ minLength: 1 }), // userId
            fc.boolean(), // initial favorite status
            async (itemId, userId, initiallyFavorited) => {
              vi.clearAllMocks();

              // Mock transaction
              vi.mocked(runTransaction).mockImplementation(async (_db, callback) => {
                const mockTransaction = {
                  set: vi.fn(),
                  update: vi.fn(),
                  delete: vi.fn(),
                };
                await callback(mockTransaction as any);
                return undefined as any;
              });

              // First toggle: set initial state
              if (initiallyFavorited) {
                // Mock existing favorite
                const mockFavoriteDoc = {
                  id: 'fav1',
                  ref: { path: 'favorites/fav1' },
                };
                vi.mocked(getDocs).mockResolvedValueOnce({
                  empty: false,
                  docs: [mockFavoriteDoc],
                } as any);
              } else {
                // Mock no existing favorite
                vi.mocked(getDocs).mockResolvedValueOnce({
                  empty: true,
                  docs: [],
                } as any);
              }

              const firstToggleResult = await toggleFavorite(itemId, userId);

              // Property: First toggle should flip the initial state
              expect(firstToggleResult).toBe(!initiallyFavorited);

              // Second toggle: flip the state again
              if (firstToggleResult) {
                // Now favorited, so mock existing favorite
                const mockFavoriteDoc = {
                  id: 'fav2',
                  ref: { path: 'favorites/fav2' },
                };
                vi.mocked(getDocs).mockResolvedValueOnce({
                  empty: false,
                  docs: [mockFavoriteDoc],
                } as any);
              } else {
                // Now unfavorited, so mock no existing favorite
                vi.mocked(getDocs).mockResolvedValueOnce({
                  empty: true,
                  docs: [],
                } as any);
              }

              const secondToggleResult = await toggleFavorite(itemId, userId);

              // Property: Second toggle should flip back to the initial state
              expect(secondToggleResult).toBe(initiallyFavorited);
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Property 9: Favorite count consistency', () => {
      it('should increment favorite count by 1 when favoriting and decrement by 1 when unfavoriting', async () => {
        /**
         * Feature: enhanced-listing-experience, Property 9: Favorite count consistency
         * **Validates: Requirements 4.3, 4.4**
         * 
         * For any item, favoriting should increment the favorite count by 1,
         * and unfavoriting should decrement it by 1, maintaining count accuracy.
         */
        const fc = await import('fast-check');

        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1 }), // itemId
            fc.string({ minLength: 1 }), // userId
            fc.integer({ min: 1, max: 10 }), // number of toggle operations
            async (itemId, userId, toggleCount) => {
              vi.clearAllMocks();

              let incrementCallCount = 0;
              let decrementCallCount = 0;
              let currentlyFavorited = false;

              // Mock transaction to track increment/decrement calls
              vi.mocked(runTransaction).mockImplementation(async (_db, callback) => {
                const mockTransaction = {
                  set: vi.fn(),
                  update: vi.fn((_ref: any, data: any) => {
                    // Track increment/decrement operations
                    if (data.favoriteCount && data.favoriteCount._increment === 1) {
                      incrementCallCount++;
                    } else if (data.favoriteCount && data.favoriteCount._increment === -1) {
                      decrementCallCount++;
                    }
                  }),
                  delete: vi.fn(),
                };
                await callback(mockTransaction as any);
                return undefined as any;
              });

              // Perform multiple toggle operations
              for (let i = 0; i < toggleCount; i++) {
                if (currentlyFavorited) {
                  // Mock existing favorite
                  const mockFavoriteDoc = {
                    id: `fav${i}`,
                    ref: { path: `favorites/fav${i}` },
                  };
                  vi.mocked(getDocs).mockResolvedValueOnce({
                    empty: false,
                    docs: [mockFavoriteDoc],
                  } as any);
                } else {
                  // Mock no existing favorite
                  vi.mocked(getDocs).mockResolvedValueOnce({
                    empty: true,
                    docs: [],
                  } as any);
                }

                const result = await toggleFavorite(itemId, userId);
                currentlyFavorited = result;
              }

              // Property: Net change should be consistent
              // If we end favorited, increments should be 1 more than decrements
              // If we end unfavorited, increments should equal decrements
              const netChange = incrementCallCount - decrementCallCount;
              
              if (currentlyFavorited) {
                expect(netChange).toBe(1);
              } else {
                expect(netChange).toBe(0);
              }

              // Property: Total operations should match toggle count
              expect(incrementCallCount + decrementCallCount).toBe(toggleCount);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('toggleFavorite', () => {
    it('should add favorite when item is not favorited', async () => {
      // Mock no existing favorite
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      vi.mocked(runTransaction).mockImplementation(async (_db, callback) => {
        const mockTransaction = {
          set: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        };
        await callback(mockTransaction as any);
        return undefined as any;
      });

      const result = await toggleFavorite('item123', 'user456');

      expect(result).toBe(true);
      expect(runTransaction).toHaveBeenCalled();
    });

    it('should remove favorite when item is already favorited', async () => {
      // Mock existing favorite
      const mockFavoriteDoc = {
        id: 'fav1',
        ref: { path: 'favorites/fav1' },
      };
      
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [mockFavoriteDoc],
      } as any);

      vi.mocked(runTransaction).mockImplementation(async (_db, callback) => {
        const mockTransaction = {
          set: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        };
        await callback(mockTransaction as any);
        return undefined as any;
      });

      const result = await toggleFavorite('item123', 'user456');

      expect(result).toBe(false);
      expect(runTransaction).toHaveBeenCalled();
    });

    it('should throw error when Firestore operation fails', async () => {
      vi.mocked(getDocs).mockRejectedValueOnce(new Error('Firestore error'));

      await expect(toggleFavorite('item123', 'user456')).rejects.toThrow('Firestore error');
    });
  });

  describe('getFavoriteStatus', () => {
    it('should return true when user has favorited the item', async () => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'fav1' }],
      } as any);

      const result = await getFavoriteStatus('item123', 'user456');

      expect(result).toBe(true);
    });

    it('should return false when user has not favorited the item', async () => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      const result = await getFavoriteStatus('item123', 'user456');

      expect(result).toBe(false);
    });

    it('should throw error when Firestore operation fails', async () => {
      vi.mocked(getDocs).mockRejectedValueOnce(new Error('Firestore error'));

      await expect(getFavoriteStatus('item123', 'user456')).rejects.toThrow('Firestore error');
    });
  });

  describe('getItemMetadata', () => {
    it('should return item metadata when item exists', async () => {
      const mockItemData = {
        viewCount: 42,
        favoriteCount: 7,
        lastViewed: Timestamp.now(),
        statusHistory: [
          {
            status: 'available',
            timestamp: Timestamp.now(),
          },
        ],
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockItemData,
      } as any);

      const result = await getItemMetadata('item123');

      expect(result).toEqual(mockItemData);
    });

    it('should return default values when metadata fields are missing', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({}),
      } as any);

      const result = await getItemMetadata('item123');

      expect(result).toEqual({
        viewCount: 0,
        favoriteCount: 0,
        lastViewed: null,
        statusHistory: [],
      });
    });

    it('should throw error when item does not exist', async () => {
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      await expect(getItemMetadata('item123')).rejects.toThrow('Item with ID item123 not found');
    });

    it('should throw error when Firestore operation fails', async () => {
      vi.mocked(getDoc).mockRejectedValueOnce(new Error('Firestore error'));

      await expect(getItemMetadata('item123')).rejects.toThrow('Firestore error');
    });
  });
});
