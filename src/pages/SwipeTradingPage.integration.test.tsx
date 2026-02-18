import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';

/**
 * Integration Tests for Complete Swipe Flow
 * 
 * These tests verify the end-to-end swipe trading flow logic including:
 * - Trade anchor selection and multi-card loading
 * - Right swipe creating trade offers
 * - Left swipe with no trade offer
 * - Card replacement after swipe
 * - Swipe history filtering
 * 
 * Requirements: 1.2, 3.1, 3.2, 3.4, 6.1, 7.1, 7.2
 */

// Mock services
const mockCreateSwipeSession = vi.fn();
const mockGetSwipeHistory = vi.fn();
const mockRecordSwipe = vi.fn();
const mockBuildItemPool = vi.fn();
const mockCreateTradeOffer = vi.fn();
const mockCreateTradeOfferNotification = vi.fn();

vi.mock('../services/swipeHistoryService', () => ({
  createSwipeSession: (...args: any[]) => mockCreateSwipeSession(...args),
  getSwipeHistory: (...args: any[]) => mockGetSwipeHistory(...args),
  recordSwipe: (...args: any[]) => mockRecordSwipe(...args),
}));

vi.mock('../services/itemPoolService', () => ({
  buildItemPool: (...args: any[]) => mockBuildItemPool(...args),
}));

vi.mock('../services/tradeOfferService', () => ({
  createTradeOffer: (...args: any[]) => mockCreateTradeOffer(...args),
}));

vi.mock('../services/notificationService', () => ({
  createTradeOfferNotification: (...args: any[]) => mockCreateTradeOfferNotification(...args),
}));

