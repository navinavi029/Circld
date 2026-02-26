import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTradeOffer } from './tradeOfferService';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  setDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  },
}));

// Mock retryWithBackoff to execute immediately
vi.mock('../utils/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
}));

describe('tradeOfferService - createTradeOffer validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Requirement 3.1: Verify trade anchor has status "available"', () => {
    it('should throw error when trade anchor status is "unavailable"', async () => {
      // Mock no existing trade offer
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock trade anchor with unavailable status (first call)
      // Mock target item (second call - won't be reached but needed for mock)
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user1',
            status: 'unavailable',
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user2',
            status: 'available',
          }),
        } as any);

      await expect(
        createTradeOffer('anchor1', 'target1', 'user1')
      ).rejects.toThrow('Trade anchor item is no longer available');
    });

    it('should throw error when trade anchor status is "pending"', async () => {
      // Mock no existing trade offer
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock trade anchor with pending status (first call)
      // Mock target item (second call - won't be reached but needed for mock)
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user1',
            status: 'pending',
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user2',
            status: 'available',
          }),
        } as any);

      await expect(
        createTradeOffer('anchor1', 'target1', 'user1')
      ).rejects.toThrow('Trade anchor item is no longer available');
    });

    it('should succeed when trade anchor status is "available"', async () => {
      // Mock no existing trade offer
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock trade anchor with available status
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user1',
            status: 'available',
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user2',
            status: 'available',
            swipeInterestCount: 0,
          }),
        } as any);

      vi.mocked(doc).mockReturnValue({ id: 'offer1' } as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await createTradeOffer('anchor1', 'target1', 'user1');
      
      expect(result).toBeDefined();
      expect(result.id).toBe('offer1');
    });
  });

  describe('Requirement 3.2: Verify target item has status "available" or "pending"', () => {
    it('should throw error when target item status is "unavailable"', async () => {
      // Mock no existing trade offer
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock trade anchor with available status
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user1',
            status: 'available',
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user2',
            status: 'unavailable',
          }),
        } as any);

      await expect(
        createTradeOffer('anchor1', 'target1', 'user1')
      ).rejects.toThrow('Target item is no longer available for trade offers');
    });

    it('should succeed when target item status is "available"', async () => {
      // Mock no existing trade offer
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock both items with available status
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user1',
            status: 'available',
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user2',
            status: 'available',
            swipeInterestCount: 0,
          }),
        } as any);

      vi.mocked(doc).mockReturnValue({ id: 'offer1' } as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await createTradeOffer('anchor1', 'target1', 'user1');
      
      expect(result).toBeDefined();
      expect(result.id).toBe('offer1');
    });

    it('should succeed when target item status is "pending"', async () => {
      // Mock no existing trade offer
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock trade anchor available, target item pending
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user1',
            status: 'available',
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user2',
            status: 'pending',
            swipeInterestCount: 1,
          }),
        } as any);

      vi.mocked(doc).mockReturnValue({ id: 'offer1' } as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await createTradeOffer('anchor1', 'target1', 'user1');
      
      expect(result).toBeDefined();
      expect(result.id).toBe('offer1');
    });
  });

  describe('Requirement 3.3: Error message for unavailable trade anchor', () => {
    it('should return specific error message "Trade anchor item is no longer available"', async () => {
      // Mock no existing trade offer
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock trade anchor with unavailable status (first call)
      // Mock target item (second call - won't be reached but needed for mock)
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user1',
            status: 'unavailable',
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user2',
            status: 'available',
          }),
        } as any);

      await expect(
        createTradeOffer('anchor1', 'target1', 'user1')
      ).rejects.toThrow('Trade anchor item is no longer available');
    });
  });

  describe('Requirement 3.4: Error message for unavailable target item', () => {
    it('should return specific error message "Target item is no longer available for trade offers"', async () => {
      // Mock no existing trade offer
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock trade anchor available, target unavailable
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user1',
            status: 'available',
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user2',
            status: 'unavailable',
          }),
        } as any);

      await expect(
        createTradeOffer('anchor1', 'target1', 'user1')
      ).rejects.toThrow('Target item is no longer available for trade offers');
    });
  });

  describe('Edge cases', () => {
    it('should throw error when trade anchor does not exist', async () => {
      // Mock no existing trade offer
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock trade anchor not found
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      await expect(
        createTradeOffer('anchor1', 'target1', 'user1')
      ).rejects.toThrow('Trade anchor item not found or no longer available');
    });

    it('should throw error when target item does not exist', async () => {
      // Mock no existing trade offer
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock trade anchor exists, target does not
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user1',
            status: 'available',
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => false,
        } as any);

      await expect(
        createTradeOffer('anchor1', 'target1', 'user1')
      ).rejects.toThrow('Target item not found or no longer available');
    });

    it('should throw error when user does not own trade anchor', async () => {
      // Mock no existing trade offer
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock trade anchor owned by different user
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'differentUser',
            status: 'available',
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            ownerId: 'user2',
            status: 'available',
          }),
        } as any);

      await expect(
        createTradeOffer('anchor1', 'target1', 'user1')
      ).rejects.toThrow('User does not own the trade anchor item');
    });
  });
});

