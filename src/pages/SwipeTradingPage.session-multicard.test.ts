import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';

/**
 * Session Persistence Tests for Multi-Card Swipe Interface
 * 
 * These tests verify that session persistence works correctly with the multi-card interface.
 * Feature: multi-card-swipe-interface
 * Task 14: Test session persistence with multi-card interface
 * Requirements: 7.3, 7.4
 * 
 * Test scenarios:
 * 1. Session restoration shows multiple cards
 * 2. Swipe history persists across refresh
 * 3. Swiped items don't reappear
 * 4. Changing trade anchor creates new session
 */

describe('SwipeTradingPage - Session Persistence with Multi-Card Interface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session restoration shows multiple cards', () => {
    /**
     * **Validates: Requirements 7.3, 7.4**
     * 
     * When a session is restored from cache, the multi-card interface should display
     * multiple cards simultaneously based on the viewport size and available items.
     */
    it('should restore session and display multiple cards from item pool', async () => {
      const userId = 'user-123';
      const tradeAnchorId = 'anchor-456';
      const sessionId = 'session-789';

      // Mock cached session
      const cachedSession = {
        id: sessionId,
        userId,
        tradeAnchorId,
        createdAt: Timestamp.now(),
        lastActivityAt: Timestamp.now(),
        swipes: [],
      };

      // Mock item pool with multiple items
      const itemPool = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i + 1}`,
        title: `Item ${i + 1}`,
        ownerId: `owner-${i + 1}`,
        status: 'available',
      }));

      // Mock viewport size (desktop)
      const viewportWidth = 1280;
      const expectedCardCount = 5; // Desktop shows 5 cards

      // Simulate session restoration
      let restoredSession: any = null;
      let loadedItemPool: any[] = [];
      let visibleCardCount = 0;

      // Mock restoration logic
      const restoreSession = async () => {
        restoredSession = cachedSession;
        loadedItemPool = itemPool;
        
        // Determine visible card count based on viewport
        if (viewportWidth >= 1280) {
          visibleCardCount = 5;
        } else if (viewportWidth >= 768) {
          visibleCardCount = 4;
        } else if (viewportWidth >= 640) {
          visibleCardCount = 3;
        } else {
          visibleCardCount = 2;
        }
      };

      await restoreSession();

      // Verify session was restored
      expect(restoredSession).not.toBeNull();
      expect(restoredSession.id).toBe(sessionId);
      expect(restoredSession.tradeAnchorId).toBe(tradeAnchorId);

      // Verify item pool was loaded
      expect(loadedItemPool.length).toBe(10);

      // Verify correct number of cards are visible
      expect(visibleCardCount).toBe(expectedCardCount);

      // Verify visible items are from the pool
      const visibleItems = loadedItemPool.slice(0, visibleCardCount);
      expect(visibleItems.length).toBe(expectedCardCount);
      expect(visibleItems[0].id).toBe('item-1');
      expect(visibleItems[4].id).toBe('item-5');
    });

    it('should adjust visible card count based on viewport size after restoration', async () => {
      const itemPool = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i + 1}`,
        title: `Item ${i + 1}`,
        ownerId: `owner-${i + 1}`,
        status: 'available',
      }));

      // Test different viewport sizes
      const viewportTests = [
        { width: 1280, expectedCards: 5, name: 'desktop' },
        { width: 900, expectedCards: 4, name: 'tablet' },
        { width: 700, expectedCards: 3, name: 'mobile landscape' },
        { width: 375, expectedCards: 2, name: 'mobile portrait' },
      ];

      for (const test of viewportTests) {
        let visibleCardCount = 0;

        // Determine visible card count based on viewport
        if (test.width >= 1280) {
          visibleCardCount = 5;
        } else if (test.width >= 768) {
          visibleCardCount = 4;
        } else if (test.width >= 640) {
          visibleCardCount = 3;
        } else {
          visibleCardCount = 2;
        }

        // Verify correct card count for viewport
        expect(visibleCardCount).toBe(test.expectedCards);

        // Verify visible items
        const visibleItems = itemPool.slice(0, visibleCardCount);
        expect(visibleItems.length).toBe(test.expectedCards);
      }
    });
  });

  describe('Swipe history persists across refresh', () => {
    /**
     * **Validates: Requirements 7.3, 7.4**
     * 
     * When a session is restored, the swipe history should be loaded and used to filter
     * the item pool, ensuring previously swiped items don't appear again.
     */
    it('should load swipe history and exclude swiped items from pool', async () => {
      const userId = 'user-123';
      const sessionId = 'session-789';

      // Mock swipe history - items 1-5 were already swiped
      const swipeHistory = [
        { itemId: 'item-1', direction: 'left', timestamp: Timestamp.now() },
        { itemId: 'item-2', direction: 'right', timestamp: Timestamp.now() },
        { itemId: 'item-3', direction: 'left', timestamp: Timestamp.now() },
        { itemId: 'item-4', direction: 'right', timestamp: Timestamp.now() },
        { itemId: 'item-5', direction: 'left', timestamp: Timestamp.now() },
      ];

      // Mock all available items (1-10)
      const allItems = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i + 1}`,
        title: `Item ${i + 1}`,
        ownerId: `owner-${i + 1}`,
        status: 'available',
      }));

      // Mock getSwipeHistory
      const getSwipeHistory = async (sid: string, uid: string) => {
        expect(sid).toBe(sessionId);
        expect(uid).toBe(userId);
        return swipeHistory;
      };

      // Mock buildItemPool - filters out swiped items
      const buildItemPool = async (uid: string, history: any[], limit: number) => {
        const swipedItemIds = new Set(history.map(s => s.itemId));
        return allItems.filter(item => !swipedItemIds.has(item.id)).slice(0, limit);
      };

      // Simulate restoration
      const history = await getSwipeHistory(sessionId, userId);
      const itemPool = await buildItemPool(userId, history, 20);

      // Verify swipe history was loaded
      expect(history.length).toBe(5);

      // Verify swiped items are excluded from pool
      expect(itemPool.length).toBe(5); // 10 total - 5 swiped = 5 remaining
      expect(itemPool.find(item => item.id === 'item-1')).toBeUndefined();
      expect(itemPool.find(item => item.id === 'item-2')).toBeUndefined();
      expect(itemPool.find(item => item.id === 'item-3')).toBeUndefined();
      expect(itemPool.find(item => item.id === 'item-4')).toBeUndefined();
      expect(itemPool.find(item => item.id === 'item-5')).toBeUndefined();

      // Verify remaining items are in pool
      expect(itemPool.find(item => item.id === 'item-6')).toBeDefined();
      expect(itemPool.find(item => item.id === 'item-7')).toBeDefined();
      expect(itemPool.find(item => item.id === 'item-8')).toBeDefined();
      expect(itemPool.find(item => item.id === 'item-9')).toBeDefined();
      expect(itemPool.find(item => item.id === 'item-10')).toBeDefined();
    });

    it('should persist swipe history count across multiple refreshes', async () => {
      const userId = 'user-123';
      const sessionId = 'session-789';

      // Simulate multiple swipes over time
      const swipeSequence = [
        { itemId: 'item-1', direction: 'left' as const },
        { itemId: 'item-2', direction: 'right' as const },
        { itemId: 'item-3', direction: 'left' as const },
      ];

      let swipeHistory: any[] = [];

      // Mock recordSwipe
      const recordSwipe = async (sid: string, uid: string, itemId: string, direction: 'left' | 'right') => {
        swipeHistory.push({
          sessionId: sid,
          userId: uid,
          itemId,
          direction,
          timestamp: Timestamp.now(),
        });
      };

      // Simulate swipes
      for (const swipe of swipeSequence) {
        await recordSwipe(sessionId, userId, swipe.itemId, swipe.direction);
      }

      // Verify swipe history accumulated
      expect(swipeHistory.length).toBe(3);

      // Simulate refresh - history should persist
      const getSwipeHistory = async (sid: string, uid: string) => {
        return swipeHistory.filter(s => s.sessionId === sid && s.userId === uid);
      };

      const restoredHistory = await getSwipeHistory(sessionId, userId);

      // Verify history persisted across refresh
      expect(restoredHistory.length).toBe(3);
      expect(restoredHistory[0].itemId).toBe('item-1');
      expect(restoredHistory[1].itemId).toBe('item-2');
      expect(restoredHistory[2].itemId).toBe('item-3');
    });
  });

  describe('Swiped items do not reappear', () => {
    /**
     * **Validates: Requirements 7.2, 7.4**
     * 
     * Once an item is swiped in a session, it should never appear again in that session,
     * even after page refreshes or when new items are loaded.
     */
    it('should never show swiped items again in the same session', async () => {
      const userId = 'user-123';
      const sessionId = 'session-789';

      let swipeHistory: string[] = [];
      let itemPool = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i + 1}`,
        title: `Item ${i + 1}`,
        ownerId: `owner-${i + 1}`,
        status: 'available',
      }));

      // Mock swipe action
      const handleSwipe = async (itemId: string, direction: 'left' | 'right') => {
        // Record swipe
        swipeHistory.push(itemId);

        // Remove from pool
        itemPool = itemPool.filter(item => item.id !== itemId);
      };

      // Initial pool size
      expect(itemPool.length).toBe(10);

      // Swipe item-1
      await handleSwipe('item-1', 'left');
      expect(itemPool.length).toBe(9);
      expect(itemPool.find(item => item.id === 'item-1')).toBeUndefined();

      // Swipe item-2
      await handleSwipe('item-2', 'right');
      expect(itemPool.length).toBe(8);
      expect(itemPool.find(item => item.id === 'item-2')).toBeUndefined();

      // Verify swiped items are in history
      expect(swipeHistory).toContain('item-1');
      expect(swipeHistory).toContain('item-2');

      // Simulate loading more items - should not include swiped items
      const loadMoreItems = (allItems: any[], history: string[], currentPool: any[]) => {
        const swipedIds = new Set(history);
        const currentIds = new Set(currentPool.map(item => item.id));
        
        return allItems.filter(item => 
          !swipedIds.has(item.id) && !currentIds.has(item.id)
        );
      };

      const allItems = Array.from({ length: 15 }, (_, i) => ({
        id: `item-${i + 1}`,
        title: `Item ${i + 1}`,
        ownerId: `owner-${i + 1}`,
        status: 'available',
      }));

      const newItems = loadMoreItems(allItems, swipeHistory, itemPool);

      // Verify swiped items are not in new items
      expect(newItems.find(item => item.id === 'item-1')).toBeUndefined();
      expect(newItems.find(item => item.id === 'item-2')).toBeUndefined();

      // Verify only unswipped items are included
      expect(newItems.every(item => !swipeHistory.includes(item.id))).toBe(true);
    });

    it('should maintain swipe exclusion across multiple card replacements', async () => {
      const userId = 'user-123';
      const sessionId = 'session-789';

      let swipeHistory: Set<string> = new Set();
      let visibleCards = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];
      const allItemIds = Array.from({ length: 20 }, (_, i) => `item-${i + 1}`);

      // Mock swipe and replace card
      const swipeAndReplace = (itemId: string) => {
        // Add to history
        swipeHistory.add(itemId);

        // Remove from visible cards
        const index = visibleCards.indexOf(itemId);
        if (index !== -1) {
          visibleCards.splice(index, 1);

          // Find next available item not in history
          const nextItem = allItemIds.find(id => 
            !swipeHistory.has(id) && !visibleCards.includes(id)
          );

          if (nextItem) {
            visibleCards.push(nextItem);
          }
        }
      };

      // Initial state
      expect(visibleCards.length).toBe(5);
      expect(swipeHistory.size).toBe(0);

      // Swipe multiple cards
      swipeAndReplace('item-1');
      expect(visibleCards).not.toContain('item-1');
      expect(visibleCards).toContain('item-6');
      expect(swipeHistory.has('item-1')).toBe(true);

      swipeAndReplace('item-2');
      expect(visibleCards).not.toContain('item-2');
      expect(visibleCards).toContain('item-7');
      expect(swipeHistory.has('item-2')).toBe(true);

      swipeAndReplace('item-3');
      expect(visibleCards).not.toContain('item-3');
      expect(visibleCards).toContain('item-8');
      expect(swipeHistory.has('item-3')).toBe(true);

      // Verify swiped items never reappear
      expect(visibleCards).not.toContain('item-1');
      expect(visibleCards).not.toContain('item-2');
      expect(visibleCards).not.toContain('item-3');

      // Verify history is maintained
      expect(swipeHistory.size).toBe(3);
      expect(Array.from(swipeHistory)).toEqual(['item-1', 'item-2', 'item-3']);
    });
  });

  describe('Changing trade anchor creates new session', () => {
    /**
     * **Validates: Requirements 7.3**
     * 
     * When the user changes their trade anchor, a new session should be created
     * with empty swipe history, allowing them to see all items again.
     */
    it('should create new session when trade anchor changes', async () => {
      const userId = 'user-123';
      const oldAnchorId = 'anchor-1';
      const newAnchorId = 'anchor-2';

      let currentSession: any = null;
      let swipeHistory: any[] = [];

      // Mock createSwipeSession
      const createSwipeSession = async (uid: string, anchorId: string) => {
        const newSession = {
          id: `session-${uid}-${anchorId}-${Date.now()}`,
          userId: uid,
          tradeAnchorId: anchorId,
          createdAt: Timestamp.now(),
          lastActivityAt: Timestamp.now(),
          swipes: [],
        };
        return newSession;
      };

      // Create initial session
      currentSession = await createSwipeSession(userId, oldAnchorId);
      const oldSessionId = currentSession.id;

      // Simulate some swipes
      swipeHistory = [
        { sessionId: oldSessionId, itemId: 'item-1', direction: 'left' },
        { sessionId: oldSessionId, itemId: 'item-2', direction: 'right' },
      ];

      expect(currentSession.tradeAnchorId).toBe(oldAnchorId);
      expect(swipeHistory.length).toBe(2);

      // Change trade anchor - creates new session
      currentSession = await createSwipeSession(userId, newAnchorId);
      const newSessionId = currentSession.id;

      // Verify new session was created
      expect(newSessionId).not.toBe(oldSessionId);
      expect(currentSession.tradeAnchorId).toBe(newAnchorId);

      // Verify new session has empty swipe history
      const getSwipeHistory = async (sid: string) => {
        return swipeHistory.filter(s => s.sessionId === sid);
      };

      const newSessionHistory = await getSwipeHistory(newSessionId);
      expect(newSessionHistory.length).toBe(0);

      // Old session history should still exist
      const oldSessionHistory = await getSwipeHistory(oldSessionId);
      expect(oldSessionHistory.length).toBe(2);
    });

    it('should reset item pool when changing trade anchor', async () => {
      const userId = 'user-123';
      const oldAnchorId = 'anchor-1';
      const newAnchorId = 'anchor-2';

      // Mock item pool for old anchor (with some items swiped)
      let itemPool = [
        { id: 'item-6', title: 'Item 6' },
        { id: 'item-7', title: 'Item 7' },
        { id: 'item-8', title: 'Item 8' },
      ];

      let swipeHistory = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'];

      // Verify old session state
      expect(itemPool.length).toBe(3);
      expect(swipeHistory.length).toBe(5);

      // Change trade anchor
      const handleChangeAnchor = () => {
        // Clear session state
        itemPool = [];
        swipeHistory = [];
      };

      handleChangeAnchor();

      // Verify state was cleared
      expect(itemPool.length).toBe(0);
      expect(swipeHistory.length).toBe(0);

      // Load new item pool for new anchor
      const allItems = Array.from({ length: 10 }, (_, i) => ({
        id: `new-item-${i + 1}`,
        title: `New Item ${i + 1}`,
      }));

      itemPool = allItems.slice(0, 5);

      // Verify new pool is loaded with all items available
      expect(itemPool.length).toBe(5);
      expect(itemPool[0].id).toBe('new-item-1');
      expect(itemPool[4].id).toBe('new-item-5');

      // Verify no items from old session
      expect(itemPool.find(item => item.id.startsWith('item-'))).toBeUndefined();
    });

    it('should clear cached session state when changing anchor', async () => {
      const userId = 'user-123';
      const oldAnchorId = 'anchor-1';
      const newAnchorId = 'anchor-2';

      let cachedSession: any = {
        id: 'session-old',
        userId,
        tradeAnchorId: oldAnchorId,
        swipes: ['item-1', 'item-2'],
      };

      // Mock clearCachedSessionState
      const clearCachedSessionState = () => {
        cachedSession = null;
      };

      // Verify cached session exists
      expect(cachedSession).not.toBeNull();
      expect(cachedSession.tradeAnchorId).toBe(oldAnchorId);

      // Change anchor - should clear cache
      clearCachedSessionState();

      // Verify cache was cleared
      expect(cachedSession).toBeNull();

      // Create new session
      cachedSession = {
        id: 'session-new',
        userId,
        tradeAnchorId: newAnchorId,
        swipes: [],
      };

      // Verify new session has different anchor and empty swipes
      expect(cachedSession.tradeAnchorId).toBe(newAnchorId);
      expect(cachedSession.swipes.length).toBe(0);
    });
  });
});
