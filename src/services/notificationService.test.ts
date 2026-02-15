import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import {
  createTradeOfferNotification,
  getUserNotifications,
  markAsRead,
} from './notificationService';
import { TradeOffer } from '../types/swipe-trading';
import { Timestamp } from 'firebase/firestore';

// Mock retry utility to avoid delays in tests
vi.mock('../utils/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
}));

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _methodName: 'serverTimestamp' })),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
  },
}));

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTradeOfferNotification', () => {
    it('should create a notification with correct data structure', async () => {
      const mockTradeOffer: TradeOffer = {
        id: 'offer123',
        tradeAnchorId: 'anchor123',
        tradeAnchorOwnerId: 'user1',
        targetItemId: 'target123',
        targetItemOwnerId: 'user2',
        offeringUserId: 'user1',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'pending',
      };

      const mockCollectionRef = { id: 'notifications' };
      const mockDocRef = { id: 'notification123' };

      vi.mocked(collection).mockReturnValue(mockCollectionRef as any);
      vi.mocked(doc).mockReturnValue(mockDocRef as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await createTradeOfferNotification(
        mockTradeOffer,
        'Trade Anchor Title',
        'https://example.com/anchor.jpg',
        'Target Item Title',
        'https://example.com/target.jpg',
        'John Doe'
      );

      expect(result).toMatchObject({
        id: 'notification123',
        userId: 'user2',
        type: 'trade_offer',
        tradeOfferId: 'offer123',
        read: false,
      });

      expect(result.data).toMatchObject({
        offeringUserId: 'user1',
        offeringUserName: 'John Doe',
        tradeAnchorId: 'anchor123',
        tradeAnchorTitle: 'Trade Anchor Title',
        tradeAnchorImage: 'https://example.com/anchor.jpg',
        targetItemId: 'target123',
        targetItemTitle: 'Target Item Title',
        targetItemImage: 'https://example.com/target.jpg',
      });

      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          userId: 'user2',
          type: 'trade_offer',
          tradeOfferId: 'offer123',
          read: false,
        })
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should retrieve notifications for a user ordered by creation date', async () => {
      const mockNotifications = [
        {
          id: 'notif1',
          userId: 'user1',
          type: 'trade_offer',
          tradeOfferId: 'offer1',
          read: false,
          createdAt: Timestamp.now(),
          data: {},
        },
        {
          id: 'notif2',
          userId: 'user1',
          type: 'trade_offer',
          tradeOfferId: 'offer2',
          read: true,
          createdAt: Timestamp.now(),
          data: {},
        },
      ];

      const mockDocs = mockNotifications.map(notif => ({
        id: notif.id,
        data: () => notif,
      }));

      const mockQuerySnapshot = {
        docs: mockDocs,
      };

      const mockCollectionRef = { id: 'notifications' };
      const mockQuery = { id: 'query' };

      vi.mocked(collection).mockReturnValue(mockCollectionRef as any);
      vi.mocked(query).mockReturnValue(mockQuery as any);
      vi.mocked(where).mockReturnValue({} as any);
      vi.mocked(orderBy).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      const result = await getUserNotifications('user1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('notif1');
      expect(result[1].id).toBe('notif2');
      expect(query).toHaveBeenCalledWith(
        mockCollectionRef,
        expect.anything(),
        expect.anything()
      );
      expect(where).toHaveBeenCalledWith('userId', '==', 'user1');
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should return empty array when user has no notifications', async () => {
      const mockQuerySnapshot = {
        docs: [],
      };

      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(query).mockReturnValue({} as any);
      vi.mocked(getDocs).mockResolvedValue(mockQuerySnapshot as any);

      const result = await getUserNotifications('user1');

      expect(result).toEqual([]);
    });
  });

  describe('markAsRead', () => {
    it('should update notification read status to true', async () => {
      const mockDocRef = { id: 'notification123' };

      vi.mocked(doc).mockReturnValue(mockDocRef as any);
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ read: false }),
      } as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await markAsRead('notification123');

      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
        read: true,
      });
    });
  });
});
