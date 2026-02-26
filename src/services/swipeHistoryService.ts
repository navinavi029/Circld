import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SwipeSession, SwipeRecord } from '../types/swipe-trading';
import { retryWithBackoff } from '../utils/retryWithBackoff';
import {
  cachePendingSwipe,
  removePendingSwipe,
  getPendingSwipes,
  cacheSessionState,
  getCachedSessionState,
} from '../utils/localStorageCache';

/**
 * Records a swipe action in the current session.
 * If offline, caches the swipe locally for later sync.
 * If the session doesn't exist, this will fail - sessions should be created first.
 * 
 * @param sessionId - ID of the swipe session
 * @param userId - ID of the user performing the swipe
 * @param itemId - ID of the item being swiped on
 * @param direction - Direction of the swipe ('left' or 'right')
 */
export async function recordSwipe(
  sessionId: string,
  userId: string,
  itemId: string,
  direction: 'left' | 'right'
): Promise<void> {
  // Validate inputs
  if (!sessionId || !userId || !itemId || !direction) {
    throw new Error('Invalid input: All parameters are required');
  }

  if (direction !== 'left' && direction !== 'right') {
    throw new Error('Invalid direction: Must be "left" or "right"');
  }

  try {
    await retryWithBackoff(async () => {
      const sessionRef = doc(db, 'swipeSessions', sessionId);
      
      // Verify session exists and belongs to user
      const sessionDoc = await getDoc(sessionRef);
      if (!sessionDoc.exists()) {
        throw new Error('Swipe session not found');
      }
      
      const sessionData = sessionDoc.data() as SwipeSession;
      if (sessionData.userId !== userId) {
        throw new Error('Session does not belong to user');
      }
      
      const swipeRecord: SwipeRecord = {
        itemId,
        direction,
        timestamp: Timestamp.now(),
      };
      
      await updateDoc(sessionRef, {
        swipes: arrayUnion(swipeRecord),
        lastActivityAt: serverTimestamp(),
      });

      // Update cached session state after successful sync
      try {
        const updatedSession = {
          ...sessionData,
          swipes: [...sessionData.swipes, swipeRecord],
          lastActivityAt: Timestamp.now(),
        };
        
        // Validate session data before caching
        if (updatedSession.id && updatedSession.userId && updatedSession.createdAt && updatedSession.lastActivityAt) {
          cacheSessionState(updatedSession);
        } else {
          console.warn('Session data incomplete, skipping cache:', {
            hasId: !!updatedSession.id,
            hasUserId: !!updatedSession.userId,
            hasCreatedAt: !!updatedSession.createdAt,
            hasLastActivityAt: !!updatedSession.lastActivityAt
          });
        }
      } catch (cacheError) {
        console.error('Failed to cache session state after swipe:', {
          sessionId,
          userId,
          itemId,
          error: cacheError instanceof Error ? cacheError.message : 'Unknown error'
        });
      }
    });
  } catch (error) {
    // If offline or network error, cache the swipe for later sync
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('network') || errorMessage.includes('offline')) {
      cachePendingSwipe({
        sessionId,
        userId,
        itemId,
        direction,
        timestamp: Date.now(),
      });
      
      // Update local cache optimistically
      try {
        const cachedSession = getCachedSessionState();
        if (cachedSession && cachedSession.id === sessionId) {
          cachedSession.swipes.push({
            itemId,
            direction,
            timestamp: Timestamp.fromMillis(Date.now()),
          });
          
          // Validate session data before caching
          if (cachedSession.userId && cachedSession.createdAt && cachedSession.lastActivityAt) {
            cacheSessionState(cachedSession);
          } else {
            console.warn('Cached session data incomplete, skipping update:', {
              hasUserId: !!cachedSession.userId,
              hasCreatedAt: !!cachedSession.createdAt,
              hasLastActivityAt: !!cachedSession.lastActivityAt
            });
          }
        }
      } catch (cacheError) {
        console.error('Failed to update cached session state optimistically:', {
          sessionId,
          userId,
          itemId,
          error: cacheError instanceof Error ? cacheError.message : 'Unknown error'
        });
      }
    } else {
      throw error;
    }
  }
}