describe('tradeOfferService - acceptTradeOffer validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Requirement 6.1: Verify trade anchor is "available" before accepting', () => {
    it('should throw error when trade anchor status is "unavailable"', async () => {
      const { acceptTradeOffer } = await import('./tradeOfferService');

      // Mock offer exists
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            id: 'offer1',
            tradeAnchorId: 'anchor1',
            targetItemId: 'target1',
            tradeAnchorOwnerId: 'user1',
            targetItemOwnerId: 'user2',
            status: 'pending',
          }),
        } as any)
        // Mock trade anchor with unavailable status
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'unavailable',
          }),
        } as any)
        // Mock target item with available status
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'available',
          }),
        } as any);

      await expect(
        acceptTradeOffer('offer1', 'user2')
      ).rejects.toThrow('One or more items in this trade are no longer available');
    });

    it('should throw error when trade anchor status is "pending"', async () => {
      const { acceptTradeOffer } = await import('./tradeOfferService');

      // Mock offer exists
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            id: 'offer1',
            tradeAnchorId: 'anchor1',
            targetItemId: 'target1',
            tradeAnchorOwnerId: 'user1',
            targetItemOwnerId: 'user2',
            status: 'pending',
          }),
        } as any)
        // Mock trade anchor with pending status
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'pending',
          }),
        } as any)
        // Mock target item with available status
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'available',
          }),
        } as any);

      await expect(
        acceptTradeOffer('offer1', 'user2')
      ).rejects.toThrow('One or more items in this trade are no longer available');
    });
  });

  describe('Requirement 6.2: Verify target item is "available" before accepting', () => {
    it('should throw error when target item status is "unavailable"', async () => {
      const { acceptTradeOffer } = await import('./tradeOfferService');

      // Mock offer exists
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            id: 'offer1',
            tradeAnchorId: 'anchor1',
            targetItemId: 'target1',
            tradeAnchorOwnerId: 'user1',
            targetItemOwnerId: 'user2',
            status: 'pending',
          }),
        } as any)
        // Mock trade anchor with available status
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'available',
          }),
        } as any)
        // Mock target item with unavailable status
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'unavailable',
          }),
        } as any);

      await expect(
        acceptTradeOffer('offer1', 'user2')
      ).rejects.toThrow('One or more items in this trade are no longer available');
    });

    it('should throw error when target item status is "pending"', async () => {
      const { acceptTradeOffer } = await import('./tradeOfferService');

      // Mock offer exists
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            id: 'offer1',
            tradeAnchorId: 'anchor1',
            targetItemId: 'target1',
            tradeAnchorOwnerId: 'user1',
            targetItemOwnerId: 'user2',
            status: 'pending',
          }),
        } as any)
        // Mock trade anchor with available status
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'available',
          }),
        } as any)
        // Mock target item with pending status
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'pending',
          }),
        } as any);

      await expect(
        acceptTradeOffer('offer1', 'user2')
      ).rejects.toThrow('One or more items in this trade are no longer available');
    });
  });

  describe('Requirement 6.3: Error message for unavailable items', () => {
    it('should return specific error message when either item is unavailable', async () => {
      const { acceptTradeOffer } = await import('./tradeOfferService');

      // Mock offer exists
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            id: 'offer1',
            tradeAnchorId: 'anchor1',
            targetItemId: 'target1',
            tradeAnchorOwnerId: 'user1',
            targetItemOwnerId: 'user2',
            status: 'pending',
          }),
        } as any)
        // Mock both items with unavailable status
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'unavailable',
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'unavailable',
          }),
        } as any);

      await expect(
        acceptTradeOffer('offer1', 'user2')
      ).rejects.toThrow('One or more items in this trade are no longer available');
    });
  });

  describe('Requirement 6.4: Proceed with acceptance only if validation passes', () => {
    it('should successfully accept offer when both items are available', async () => {
      const { acceptTradeOffer } = await import('./tradeOfferService');

      // Mock offer exists
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            id: 'offer1',
            tradeAnchorId: 'anchor1',
            targetItemId: 'target1',
            tradeAnchorOwnerId: 'user1',
            targetItemOwnerId: 'user2',
            status: 'pending',
          }),
        } as any)
        // Mock both items with available status
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'available',
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'available',
          }),
        } as any);

      vi.mocked(doc).mockReturnValue({ id: 'offer1' } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await acceptTradeOffer('offer1', 'user2');
      
      expect(result).toBeDefined();
      expect(result.status).toBe('accepted');
      expect(updateDoc).toHaveBeenCalledTimes(2); // Once for target item, once for offer
    });

    it('should not update any items when validation fails', async () => {
      const { acceptTradeOffer } = await import('./tradeOfferService');

      // Mock offer exists
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            id: 'offer1',
            tradeAnchorId: 'anchor1',
            targetItemId: 'target1',
            tradeAnchorOwnerId: 'user1',
            targetItemOwnerId: 'user2',
            status: 'pending',
          }),
        } as any)
        // Mock trade anchor unavailable
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'unavailable',
          }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'available',
          }),
        } as any);

      await expect(
        acceptTradeOffer('offer1', 'user2')
      ).rejects.toThrow('One or more items in this trade are no longer available');

      // Verify no updates were made
      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should throw error when trade anchor does not exist', async () => {
      const { acceptTradeOffer } = await import('./tradeOfferService');

      // Mock offer exists
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            id: 'offer1',
            tradeAnchorId: 'anchor1',
            targetItemId: 'target1',
            tradeAnchorOwnerId: 'user1',
            targetItemOwnerId: 'user2',
            status: 'pending',
          }),
        } as any)
        // Mock trade anchor not found
        .mockResolvedValueOnce({
          exists: () => false,
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'available',
          }),
        } as any);

      await expect(
        acceptTradeOffer('offer1', 'user2')
      ).rejects.toThrow('One or more items in this trade no longer exist');
    });

    it('should throw error when target item does not exist', async () => {
      const { acceptTradeOffer } = await import('./tradeOfferService');

      // Mock offer exists
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            id: 'offer1',
            tradeAnchorId: 'anchor1',
            targetItemId: 'target1',
            tradeAnchorOwnerId: 'user1',
            targetItemOwnerId: 'user2',
            status: 'pending',
          }),
        } as any)
        // Mock trade anchor exists
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            status: 'available',
          }),
        } as any)
        // Mock target item not found
        .mockResolvedValueOnce({
          exists: () => false,
        } as any);

      await expect(
        acceptTradeOffer('offer1', 'user2')
      ).rejects.toThrow('One or more items in this trade no longer exist');
    });
  });
});
