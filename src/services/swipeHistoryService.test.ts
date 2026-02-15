import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordSwipe,
  getSwipeHistory,
  clearHistory,
  createSwipeSession,
  syncPendingSwipes,
  restoreSessionFromCache,
} from './swipeHistoryService';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import * as localStorageCache from '../utils/localStorageCache';

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
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  arrayUnion: vi.fn((val) => val),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  Timestamp: {
    now: vi.fn(() => ({ 
      seconds: 1234567890, 
      nanoseconds: 0,
      toMillis: () => 1234567890000,
    })),
    fromMillis: vi.fn((millis) => ({
      seconds: Math.floor(millis / 1000),
      nanoseconds: (millis % 1000) * 1000000,
      toMillis: () => millis,
    })),
  },
}));

describe('swipeHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('createSwipeSession', () => {
    it('should create a new swipe session with empty swipes array', async () => {
      const mockSessionRef = { id: 'session123' };
      vi.mocked(collection).mockReturnValue('swipeSessions' as any);
      vi.mocked(doc).mockReturnValue(mockSessionRef as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      
      // Mock trade anchor validation
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ status: 'available', ownerId: 'user123' }),
      } as any);

      const result = await createSwipeSession('user123', 'item456');

      expect(result).toEqual({
        id: 'session123',
        userId: 'user123',
        tradeAnchorId: 'item456',
        createdAt: expect.any(Object),
        lastActivityAt: expect.any(Object),
        swipes: [],
      });

      expect(setDoc).toHaveBeenCalledWith(
        mockSessionRef,
        expect.objectContaining({
          userId: 'user123',
          tradeAnchorId: 'item456',
          swipes: [],
          createdAt: 'SERVER_TIMESTAMP',
          lastActivityAt: 'SERVER_TIMESTAMP',
        })
      );
    });
  });

  describe('recordSwipe', () => {
    it('should record a swipe action in an existing session', async () => {
      const mockSessionRef = { id: 'session123' };
      const mockSessionDoc = {
        exists: () => true,
        data: () => ({
          id: 'session123',
          userId: 'user123',
          tradeAnchorId: 'item456',
          swipes: [],
        }),
      };

      vi.mocked(doc).mockReturnValue(mockSessionRef as any);
      vi.mocked(getDoc).mockResolvedValue(mockSessionDoc as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await recordSwipe('session123', 'user123', 'item789', 'right');

      expect(updateDoc).toHaveBeenCalledWith(
        mockSessionRef,
        expect.objectContaining({
          swipes: expect.objectContaining({
            itemId: 'item789',
            direction: 'right',
            timestamp: expect.any(Object),
          }),
          lastActivityAt: 'SERVER_TIMESTAMP',
        })
      );
    });

    it('should throw error if session does not exist', async () => {
      const mockSessionDoc = {
        exists: () => false,
      };

      vi.mocked(getDoc).mockResolvedValue(mockSessionDoc as any);

      await expect(
        recordSwipe('session123', 'user123', 'item789', 'right')
      ).rejects.toThrow('Swipe session not found');
    });

    it('should throw error if session does not belong to user', async () => {
      const mockSessionDoc = {
        exists: () => true,
        data: () => ({
          userId: 'differentUser',
          tradeAnchorId: 'item456',
          swipes: [],
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockSessionDoc as any);

      await expect(
        recordSwipe('session123', 'user123', 'item789', 'right')
      ).rejects.toThrow('Session does not belong to user');
    });
  });

  describe('getSwipeHistory', () => {
    it('should retrieve swipe history for a session', async () => {
      const mockSwipes = [
        { itemId: 'item1', direction: 'left', timestamp: Timestamp.now() },
        { itemId: 'item2', direction: 'right', timestamp: Timestamp.now() },
      ];

      const mockSessionDoc = {
        exists: () => true,
        data: () => ({
          userId: 'user123',
          tradeAnchorId: 'item456',
          swipes: mockSwipes,
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockSessionDoc as any);

      const result = await getSwipeHistory('session123', 'user123');

      expect(result).toEqual(mockSwipes);
    });

    it('should return empty array if no swipes exist', async () => {
      const mockSessionDoc = {
        exists: () => true,
        data: () => ({
          userId: 'user123',
          tradeAnchorId: 'item456',
          swipes: undefined,
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockSessionDoc as any);

      const result = await getSwipeHistory('session123', 'user123');

      expect(result).toEqual([]);
    });

    it('should throw error if session does not exist', async () => {
      const mockSessionDoc = {
        exists: () => false,
      };

      vi.mocked(getDoc).mockResolvedValue(mockSessionDoc as any);

      await expect(
        getSwipeHistory('session123', 'user123')
      ).rejects.toThrow('Swipe session not found');
    });

    it('should throw error if session does not belong to user', async () => {
      const mockSessionDoc = {
        exists: () => true,
        data: () => ({
          userId: 'differentUser',
          tradeAnchorId: 'item456',
          swipes: [],
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockSessionDoc as any);

      await expect(
        getSwipeHistory('session123', 'user123')
      ).rejects.toThrow('Session does not belong to user');
    });
  });

  describe('clearHistory', () => {
    it('should clear swipe history for a session', async () => {
      const mockSessionRef = { id: 'session123' };
      const mockSessionDoc = {
        exists: () => true,
        data: () => ({
          userId: 'user123',
          tradeAnchorId: 'item456',
          swipes: [
            { itemId: 'item1', direction: 'left', timestamp: Timestamp.now() },
          ],
        }),
      };

      vi.mocked(doc).mockReturnValue(mockSessionRef as any);
      vi.mocked(getDoc).mockResolvedValue(mockSessionDoc as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await clearHistory('session123', 'user123');

      expect(updateDoc).toHaveBeenCalledWith(
        mockSessionRef,
        expect.objectContaining({
          swipes: [],
          lastActivityAt: 'SERVER_TIMESTAMP',
        })
      );
    });

    it('should throw error if session does not exist', async () => {
      const mockSessionDoc = {
        exists: () => false,
      };

      vi.mocked(getDoc).mockResolvedValue(mockSessionDoc as any);

      await expect(
        clearHistory('session123', 'user123')
      ).rejects.toThrow('Swipe session not found');
    });

    it('should throw error if session does not belong to user', async () => {
      const mockSessionDoc = {
        exists: () => true,
        data: () => ({
          userId: 'differentUser',
          tradeAnchorId: 'item456',
          swipes: [],
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockSessionDoc as any);

      await expect(
        clearHistory('session123', 'user123')
      ).rejects.toThrow('Session does not belong to user');
    });
  });

  describe('Offline Support', () => {
    it('should cache swipe when offline', async () => {
      const mockSessionDoc = {
        exists: () => true,
        data: () => ({
          id: 'session123',
          userId: 'user123',
          tradeAnchorId: 'item456',
          swipes: [],
          createdAt: Timestamp.now(),
          lastActivityAt: Timestamp.now(),
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockSessionDoc as any);
      vi.mocked(updateDoc).mockRejectedValue(new Error('network error'));

      const cacheSpy = vi.spyOn(localStorageCache, 'cachePendingSwipe');

      // Should not throw even though network fails
      await recordSwipe('session123', 'user123', 'item789', 'right');

      expect(cacheSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session123',
          userId: 'user123',
          itemId: 'item789',
          direction: 'right',
        })
      );
    });

    it('should sync pending swipes when online', async () => {
      const mockPendingSwipes = [
        {
          sessionId: 'session123',
          userId: 'user123',
          itemId: 'item1',
          direction: 'right' as const,
          timestamp: Date.now(),
        },
        {
          sessionId: 'session123',
          userId: 'user123',
          itemId: 'item2',
          direction: 'left' as const,
          timestamp: Date.now() + 1000,
        },
      ];

      vi.spyOn(localStorageCache, 'getPendingSwipes').mockReturnValue(mockPendingSwipes);
      
      const mockSessionDoc = {
        exists: () => true,
        data: () => ({
          userId: 'user123',
          tradeAnchorId: 'item456',
          swipes: [],
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockSessionDoc as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const removeSpy = vi.spyOn(localStorageCache, 'removePendingSwipe');

      const syncedCount = await syncPendingSwipes();

      expect(syncedCount).toBe(2);
      expect(updateDoc).toHaveBeenCalledTimes(2);
      expect(removeSpy).toHaveBeenCalledTimes(2);
    });

    it('should restore session from cache', () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        tradeAnchorId: 'item456',
        createdAt: Timestamp.now(),
        lastActivityAt: Timestamp.now(),
        swipes: [],
      };

      vi.spyOn(localStorageCache, 'getCachedSessionState').mockReturnValue(mockSession);

      const restored = restoreSessionFromCache('user123');

      expect(restored).toEqual(mockSession);
    });

    it('should not restore session if user does not match', () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        tradeAnchorId: 'item456',
        createdAt: Timestamp.now(),
        lastActivityAt: Timestamp.now(),
        swipes: [],
      };

      vi.spyOn(localStorageCache, 'getCachedSessionState').mockReturnValue(mockSession);

      const restored = restoreSessionFromCache('differentUser');

      expect(restored).toBeNull();
    });

    it('should use cached data when offline on getSwipeHistory', async () => {
      const mockSession = {
        id: 'session123',
        userId: 'user123',
        tradeAnchorId: 'item456',
        createdAt: Timestamp.now(),
        lastActivityAt: Timestamp.now(),
        swipes: [
          { itemId: 'item1', direction: 'left' as const, timestamp: Timestamp.now() },
          { itemId: 'item2', direction: 'right' as const, timestamp: Timestamp.now() },
        ],
      };

      vi.mocked(getDoc).mockRejectedValue(new Error('network error'));
      vi.spyOn(localStorageCache, 'getCachedSessionState').mockReturnValue(mockSession);

      const result = await getSwipeHistory('session123', 'user123');

      expect(result).toEqual(mockSession.swipes);
    });
  });
});