/**
 * Retrieves the swipe history for a specific session.
 * First tries to fetch from Firestore, falls back to cached data if offline.
 * 
 * @param sessionId - ID of the swipe session
 * @param userId - ID of the user (for verification)
 * @returns Array of swipe records from the session
 */
export async function getSwipeHistory(
  sessionId: string,
  userId: string
): Promise<SwipeRecord[]> {
  if (!sessionId || !userId) {
    throw new Error('Invalid input: Session ID and User ID are required');
  }

  try {
    const history = await retryWithBackoff(async () => {
      const sessionRef = doc(db, 'swipeSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        throw new Error('Swipe session not found');
      }
      
      const sessionData = sessionDoc.data() as SwipeSession;
      if (sessionData.userId !== userId) {
        throw new Error('Session does not belong to user');
      }

      // Update cache with fresh data
      try {
        // Validate session data before caching
        if (sessionData.id && sessionData.userId && sessionData.createdAt && sessionData.lastActivityAt) {
          cacheSessionState(sessionData);
        } else {
          console.warn('Session data incomplete, skipping cache:', {
            hasId: !!sessionData.id,
            hasUserId: !!sessionData.userId,
            hasCreatedAt: !!sessionData.createdAt,
            hasLastActivityAt: !!sessionData.lastActivityAt
          });
        }
      } catch (cacheError) {
        console.error('Failed to cache session state after fetching history:', {
          sessionId,
          userId,
          error: cacheError instanceof Error ? cacheError.message : 'Unknown error'
        });
      }
      
      return sessionData.swipes || [];
    });

    return history;
  } catch (error) {
    // If offline, return cached data
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('network') || errorMessage.includes('offline')) {
      const cachedSession = getCachedSessionState();
      if (cachedSession && cachedSession.id === sessionId && cachedSession.userId === userId) {
        return cachedSession.swipes;
      }
    }
    throw error;
  }
}

/**
 * Clears the swipe history for a session by resetting the swipes array.
 * 
 * @param sessionId - ID of the swipe session
 * @param userId - ID of the user (for verification)
 */
export async function clearHistory(
  sessionId: string,
  userId: string
): Promise<void> {
  if (!sessionId || !userId) {
    throw new Error('Invalid input: Session ID and User ID are required');
  }

  return retryWithBackoff(async () => {
    const sessionRef = doc(db, 'swipeSessions', sessionId);
    
    // Verify session exists and belongs to user
    const sessionDoc = await getDoc(sessionRef);
    if (!sessionDoc.exists()) {
      throw new Error('Swipe session not found');
    }
    
    const sessionData = sessionDoc.data() as SwipeSession;
    if (sessionData.userId !== userId) {
      throw new Error('Session does not belong to user');
    }
    
    await updateDoc(sessionRef, {
      swipes: [],
      lastActivityAt: serverTimestamp(),
    });
  });
}

/**
 * Creates a new swipe session for a user with a specific trade anchor.
 * This should be called when a user selects a trade anchor or changes it.
 * Also clears any cached session state from previous sessions.
 * 
 * @param userId - ID of the user creating the session
 * @param tradeAnchorId - ID of the trade anchor item
 * @returns The created swipe session
 */
