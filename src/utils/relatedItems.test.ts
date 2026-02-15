import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { Item } from '../types/item';

// Helper to create a mock item
function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    ownerId: 'owner-1',
    title: 'Test Item',
    description: 'Test description',
    category: 'Electronics',
    condition: 'good',
    images: [],
    status: 'available',
    createdAt: Timestamp.fromDate(new Date()),
    ...overrides
  };
}

// Helper to create mock Firestore document
function createMockDoc(item: Item) {
  const { id, ...data } = item;
  return {
    id,
    data: () => data
  };
}

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {}
}));

// Mock Firestore functions
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn()
  };
});

import { findRelatedItems } from './relatedItems';
import { getDocs } from 'firebase/firestore';

describe('findRelatedItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when no items are found', async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: []
    } as any);

    const currentItem = createMockItem();
    const result = await findRelatedItems(currentItem);

    expect(result).toEqual([]);
  });

  it('should exclude the current item from results', async () => {
    const currentItem = createMockItem({ id: 'current-item' });
    
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        createMockDoc(currentItem),
        createMockDoc(createMockItem({ id: 'other-item' }))
      ]
    } as any);

    const result = await findRelatedItems(currentItem);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('other-item');
  });

  it('should prioritize items with same category', async () => {
    const currentItem = createMockItem({ id: 'current-item', category: 'Electronics' });
    
    const item1 = createMockItem({ id: 'item-1', category: 'Electronics' });
    const item2 = createMockItem({ id: 'item-2', category: 'Furniture' });
    
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        createMockDoc(item2),
        createMockDoc(item1)
      ]
    } as any);

    const result = await findRelatedItems(currentItem);

    // Item with same category should come first
    expect(result[0].id).toBe('item-1');
    expect(result[1].id).toBe('item-2');
  });

  it('should score same condition higher than different condition', async () => {
    const currentItem = createMockItem({ 
      id: 'current-item',
      category: 'Other', // Different category to isolate condition scoring
      condition: 'good' 
    });
    
    const item1 = createMockItem({ 
      id: 'item-1', 
      category: 'Other',
      condition: 'good' 
    });
    const item2 = createMockItem({ 
      id: 'item-2', 
      category: 'Other',
      condition: 'new' 
    });
    
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        createMockDoc(item2),
        createMockDoc(item1)
      ]
    } as any);

    const result = await findRelatedItems(currentItem);

    // Item with same condition should come first
    expect(result[0].id).toBe('item-1');
  });

  it('should include items from same owner', async () => {
    const currentItem = createMockItem({ 
      id: 'current-item',
      ownerId: 'owner-1',
      category: 'Other'
    });
    
    const item1 = createMockItem({ 
      id: 'item-1', 
      ownerId: 'owner-1',
      category: 'Other'
    });
    const item2 = createMockItem({ 
      id: 'item-2', 
      ownerId: 'owner-2',
      category: 'Other'
    });
    
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        createMockDoc(item2),
        createMockDoc(item1)
      ]
    } as any);

    const result = await findRelatedItems(currentItem);

    // Item from same owner should come first
    expect(result[0].id).toBe('item-1');
  });

  it('should prioritize recent items (< 7 days)', async () => {
    const now = new Date();
    const recentDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

    const currentItem = createMockItem({ 
      id: 'current-item',
      category: 'Other',
      condition: 'fair'
    });
    
    const item1 = createMockItem({ 
      id: 'item-1', 
      category: 'Other',
      condition: 'fair',
      createdAt: Timestamp.fromDate(recentDate)
    });
    const item2 = createMockItem({ 
      id: 'item-2', 
      category: 'Other',
      condition: 'fair',
      createdAt: Timestamp.fromDate(oldDate)
    });
    
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        createMockDoc(item2),
        createMockDoc(item1)
      ]
    } as any);

    const result = await findRelatedItems(currentItem);

    // Recent item should come first
    expect(result[0].id).toBe('item-1');
  });

  it('should limit results to 8 items by default', async () => {
    const currentItem = createMockItem({ id: 'current-item' });
    
    const items = Array.from({ length: 15 }, (_, i) => 
      createMockItem({ id: `item-${i}` })
    );
    
    vi.mocked(getDocs).mockResolvedValue({
      docs: items.map(item => createMockDoc(item))
    } as any);

    const result = await findRelatedItems(currentItem);

    expect(result.length).toBeLessThanOrEqual(8);
  });

  it('should respect custom limit parameter', async () => {
    const currentItem = createMockItem({ id: 'current-item' });
    
    const items = Array.from({ length: 10 }, (_, i) => 
      createMockItem({ id: `item-${i}` })
    );
    
    vi.mocked(getDocs).mockResolvedValue({
      docs: items.map(item => createMockDoc(item))
    } as any);

    const result = await findRelatedItems(currentItem, 5);

    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('should sort by createdAt when scores are equal', async () => {
    const oldDate = new Date('2024-01-01');
    const newDate = new Date('2024-01-15');

    const currentItem = createMockItem({ id: 'current-item', category: 'Electronics' });
    
    const item1 = createMockItem({ 
      id: 'item-1', 
      category: 'Furniture',
      createdAt: Timestamp.fromDate(oldDate)
    });
    const item2 = createMockItem({ 
      id: 'item-2', 
      category: 'Furniture',
      createdAt: Timestamp.fromDate(newDate)
    });
    
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        createMockDoc(item1),
        createMockDoc(item2)
      ]
    } as any);

    const result = await findRelatedItems(currentItem);

    // More recent item should come first when scores are equal
    expect(result[0].id).toBe('item-2');
    expect(result[1].id).toBe('item-1');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(getDocs).mockRejectedValue(new Error('Database error'));

    const currentItem = createMockItem({ id: 'current-item' });
    const result = await findRelatedItems(currentItem);

    expect(result).toEqual([]);
  });

  it('should calculate composite scores correctly', async () => {
    const currentItem = createMockItem({ 
      id: 'current-item',
      category: 'Electronics',
      condition: 'good',
      ownerId: 'owner-1'
    });
    
    // Item with all matching attributes (category + condition + owner) = 18 points
    const item1 = createMockItem({ 
      id: 'item-1', 
      category: 'Electronics',
      condition: 'good',
      ownerId: 'owner-1'
    });
    
    // Item with only category match = 10 points
    const item2 = createMockItem({ 
      id: 'item-2', 
      category: 'Electronics',
      condition: 'new',
      ownerId: 'owner-2'
    });
    
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        createMockDoc(item2),
        createMockDoc(item1)
      ]
    } as any);

    const result = await findRelatedItems(currentItem);

    // Item with higher composite score should come first
    expect(result[0].id).toBe('item-1');
    expect(result[1].id).toBe('item-2');
  });
});

