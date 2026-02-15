import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createTradeOffer,
  getTradeOffersForUser,
  markOfferAsRead,
  getTradeOffersForItem,
} from './tradeOfferService';
import {
  getDoc,
  getDocs,
  Timestamp,
} from 'firebase/firestore';

// Mock retry utility to avoid delays in tests
vi.mock('../utils/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
}));

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => {
  const mockDoc = vi.fn(() => ({ id: 'mock-doc-id' }));
  const mockCollection = vi.fn(() => ({ path: 'mock-collection' }));
  
  return {
    collection: mockCollection,
    doc: mockDoc,
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    Timestamp: {
      now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
      fromDate: vi.fn((date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
    },
  };
});

describe('tradeOfferService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTradeOffer', () => {
    it('should create a new trade offer when none exists', async () => {
      // Mock no existing trade offers
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock item documents
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ ownerId: 'user1', status: 'available' }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ ownerId: 'owner2', status: 'available', swipeInterestCount: 5 }),
        } as any);

      const result = await createTradeOffer('anchor1', 'target1', 'user1');

      expect(result).toMatchObject({
        tradeAnchorId: 'anchor1',
        targetItemId: 'target1',
        offeringUserId: 'user1',
        tradeAnchorOwnerId: 'user1',
        targetItemOwnerId: 'owner2',
        status: 'pending',
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      
      // Verify swipeInterestCount was incremented
      const { updateDoc } = await import('firebase/firestore');
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          swipeInterestCount: 6,
        })
      );
    });

    it('should update timestamp when trade offer already exists (idempotency)', async () => {
      const existingOffer = {
        id: 'offer1',
        tradeAnchorId: 'anchor1',
        targetItemId: 'target1',
        offeringUserId: 'user1',
        tradeAnchorOwnerId: 'owner1',
        targetItemOwnerId: 'owner2',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'pending',
      };

      // Mock existing trade offer
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'offer1',
            data: () => existingOffer,
          },
        ],
      } as any);

      const result = await createTradeOffer('anchor1', 'target1', 'user1');

      expect(result.id).toBe('offer1');
      expect(result.tradeAnchorId).toBe('anchor1');
      expect(result.targetItemId).toBe('target1');
    });

    it('should throw error when trade anchor item does not exist', async () => {
      // Mock no existing trade offers
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
      // Mock no existing trade offers
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock trade anchor exists but target does not
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ ownerId: 'user1', status: 'available' }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => false,
        } as any);

      await expect(
        createTradeOffer('anchor1', 'target1', 'user1')
      ).rejects.toThrow('Target item not found or no longer available');
    });

    it('should initialize swipeInterestCount to 1 when undefined', async () => {
      // Mock no existing trade offers
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock item documents with no swipeInterestCount
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ ownerId: 'user1', status: 'available' }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ ownerId: 'owner2', status: 'available' }), // No swipeInterestCount
        } as any);

      await createTradeOffer('anchor1', 'target1', 'user1');

      // Verify swipeInterestCount was set to 1
      const { updateDoc } = await import('firebase/firestore');
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          swipeInterestCount: 1,
        })
      );
    });
  });

  describe('getTradeOffersForUser', () => {
    it('should return all trade offers for a user', async () => {
      const mockOffers = [
        {
          id: 'offer1',
          tradeAnchorId: 'anchor1',
          targetItemId: 'target1',
          offeringUserId: 'user1',
          targetItemOwnerId: 'user2',
          status: 'pending',
        },
        {
          id: 'offer2',
          tradeAnchorId: 'anchor2',
          targetItemId: 'target2',
          offeringUserId: 'user3',
          targetItemOwnerId: 'user2',
          status: 'read',
        },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockOffers.map((offer) => ({
          id: offer.id,
          data: () => offer,
        })),
      } as any);

      const result = await getTradeOffersForUser('user2');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('offer1');
      expect(result[1].id).toBe('offer2');
    });

    it('should return empty array when user has no trade offers', async () => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [],
      } as any);

      const result = await getTradeOffersForUser('user1');

      expect(result).toEqual([]);
    });
  });

  describe('markOfferAsRead', () => {
    it('should update trade offer status to read', async () => {
      const { updateDoc } = await import('firebase/firestore');
      
      // Mock the offer exists
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ status: 'pending' }),
      } as any);

      await markOfferAsRead('offer1');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'mock-doc-id' }),
        expect.objectContaining({
          status: 'read',
          updatedAt: 'SERVER_TIMESTAMP',
        })
      );
    });
  });

  describe('getTradeOffersForItem', () => {
    it('should return all trade offers for a specific item', async () => {
      const mockOffers = [
        {
          id: 'offer1',
          tradeAnchorId: 'anchor1',
          targetItemId: 'item1',
          offeringUserId: 'user1',
          targetItemOwnerId: 'owner1',
          status: 'pending',
        },
        {
          id: 'offer2',
          tradeAnchorId: 'anchor2',
          targetItemId: 'item1',
          offeringUserId: 'user2',
          targetItemOwnerId: 'owner1',
          status: 'read',
        },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: mockOffers.map((offer) => ({
          id: offer.id,
          data: () => offer,
        })),
      } as any);

      const result = await getTradeOffersForItem('item1');

      expect(result).toHaveLength(2);
      expect(result[0].targetItemId).toBe('item1');
      expect(result[1].targetItemId).toBe('item1');
    });

    it('should return empty array when item has no trade offers', async () => {
      vi.mocked(getDocs).mockResolvedValueOnce({
        docs: [],
      } as any);

      const result = await getTradeOffersForItem('item1');

      expect(result).toEqual([]);
    });
  });
});
