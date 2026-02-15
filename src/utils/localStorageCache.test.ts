import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  cachePendingSwipe,
  getPendingSwipes,
  removePendingSwipe,
  clearPendingSwipes,
  cacheSessionState,
  getCachedSessionState,
  clearCachedSessionState,
  hasPendingSwipes,
  CachedSwipe,
} from './localStorageCache';
import { SwipeSession } from '../types/swipe-trading';

describe('localStorageCache', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Pending Swipes', () => {
    it('should cache a pending swipe', () => {
      const swipe: CachedSwipe = {
        sessionId: 'session1',
        userId: 'user1',
        itemId: 'item1',
        direction: 'right',
        timestamp: Date.now(),
      };

      cachePendingSwipe(swipe);
      const cached = getPendingSwipes();

      expect(cached).toHaveLength(1);
      expect(cached[0]).toEqual(swipe);
    });

    it('should cache multiple pending swipes', () => {
      const swipe1: CachedSwipe = {
        sessionId: 'session1',
        userId: 'user1',
        itemId: 'item1',
        direction: 'right',
        timestamp: Date.now(),
      };

      const swipe2: CachedSwipe = {
        sessionId: 'session1',
        userId: 'user1',
        itemId: 'item2',
        direction: 'left',
        timestamp: Date.now() + 1000,
      };

      cachePendingSwipe(swipe1);
      cachePendingSwipe(swipe2);
      const cached = getPendingSwipes();

      expect(cached).toHaveLength(2);
      expect(cached[0]).toEqual(swipe1);
      expect(cached[1]).toEqual(swipe2);
    });

    it('should remove a specific pending swipe', () => {
      const swipe1: CachedSwipe = {
        sessionId: 'session1',
        userId: 'user1',
        itemId: 'item1',
        direction: 'right',
        timestamp: Date.now(),
      };

      const swipe2: CachedSwipe = {
        sessionId: 'session1',
        userId: 'user1',
        itemId: 'item2',
        direction: 'left',
        timestamp: Date.now() + 1000,
      };

      cachePendingSwipe(swipe1);
      cachePendingSwipe(swipe2);
      removePendingSwipe(swipe1);
      const cached = getPendingSwipes();

      expect(cached).toHaveLength(1);
      expect(cached[0]).toEqual(swipe2);
    });

    it('should clear all pending swipes', () => {
      const swipe1: CachedSwipe = {
        sessionId: 'session1',
        userId: 'user1',
        itemId: 'item1',
        direction: 'right',
        timestamp: Date.now(),
      };

      const swipe2: CachedSwipe = {
        sessionId: 'session1',
        userId: 'user1',
        itemId: 'item2',
        direction: 'left',
        timestamp: Date.now() + 1000,
      };

      cachePendingSwipe(swipe1);
      cachePendingSwipe(swipe2);
      clearPendingSwipes();
      const cached = getPendingSwipes();

      expect(cached).toHaveLength(0);
    });

    it('should return empty array when no pending swipes', () => {
      const cached = getPendingSwipes();
      expect(cached).toEqual([]);
    });

    it('should detect when there are pending swipes', () => {
      expect(hasPendingSwipes()).toBe(false);

      const swipe: CachedSwipe = {
        sessionId: 'session1',
        userId: 'user1',
        itemId: 'item1',
        direction: 'right',
        timestamp: Date.now(),
      };

      cachePendingSwipe(swipe);
      expect(hasPendingSwipes()).toBe(true);
    });
  });

  describe('Session State', () => {
    it('should cache session state', () => {
      const session: SwipeSession = {
        id: 'session1',
        userId: 'user1',
        tradeAnchorId: 'item1',
        createdAt: Timestamp.fromMillis(1000000),
        lastActivityAt: Timestamp.fromMillis(2000000),
        swipes: [
          {
            itemId: 'item2',
            direction: 'right',
            timestamp: Timestamp.fromMillis(1500000),
          },
        ],
      };

      cacheSessionState(session);
      const cached = getCachedSessionState();

      expect(cached).not.toBeNull();
      expect(cached?.id).toBe('session1');
      expect(cached?.userId).toBe('user1');
      expect(cached?.tradeAnchorId).toBe('item1');
      expect(cached?.swipes).toHaveLength(1);
      expect(cached?.swipes[0].itemId).toBe('item2');
      expect(cached?.swipes[0].direction).toBe('right');
    });

    it('should preserve timestamps when caching and retrieving', () => {
      const createdAtMillis = 1000000;
      const lastActivityMillis = 2000000;
      const swipeTimestampMillis = 1500000;

      const session: SwipeSession = {
        id: 'session1',
        userId: 'user1',
        tradeAnchorId: 'item1',
        createdAt: Timestamp.fromMillis(createdAtMillis),
        lastActivityAt: Timestamp.fromMillis(lastActivityMillis),
        swipes: [
          {
            itemId: 'item2',
            direction: 'right',
            timestamp: Timestamp.fromMillis(swipeTimestampMillis),
          },
        ],
      };

      cacheSessionState(session);
      const cached = getCachedSessionState();

      expect(cached?.createdAt.toMillis()).toBe(createdAtMillis);
      expect(cached?.lastActivityAt.toMillis()).toBe(lastActivityMillis);
      expect(cached?.swipes[0].timestamp.toMillis()).toBe(swipeTimestampMillis);
    });

    it('should return null when no cached session', () => {
      const cached = getCachedSessionState();
      expect(cached).toBeNull();
    });

    it('should clear cached session state', () => {
      const session: SwipeSession = {
        id: 'session1',
        userId: 'user1',
        tradeAnchorId: 'item1',
        createdAt: Timestamp.fromMillis(1000000),
        lastActivityAt: Timestamp.fromMillis(2000000),
        swipes: [],
      };

      cacheSessionState(session);
      expect(getCachedSessionState()).not.toBeNull();

      clearCachedSessionState();
      expect(getCachedSessionState()).toBeNull();
    });

    it('should handle session with multiple swipes', () => {
      const session: SwipeSession = {
        id: 'session1',
        userId: 'user1',
        tradeAnchorId: 'item1',
        createdAt: Timestamp.fromMillis(1000000),
        lastActivityAt: Timestamp.fromMillis(2000000),
        swipes: [
          {
            itemId: 'item2',
            direction: 'right',
            timestamp: Timestamp.fromMillis(1500000),
          },
          {
            itemId: 'item3',
            direction: 'left',
            timestamp: Timestamp.fromMillis(1600000),
          },
          {
            itemId: 'item4',
            direction: 'right',
            timestamp: Timestamp.fromMillis(1700000),
          },
        ],
      };

      cacheSessionState(session);
      const cached = getCachedSessionState();

      expect(cached?.swipes).toHaveLength(3);
      expect(cached?.swipes[0].itemId).toBe('item2');
      expect(cached?.swipes[1].itemId).toBe('item3');
      expect(cached?.swipes[2].itemId).toBe('item4');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully when caching swipe', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.setItem to throw an error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const swipe: CachedSwipe = {
        sessionId: 'session1',
        userId: 'user1',
        itemId: 'item1',
        direction: 'right',
        timestamp: Date.now(),
      };

      // Should not throw
      expect(() => cachePendingSwipe(swipe)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      setItemSpy.mockRestore();
    });

    it('should handle localStorage errors gracefully when retrieving', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.getItem to throw an error
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      // Should return empty array instead of throwing
      const cached = getPendingSwipes();
      expect(cached).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      getItemSpy.mockRestore();
    });

    it('should handle invalid JSON in localStorage', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Set invalid JSON directly (without mocking)
      localStorage.setItem('swipe_trading_pending_swipes', 'invalid json');

      const cached = getPendingSwipes();
      expect(cached).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