export async function createSwipeSession(
  userId: string,
  tradeAnchorId: string
): Promise<SwipeSession> {
  if (!userId || !tradeAnchorId) {
    throw new Error('Invalid input: User ID and Trade Anchor ID are required');
  }

  return retryWithBackoff(async () => {
    // Verify trade anchor exists and is available
    const tradeAnchorRef = doc(db, 'items', tradeAnchorId);
    const tradeAnchorDoc = await getDoc(tradeAnchorRef);

    if (!tradeAnchorDoc.exists()) {
      throw new Error('Trade anchor item not found');
    }

    const tradeAnchorData = tradeAnchorDoc.data();
    if (tradeAnchorData.status !== 'available') {
      throw new Error('Trade anchor item is not available');
    }

    if (tradeAnchorData.ownerId !== userId) {
      throw new Error(`User does not own the trade anchor item. Item owner: ${tradeAnchorData.ownerId}, Current user: ${userId}`);
    }

    const newSessionRef = doc(collection(db, 'swipeSessions'));
    const newSession: Omit<SwipeSession, 'id'> = {
      userId,
      tradeAnchorId,
      createdAt: Timestamp.now(),
      lastActivityAt: Timestamp.now(),
      swipes: [],
    };
    
    await setDoc(newSessionRef, {
      ...newSession,
      createdAt: serverTimestamp(),
      lastActivityAt: serverTimestamp(),
    });
    
    const session = {
      ...newSession,
      id: newSessionRef.id,
    };

    // Cache the new session state
    try {
      // Validate session data before caching
      if (session.id && session.userId && session.createdAt && session.lastActivityAt) {
        cacheSessionState(session);
      } else {
        console.warn('New session data incomplete, skipping cache:', {
          hasId: !!session.id,
          hasUserId: !!session.userId,
          hasCreatedAt: !!session.createdAt,
          hasLastActivityAt: !!session.lastActivityAt
        });
      }
    } catch (cacheError) {
      console.error('Failed to cache new session state:', {
        sessionId: newSessionRef.id,
        userId,
        tradeAnchorId,
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error'
      });
    }
    
    return session;
  });
}

/**
 * Syncs all pending cached swipes to Firestore.
 * Should be called when connection is restored.
 * 
 * @returns Number of swipes successfully synced
 */
export async function syncPendingSwipes(): Promise<number> {
  const pendingSwipes = getPendingSwipes();
  if (pendingSwipes.length === 0) {
    return 0;
  }

  let syncedCount = 0;
  
  for (const cachedSwipe of pendingSwipes) {
    try {
      await retryWithBackoff(async () => {
        const sessionRef = doc(db, 'swipeSessions', cachedSwipe.sessionId);
        
        // Verify session still exists
        const sessionDoc = await getDoc(sessionRef);
        if (!sessionDoc.exists()) {
          console.warn(`Session ${cachedSwipe.sessionId} no longer exists, skipping sync`);
          return;
        }
        
        const sessionData = sessionDoc.data() as SwipeSession;
        if (sessionData.userId !== cachedSwipe.userId) {
          console.warn(`Session ${cachedSwipe.sessionId} does not belong to user, skipping sync`);
          return;
        }
        
        const swipeRecord: SwipeRecord = {
          itemId: cachedSwipe.itemId,
          direction: cachedSwipe.direction,
          timestamp: Timestamp.fromMillis(cachedSwipe.timestamp),
        };
        
        await updateDoc(sessionRef, {
          swipes: arrayUnion(swipeRecord),
          lastActivityAt: serverTimestamp(),
        });
      });

      // Remove from cache after successful sync
      removePendingSwipe(cachedSwipe);
      syncedCount++;
    } catch (error) {
      console.error('Failed to sync swipe:', error);
      // Keep in cache for next sync attempt
    }
  }

  return syncedCount;
}

/**
 * Restores a session from local cache if available.
 * Useful for persisting session state across page refreshes.
 * 
 * @param userId - ID of the user to verify ownership
 * @returns Cached session if available and valid, null otherwise
 */
export function restoreSessionFromCache(userId: string): SwipeSession | null {
  const cachedSession = getCachedSessionState();
  
  if (!cachedSession || cachedSession.userId !== userId) {
    return null;
  }

  return cachedSession;
}
