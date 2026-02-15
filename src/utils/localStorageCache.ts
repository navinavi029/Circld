/**
 * Local storage cache utility for offline support
 * Handles caching of swipe actions and session state
 */

import { SwipeRecord, SwipeSession } from '../types/swipe-trading';
import { Timestamp } from 'firebase/firestore';

const CACHE_KEYS = {
  PENDING_SWIPES: 'swipe_trading_pending_swipes',
  SESSION_STATE: 'swipe_trading_session_state',
} as const;

/**
 * Cached swipe action that needs to be synced
 */
export interface CachedSwipe {
  sessionId: string;
  userId: string;
  itemId: string;
  direction: 'left' | 'right';
  timestamp: number; // Store as number for JSON serialization
}

/**
 * Cached session state for persistence across page refreshes
 */
export interface CachedSessionState {
  sessionId: string;
  userId: string;
  tradeAnchorId: string;
  createdAt: number;
  lastActivityAt: number;
  swipes: Array<{
    itemId: string;
    direction: 'left' | 'right';
    timestamp: number;
  }>;
}

/**
 * Adds a swipe action to the local cache
 */
export function cachePendingSwipe(swipe: CachedSwipe): void {
  try {
    const cached = getPendingSwipes();
    cached.push(swipe);
    localStorage.setItem(CACHE_KEYS.PENDING_SWIPES, JSON.stringify(cached));
  } catch (error) {
    console.error('Failed to cache swipe:', error);
  }
}

/**
 * Retrieves all pending swipes from cache
 */
export function getPendingSwipes(): CachedSwipe[] {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.PENDING_SWIPES);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to retrieve pending swipes:', error);
    return [];
  }
}

/**
 * Removes a swipe from the pending cache
 */
export function removePendingSwipe(swipe: CachedSwipe): void {
  try {
    const cached = getPendingSwipes();
    const filtered = cached.filter(
      s => !(
        s.sessionId === swipe.sessionId &&
        s.itemId === swipe.itemId &&
        s.timestamp === swipe.timestamp
      )
    );
    localStorage.setItem(CACHE_KEYS.PENDING_SWIPES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove pending swipe:', error);
  }
}

/**
 * Clears all pending swipes from cache
 */
export function clearPendingSwipes(): void {
  try {
    localStorage.removeItem(CACHE_KEYS.PENDING_SWIPES);
  } catch (error) {
    console.error('Failed to clear pending swipes:', error);
  }
}

/**
 * Saves session state to local storage
 */
export function cacheSessionState(session: SwipeSession): void {
  try {
    const cached: CachedSessionState = {
      sessionId: session.id,
      userId: session.userId,
      tradeAnchorId: session.tradeAnchorId,
      createdAt: session.createdAt.toMillis(),
      lastActivityAt: session.lastActivityAt.toMillis(),
      swipes: session.swipes.map(s => ({
        itemId: s.itemId,
        direction: s.direction,
        timestamp: s.timestamp.toMillis(),
      })),
    };
    localStorage.setItem(CACHE_KEYS.SESSION_STATE, JSON.stringify(cached));
  } catch (error) {
    console.error('Failed to cache session state:', error);
  }
}

/**
 * Retrieves cached session state from local storage
 */
export function getCachedSessionState(): SwipeSession | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.SESSION_STATE);
    if (!cached) return null;

    const parsed: CachedSessionState = JSON.parse(cached);
    return {
      id: parsed.sessionId,
      userId: parsed.userId,
      tradeAnchorId: parsed.tradeAnchorId,
      createdAt: Timestamp.fromMillis(parsed.createdAt),
      lastActivityAt: Timestamp.fromMillis(parsed.lastActivityAt),
      swipes: parsed.swipes.map(s => ({
        itemId: s.itemId,
        direction: s.direction,
        timestamp: Timestamp.fromMillis(s.timestamp),
      })),
    };
  } catch (error) {
    console.error('Failed to retrieve cached session state:', error);
    return null;
  }
}

/**
 * Clears cached session state
 */
export function clearCachedSessionState(): void {
  try {
    localStorage.removeItem(CACHE_KEYS.SESSION_STATE);
  } catch (error) {
    console.error('Failed to clear cached session state:', error);
  }
}

/**
 * Checks if there are any pending swipes to sync
 */
export function hasPendingSwipes(): boolean {
  return getPendingSwipes().length > 0;
}