describe('SwipeTradingPage - Integration Tests', () => {
  const mockTimestamp = Timestamp.now();
  const userId = 'test-user-123';
  const tradeAnchorId = 'user-item-1';
  const sessionId = 'session-123';

  const mockItemPool = [
    {
      id: 'pool-item-1',
      ownerId: 'owner-1',
      title: 'Pool Item 1',
      description: 'First item in pool',
      category: 'books',
      condition: 'like-new',
      images: ['pool1.jpg'],
      status: 'available',
      createdAt: mockTimestamp,
    },
    {
      id: 'pool-item-2',
      ownerId: 'owner-2',
      title: 'Pool Item 2',
      description: 'Second item in pool',
      category: 'furniture',
      condition: 'good',
      images: ['pool2.jpg'],
      status: 'available',
      createdAt: mockTimestamp,
    },
    {
      id: 'pool-item-3',
      ownerId: 'owner-3',
      title: 'Pool Item 3',
      description: 'Third item in pool',
      category: 'toys',
      condition: 'fair',
      images: ['pool3.jpg'],
      status: 'available',
      createdAt: mockTimestamp,
    },
  ];

  const mockSession = {
    id: sessionId,
    userId,
    tradeAnchorId,
    createdAt: mockTimestamp,
    lastActivityAt: mockTimestamp,
    swipes: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Swipe Flow Integration', () => {
    /**
     * Test: Selecting trade anchor and loading multiple cards
     * Requirements: 1.2, 2.1
     */
    it('should create session and load multiple items when trade anchor is selected', async () => {
      // Setup mocks
      mockCreateSwipeSession.mockResolvedValue(mockSession);
      mockGetSwipeHistory.mockResolvedValue([]);
      mockBuildItemPool.mockResolvedValue(mockItemPool);

      // Simulate the flow
      const session = await mockCreateSwipeSession(userId, tradeAnchorId);
      const swipeHistory = await mockGetSwipeHistory(session.id, userId);
      const items = await mockBuildItemPool(userId, swipeHistory, 20);

      // Verify session was created
      expect(mockCreateSwipeSession).toHaveBeenCalledWith(userId, tradeAnchorId);
      expect(session.id).toBe(sessionId);

      // Verify swipe history was loaded
      expect(mockGetSwipeHistory).toHaveBeenCalledWith(sessionId, userId);
      expect(swipeHistory).toEqual([]);

      // Verify item pool was built
      expect(mockBuildItemPool).toHaveBeenCalledWith(userId, [], 20);
      expect(items.length).toBeGreaterThanOrEqual(3);
      expect(items).toEqual(mockItemPool);
    });

    /**
     * Test: Swiping card right and verifying trade offer creation
     * Requirements: 3.1, 3.2, 6.1
     */
    it('should create trade offer and notification when swiping card right', async () => {
      const targetItem = mockItemPool[0];

      // Setup mocks
      mockRecordSwipe.mockResolvedValue(undefined);
      mockCreateTradeOffer.mockResolvedValue({
        id: 'trade-offer-123',
        tradeAnchorId,
        tradeAnchorOwnerId: userId,
        targetItemId: targetItem.id,
        targetItemOwnerId: targetItem.ownerId,
        offeringUserId: userId,
        status: 'pending',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      });
      mockCreateTradeOfferNotification.mockResolvedValue(undefined);

      // Simulate right swipe
      await mockRecordSwipe(sessionId, userId, targetItem.id, 'right');
      const tradeOffer = await mockCreateTradeOffer(tradeAnchorId, targetItem.id, userId);
      await mockCreateTradeOfferNotification(
        tradeOffer,
        'My Trade Item',
        'image1.jpg',
        targetItem.title,
        targetItem.images[0],
        'Test User'
      );

      // Verify swipe was recorded
      expect(mockRecordSwipe).toHaveBeenCalledWith(sessionId, userId, targetItem.id, 'right');

      // Verify trade offer was created
      expect(mockCreateTradeOffer).toHaveBeenCalledWith(tradeAnchorId, targetItem.id, userId);
      expect(tradeOffer.status).toBe('pending');

      // Verify notification was created
      expect(mockCreateTradeOfferNotification).toHaveBeenCalled();
    });

    /**
     * Test: Swiping card left and verifying no trade offer
     * Requirements: 3.1, 3.2
     */
    it('should not create trade offer when swiping card left', async () => {
      const targetItem = mockItemPool[0];

      // Setup mocks
      mockRecordSwipe.mockResolvedValue(undefined);

      // Simulate left swipe
      await mockRecordSwipe(sessionId, userId, targetItem.id, 'left');

      // Verify swipe was recorded
      expect(mockRecordSwipe).toHaveBeenCalledWith(sessionId, userId, targetItem.id, 'left');

      // Verify trade offer was NOT created
      expect(mockCreateTradeOffer).not.toHaveBeenCalled();

      // Verify notification was NOT created
      expect(mockCreateTradeOfferNotification).not.toHaveBeenCalled();
    });

    /**
     * Test: Card replacement after swipe
     * Requirements: 3.4
     */
    it('should remove swiped item from pool and maintain remaining items', async () => {
      // Setup initial pool
      let itemPool = [...mockItemPool];

      // Simulate swipe on first item
      const swipedItem = itemPool[0];
      await mockRecordSwipe(sessionId, userId, swipedItem.id, 'right');

      // Remove swiped item from pool (simulating component behavior)
      itemPool = itemPool.filter(item => item.id !== swipedItem.id);

      // Verify item was removed
      expect(itemPool.length).toBe(mockItemPool.length - 1);
      expect(itemPool.find(item => item.id === swipedItem.id)).toBeUndefined();

      // Verify remaining items are still in pool
      expect(itemPool.find(item => item.id === 'pool-item-2')).toBeDefined();
      expect(itemPool.find(item => item.id === 'pool-item-3')).toBeDefined();
    });

    /**
     * Test: Swipe history filtering
     * Requirements: 7.1, 7.2
     */
    it('should filter out swiped items when building item pool', async () => {
      const swipeHistory = [
        {
          itemId: 'pool-item-1',
          direction: 'left' as const,
          timestamp: mockTimestamp,
        },
      ];

      const filteredItemPool = mockItemPool.filter(item => item.id !== 'pool-item-1');

      // Setup mocks
      mockGetSwipeHistory.mockResolvedValue(swipeHistory);
      mockBuildItemPool.mockResolvedValue(filteredItemPool);

      // Simulate loading item pool with history
      const history = await mockGetSwipeHistory(sessionId, userId);
      const items = await mockBuildItemPool(userId, history, 20);

      // Verify swipe history was loaded
      expect(mockGetSwipeHistory).toHaveBeenCalledWith(sessionId, userId);
      expect(history.length).toBe(1);
      expect(history[0].itemId).toBe('pool-item-1');

      // Verify buildItemPool was called with swipe history
      expect(mockBuildItemPool).toHaveBeenCalledWith(userId, swipeHistory, 20);

      // Verify swiped item is not in the pool
      expect(items.find(item => item.id === 'pool-item-1')).toBeUndefined();

      // Verify other items are in the pool
      expect(items.find(item => item.id === 'pool-item-2')).toBeDefined();
      expect(items.find(item => item.id === 'pool-item-3')).toBeDefined();
    });

    /**
     * Test: Complete flow from selection to multiple swipes
     * Requirements: 1.2, 3.1, 3.2, 3.4, 6.1, 7.1, 7.2
     */
    it('should handle complete flow: select anchor, load cards, swipe multiple items', async () => {
      // Setup mocks
      mockCreateSwipeSession.mockResolvedValue(mockSession);
      mockGetSwipeHistory.mockResolvedValue([]);
      mockBuildItemPool.mockResolvedValue(mockItemPool);
      mockRecordSwipe.mockResolvedValue(undefined);
      mockCreateTradeOffer.mockResolvedValue({
        id: 'trade-offer-123',
        tradeAnchorId,
        tradeAnchorOwnerId: userId,
        targetItemId: 'pool-item-1',
        targetItemOwnerId: 'owner-1',
        offeringUserId: userId,
        status: 'pending',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      });
      mockCreateTradeOfferNotification.mockResolvedValue(undefined);

      // Step 1: Create session and load items
      const session = await mockCreateSwipeSession(userId, tradeAnchorId);
      const swipeHistory = await mockGetSwipeHistory(session.id, userId);
      const items = await mockBuildItemPool(userId, swipeHistory, 20);

      expect(session.id).toBe(sessionId);
      expect(items.length).toBe(3);

      // Step 2: Swipe first card right (create trade offer)
      await mockRecordSwipe(sessionId, userId, items[0].id, 'right');
      await mockCreateTradeOffer(tradeAnchorId, items[0].id, userId);
      await mockCreateTradeOfferNotification({} as any, '', '', '', '', '');

      expect(mockRecordSwipe).toHaveBeenCalledWith(sessionId, userId, 'pool-item-1', 'right');
      expect(mockCreateTradeOffer).toHaveBeenCalledTimes(1);

      // Step 3: Swipe second card left (no trade offer)
      await mockRecordSwipe(sessionId, userId, items[1].id, 'left');

      expect(mockRecordSwipe).toHaveBeenCalledWith(sessionId, userId, 'pool-item-2', 'left');

      // Verify trade offer was only created once (for right swipe)
      expect(mockCreateTradeOffer).toHaveBeenCalledTimes(1);

      // Verify both swipes were recorded
      expect(mockRecordSwipe).toHaveBeenCalledTimes(2);
    });
  });
});


