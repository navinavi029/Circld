import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import * as swipeHistoryService from './swipeHistoryService';
import * as localStorageCache from '../utils/localStorageCache';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}));

// Mock retryWithBackoff
vi.mock('../utils/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
}));

// Mock Firestore functions
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    arrayUnion: vi.fn((val) => val),
    serverTimestamp: vi.fn(() => Timestamp.now()),
    Timestamp: {
      now: vi.fn(() => ({
        toMillis: () => Date.now(),
      })),
      fromMillis: vi.fn((ms) => ({
        toMillis: () => ms,
      })),
    },
  };
});

describe('swipeHistoryService - Error Handling', () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('cacheSessionState error handling', () => {
    it('should handle caching errors gracefully when session has invalid timestamps', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      // Mock session with invalid timestamp
      const invalidSession = {
        id: 'session-123',
        userId: 'user-123',
        tradeAnchorId: 'item-123',
        createdAt: null, // Invalid timestamp
        lastActivityAt: Timestamp.now(),
        swipes: [],
      };

      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => invalidSession,
      });

      (updateDoc as any).mockResolvedValue(undefined);

      await swipeHistoryService.recordSwipe('session-123', 'user-123', 'item-456', 'right');

      // Should have logged a warning due to validation failure
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Session data incomplete, skipping cache:',
        expect.objectContaining({
          hasId: true,
          hasUserId: true,
          hasCreatedAt: false,
          hasLastActivityAt: true,
        })
      );
    });

    it('should handle caching errors when timestamp lacks toMillis method', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      // Mock session with invalid timestamp object
      const invalidSession = {
        id: 'session-123',
        userId: 'user-123',
        tradeAnchorId: 'item-123',
        createdAt: { seconds: 123456 }, // Missing toMillis method
        lastActivityAt: Timestamp.now(),
        swipes: [],
      };

      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => invalidSession,
      });

      (updateDoc as any).mockResolvedValue(undefined);

      const cacheSessionStateSpy = vi.spyOn(localStorageCache, 'cacheSessionState');

      await swipeHistoryService.recordSwipe('session-123', 'user-123', 'item-456', 'right');

      expect(cacheSessionStateSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Session timestamps are not valid Firestore Timestamps'
      );
    });

    it('should log error with context when caching fails in recordSwipe', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      const validSession = {
        id: 'session-123',
        userId: 'user-123',
        tradeAnchorId: 'item-123',
        createdAt: Timestamp.now(),
        lastActivityAt: Timestamp.now(),
        swipes: [],
      };

      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => validSession,
      });

      (updateDoc as any).mockResolvedValue(undefined);

      // Mock cacheSessionState to throw an error
      vi.spyOn(localStorageCache, 'cacheSessionState').mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      // Should not throw, just log error
      await expect(
        swipeHistoryService.recordSwipe('session-123', 'user-123', 'item-456', 'right')
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to cache session state after swipe:',
        expect.objectContaining({
          sessionId: 'session-123',
          userId: 'user-123',
          itemId: 'item-456',
          error: 'localStorage quota exceeded',
        })
      );
    });

    it('should handle validation failure before caching in getSwipeHistory', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      // Session missing required fields
      const incompleteSession = {
        id: 'session-123',
        userId: 'user-123',
        tradeAnchorId: 'item-123',
        createdAt: null, // Missing
        lastActivityAt: null, // Missing
        swipes: [],
      };

      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => incompleteSession,
      });

      await swipeHistoryService.getSwipeHistory('session-123', 'user-123');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Session data incomplete, skipping cache:',
        expect.objectContaining({
          hasId: true,
          hasUserId: true,
          hasCreatedAt: false,
          hasLastActivityAt: false,
        })
      );
    });

    it('should handle offline scenario with invalid cached data', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      // Simulate network error
      (getDoc as any).mockRejectedValue(new Error('network error'));
      (updateDoc as any).mockRejectedValue(new Error('network error'));

      // Mock invalid cached session
      vi.spyOn(localStorageCache, 'getCachedSessionState').mockReturnValue({
        id: 'session-123',
        userId: 'user-123',
        tradeAnchorId: 'item-123',
        createdAt: null as any, // Invalid
        lastActivityAt: null as any, // Invalid
        swipes: [],
      });

      // Should not throw because offline handling catches the error
      await swipeHistoryService.recordSwipe('session-123', 'user-123', 'item-456', 'right');

      // Should have logged warning about invalid cached data
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Cached session data incomplete, skipping update:',
        expect.objectContaining({
          hasUserId: true,
          hasCreatedAt: false,
          hasLastActivityAt: false,
        })
      );
    });
  });

  describe('offline scenarios', () => {
    it('should cache swipe when offline and handle invalid session data', async () => {
      const { getDoc, updateDoc } = await import('firebase/firestore');
      
      // Simulate offline
      (getDoc as any).mockRejectedValue(new Error('network error'));
      (updateDoc as any).mockRejectedValue(new Error('network error'));

      const cachePendingSwipeSpy = vi.spyOn(localStorageCache, 'cachePendingSwipe');
      
      // Mock getCachedSessionState to return null (no cached session)
      vi.spyOn(localStorageCache, 'getCachedSessionState').mockReturnValue(null);

      // Should not throw because offline handling catches the error
      await swipeHistoryService.recordSwipe('session-123', 'user-123', 'item-456', 'right');

      // Should have cached the pending swipe
      expect(cachePendingSwipeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-123',
          userId: 'user-123',
          itemId: 'item-456',
          direction: 'right',
        })
      );
    });

    it('should return cached history when offline', async () => {
      const { getDoc } = await import('firebase/firestore');
      
      // Simulate offline
      (getDoc as any).mockRejectedValue(new Error('network error'));

      const cachedSwipes = [
        {
          itemId: 'item-1',
          direction: 'right' as const,
          timestamp: Timestamp.now(),
        },
      ];

      vi.spyOn(localStorageCache, 'getCachedSessionState').mockReturnValue({
        id: 'session-123',
        userId: 'user-123',
        tradeAnchorId: 'item-123',
        createdAt: Timestamp.now(),
        lastActivityAt: Timestamp.now(),
        swipes: cachedSwipes,
      });

      const history = await swipeHistoryService.getSwipeHistory('session-123', 'user-123');

      expect(history).toEqual(cachedSwipes);
    });
  });
});