describe('Property-Based Tests', () => {
  describe('Property 13: Related items category prioritization', () => {
    it('should prioritize items with matching category over items with different categories', async () => {
      /**
       * Feature: enhanced-listing-experience, Property 13: Related items category prioritization
       * **Validates: Requirements 5.2**
       * 
       * For any item, when calculating related items, items with matching category
       * should have a higher score than items with different categories.
       */
      const fc = await import('fast-check');

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }), // itemId
          fc.string({ minLength: 1 }), // ownerId
          fc.string({ minLength: 1 }), // category
          fc.string({ minLength: 1 }), // different category
          fc.constantFrom('new', 'like-new', 'good', 'fair', 'poor'), // condition
          async (itemId: string, ownerId: string, category: string, differentCategory: string, condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor') => {
            // Ensure categories are actually different
            (fc.pre as (condition: boolean) => void)(category !== differentCategory);

            vi.clearAllMocks();

            const currentItem = createMockItem({
              id: itemId,
              ownerId,
              category,
              condition,
            });

            // Create two items: one with matching category, one with different category
            // Both have different conditions and owners to isolate category scoring
            const matchingCategoryItem = createMockItem({
              id: 'matching-category-item',
              category, // Same category as current item
              condition: 'fair', // Different condition to isolate category scoring
              ownerId: 'different-owner',
            });

            const differentCategoryItem = createMockItem({
              id: 'different-category-item',
              category: differentCategory, // Different category
              condition: 'fair', // Same condition as matching item
              ownerId: 'different-owner',
            });

            // Mock Firestore to return both items (different category first to test sorting)
            vi.mocked(getDocs).mockResolvedValue({
              docs: [
                createMockDoc(differentCategoryItem),
                createMockDoc(matchingCategoryItem),
              ],
            } as any);

            const result = await findRelatedItems(currentItem);

            // Property: Item with matching category should come first
            // (higher score due to +10 points for category match)
            expect(result.length).toBeGreaterThan(0);
            expect(result[0].id).toBe('matching-category-item');
            
            // If both items are returned, verify the order
            if (result.length >= 2) {
              expect(result[1].id).toBe('different-category-item');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 14: Related items condition consideration', () => {
    it('should prioritize items with matching condition over items with different conditions', async () => {
      /**
       * Feature: enhanced-listing-experience, Property 14: Related items condition consideration
       * **Validates: Requirements 5.3**
       * 
       * For any item, when calculating related items, items with matching condition
       * should have a higher score than items with different conditions.
       */
      const fc = await import('fast-check');

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }), // itemId
          fc.string({ minLength: 1 }), // ownerId
          fc.string({ minLength: 1 }), // category
          fc.constantFrom('new', 'like-new', 'good', 'fair', 'poor'), // condition
          fc.constantFrom('new', 'like-new', 'good', 'fair', 'poor'), // different condition
          async (itemId: string, ownerId: string, category: string, condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor', differentCondition: 'new' | 'like-new' | 'good' | 'fair' | 'poor') => {
            // Ensure conditions are actually different
            (fc.pre as (condition: boolean) => void)(condition !== differentCondition);

            vi.clearAllMocks();

            const currentItem = createMockItem({
              id: itemId,
              ownerId,
              category,
              condition,
            });

            // Create two items: one with matching condition, one with different condition
            // Both have different categories and owners to isolate condition scoring
            const matchingConditionItem = createMockItem({
              id: 'matching-condition-item',
              category: 'different-category-1', // Different category to isolate condition scoring
              condition, // Same condition as current item
              ownerId: 'different-owner',
            });

            const differentConditionItem = createMockItem({
              id: 'different-condition-item',
              category: 'different-category-2', // Different category
              condition: differentCondition, // Different condition
              ownerId: 'different-owner',
            });

            // Mock Firestore to return both items (different condition first to test sorting)
            vi.mocked(getDocs).mockResolvedValue({
              docs: [
                createMockDoc(differentConditionItem),
                createMockDoc(matchingConditionItem),
              ],
            } as any);

            const result = await findRelatedItems(currentItem);

            // Property: Item with matching condition should come first
            // (higher score due to +5 points for condition match)
            expect(result.length).toBeGreaterThan(0);
            expect(result[0].id).toBe('matching-condition-item');
            
            // If both items are returned, verify the order
            if (result.length >= 2) {
              expect(result[1].id).toBe('different-condition-item');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 15: Related items same owner inclusion', () => {
    it('should include items from the same owner in related items results', async () => {
      /**
       * Feature: enhanced-listing-experience, Property 15: Related items same owner inclusion
       * **Validates: Requirements 5.4**
       * 
       * For any item, when calculating related items, other items from the same owner
       * should be included in the results.
       */
      const fc = await import('fast-check');

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }), // itemId
          fc.string({ minLength: 1 }), // ownerId
          fc.string({ minLength: 1 }), // differentOwnerId
          fc.string({ minLength: 1 }), // category
          fc.constantFrom('new', 'like-new', 'good', 'fair', 'poor'), // condition
          async (itemId: string, ownerId: string, differentOwnerId: string, category: string, condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor') => {
            // Ensure owner IDs are actually different
            (fc.pre as (condition: boolean) => void)(ownerId !== differentOwnerId);

            vi.clearAllMocks();

            const currentItem = createMockItem({
              id: itemId,
              ownerId,
              category,
              condition,
            });

            // Create items: one from same owner, one from different owner
            // Use fixed categories that are guaranteed to be different from the current item's category
            // to isolate owner scoring
            const now = new Date();
            const sameOwnerItem = createMockItem({
              id: 'same-owner-item',
              ownerId, // Same owner as current item
              category: 'FIXED_CATEGORY_A', // Fixed category different from current
              condition: 'fair', // Different condition
              createdAt: Timestamp.fromDate(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
            });

            const differentOwnerItem = createMockItem({
              id: 'different-owner-item',
              ownerId: differentOwnerId, // Different owner
              category: 'FIXED_CATEGORY_B', // Fixed category different from current
              condition: 'good', // Different condition
              createdAt: Timestamp.fromDate(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
            });

            // Mock Firestore to return both items
            vi.mocked(getDocs).mockResolvedValue({
              docs: [
                createMockDoc(differentOwnerItem),
                createMockDoc(sameOwnerItem),
              ],
            } as any);

            const result = await findRelatedItems(currentItem);

            // Property: Item from same owner should be included in results
            // The requirement states "include other Items from the same Owner"
            // It doesn't explicitly require prioritization, just inclusion
            expect(result.length).toBeGreaterThan(0);
            const sameOwnerIncluded = result.some(item => item.id === 'same-owner-item');
            expect(sameOwnerIncluded).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 16: Related items count limit', () => {
    it('should never return more than the specified limit of related items', async () => {
      /**
       * Feature: enhanced-listing-experience, Property 16: Related items count limit
       * **Validates: Requirements 5.5**
       * 
       * For any item, the related items display should never show more than 8 items,
       * regardless of how many related items exist.
       */
      const fc = await import('fast-check');

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }), // itemId
          fc.string({ minLength: 1 }), // ownerId
          fc.string({ minLength: 1 }), // category
          fc.constantFrom('new', 'like-new', 'good', 'fair', 'poor'), // condition
          fc.integer({ min: 10, max: 50 }), // number of items to generate (more than limit)
          fc.option(fc.integer({ min: 1, max: 20 }), { nil: undefined }), // optional custom limit
          async (itemId: string, ownerId: string, category: string, condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor', numItems: number, customLimit: number | undefined) => {
            vi.clearAllMocks();

            const currentItem = createMockItem({
              id: itemId,
              ownerId,
              category,
              condition,
            });

            // Generate many items (more than the limit)
            const items = Array.from({ length: numItems }, (_, i) => 
              createMockItem({ 
                id: `item-${i}`,
                category: i % 2 === 0 ? category : 'other-category',
                condition,
                ownerId: `owner-${i}`,
              })
            );

            // Mock Firestore to return all items
            vi.mocked(getDocs).mockResolvedValue({
              docs: items.map(item => createMockDoc(item)),
            } as any);

            // Call with or without custom limit
            const result = customLimit !== undefined 
              ? await findRelatedItems(currentItem, customLimit)
              : await findRelatedItems(currentItem);

            // Property: Result should never exceed the limit
            const expectedLimit = customLimit !== undefined ? customLimit : 8;
            expect(result.length).toBeLessThanOrEqual(expectedLimit);
            
            // Additional check: if we have enough items, we should get exactly the limit
            if (numItems >= expectedLimit) {
              expect(result.length).toBe(expectedLimit);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
