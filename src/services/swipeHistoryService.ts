import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
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
import { checkRateLimit, recordAction } from '../utils/rateLimiter';
import { createLogger } from '../utils/logger';

// Create logger instance for this service
const logger = createLogger('swipeHistoryService');

/**
 * Records a swipe action in the current session.
 * If offline, caches the swipe locally for later sync.
 * If the session doesn't exist, this will fail - sessions should be created first.
 * 
 * @param sessionId - ID of the swipe session
 * @param userId - ID of the user performing the swipe
 * @param itemId - ID of the item being swiped on
 * @param direction - Direction of the swipe ('left' or 'right')
 * @returns Object with success status and optional warning message
 * @throws Error if rate limit is exceeded or validation fails
 */
export async function recordSwipe(
  sessionId: string,
  userId: string,
  itemId: string,
  direction: 'left' | 'right'
): Promise<{ success: boolean; warning?: string }> {
  // Validate inputs
  if (!sessionId || !userId || !itemId || !direction) {
    throw new Error('Invalid input: All parameters are required');
  }

  if (direction !== 'left' && direction !== 'right') {
    throw new Error('Invalid direction: Must be "left" or "right"');
  }

  // Check rate limit before recording swipe
  const rateLimitResult = await checkRateLimit(userId, 'swipe');
  
  if (!rateLimitResult.allowed) {
    throw new Error(rateLimitResult.error || "You've reached the hourly swipe limit. Take a break and come back soon!");
  }

  // Prepare warning message if within 10 actions of limit
  let warningMessage: string | undefined;
  if (rateLimitResult.remaining <= 10 && rateLimitResult.remaining > 0) {
    warningMessage = `You have ${rateLimitResult.remaining} swipe${rateLimitResult.remaining !== 1 ? 's' : ''} remaining this hour`;
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

      // Record the action for rate limiting after successful swipe
      await recordAction(userId, 'swipe');

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
          logger.warn('Session data incomplete, skipping cache', {
            hasId: (!!updatedSession.id).toString(),
            hasUserId: (!!updatedSession.userId).toString(),
            hasCreatedAt: (!!updatedSession.createdAt).toString(),
            hasLastActivityAt: (!!updatedSession.lastActivityAt).toString(),
          });
        }
      } catch (cacheError) {
        logger.error('Failed to cache session state after swipe', {
          sessionId,
          userId,
          itemId,
          error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
        });
      }
    });

    return { success: true, warning: warningMessage };
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
            logger.warn('Cached session data incomplete, skipping update', {
              hasUserId: (!!cachedSession.userId).toString(),
              hasCreatedAt: (!!cachedSession.createdAt).toString(),
              hasLastActivityAt: (!!cachedSession.lastActivityAt).toString(),
            });
          }
        }
      } catch (cacheError) {
        logger.error('Failed to update cached session state optimistically', {
          sessionId,
          userId,
          itemId,
          error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
        });
      }

      return { success: true, warning: warningMessage };
    } else {
      throw error;
    }
  }
}

/**
 * Removes a swipe record from the session.
 * Used for undo functionality to restore a swiped item.
 * 
 * @param sessionId - ID of the swipe session
 * @param userId - ID of the user performing the undo
 * @param itemId - ID of the item to remove from swipe history
 * @throws Error if validation fails or swipe not found
 */
export async function removeSwipe(
  sessionId: string,
  userId: string,
  itemId: string
): Promise<void> {
  // Validate inputs
  if (!sessionId || !userId || !itemId) {
    throw new Error('Invalid input: All parameters are required');
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
    
    // Find the swipe record to remove
    const swipeToRemove = sessionData.swipes.find(
      (swipe) => swipe.itemId === itemId
    );
    
    if (!swipeToRemove) {
      throw new Error('Swipe record not found for this item');
    }
    
    // Remove the swipe using arrayRemove
    await updateDoc(sessionRef, {
      swipes: arrayRemove(swipeToRemove),
      lastActivityAt: serverTimestamp(),
    });

    // Update cached session state after successful removal
    try {
      const cachedSession = getCachedSessionState();
      if (cachedSession && cachedSession.id === sessionId) {
        cachedSession.swipes = cachedSession.swipes.filter(
          (swipe) => swipe.itemId !== itemId
        );
        
        // Validate session data before caching
        if (cachedSession.userId && cachedSession.createdAt && cachedSession.lastActivityAt) {
          cacheSessionState(cachedSession);
        } else {
          logger.warn('Cached session data incomplete after swipe removal', {
            hasUserId: (!!cachedSession.userId).toString(),
            hasCreatedAt: (!!cachedSession.createdAt).toString(),
            hasLastActivityAt: (!!cachedSession.lastActivityAt).toString(),
          });
        }
      }
    } catch (cacheError) {
      logger.error('Failed to update cached session state after swipe removal', {
        sessionId,
        userId,
        itemId,
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
      });
    }

    logger.info('Swipe removed successfully', {
      sessionId,
      userId,
      itemId,
    });
  });
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
          logger.warn('Session data incomplete, skipping cache', {
            hasId: (!!sessionData.id).toString(),
            hasUserId: (!!sessionData.userId).toString(),
            hasCreatedAt: (!!sessionData.createdAt).toString(),
            hasLastActivityAt: (!!sessionData.lastActivityAt).toString(),
          });
        }
      } catch (cacheError) {
        logger.error('Failed to cache session state after fetching history', {
          sessionId,
          userId,
          error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
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
        logger.warn('New session data incomplete, skipping cache', {
          hasId: (!!session.id).toString(),
          hasUserId: (!!session.userId).toString(),
          hasCreatedAt: (!!session.createdAt).toString(),
          hasLastActivityAt: (!!session.lastActivityAt).toString(),
        });
      }
    } catch (cacheError) {
      logger.error('Failed to cache new session state', {
        sessionId: newSessionRef.id,
        userId,
        tradeAnchorId,
        error: cacheError instanceof Error ? cacheError.message : 'Unknown error',
      });
    }
    
    logger.info('Created new swipe session', {
      sessionId: newSessionRef.id,
      userId,
      tradeAnchorId,
    });
    
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

  logger.info('Syncing pending swipes', { count: pendingSwipes.length.toString() });

  let syncedCount = 0;
  
  for (const cachedSwipe of pendingSwipes) {
    try {
      await retryWithBackoff(async () => {
        const sessionRef = doc(db, 'swipeSessions', cachedSwipe.sessionId);
        
        // Verify session still exists
        const sessionDoc = await getDoc(sessionRef);
        if (!sessionDoc.exists()) {
          logger.warn('Session no longer exists, skipping sync', { sessionId: cachedSwipe.sessionId });
          return;
        }
        
        const sessionData = sessionDoc.data() as SwipeSession;
        if (sessionData.userId !== cachedSwipe.userId) {
          logger.warn('Session does not belong to user, skipping sync', { sessionId: cachedSwipe.sessionId });
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
      logger.error('Failed to sync swipe', {
        sessionId: cachedSwipe.sessionId,
        itemId: cachedSwipe.itemId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Keep in cache for next sync attempt
    }
  }

  logger.info('Pending swipes sync complete', {
    syncedCount: syncedCount.toString(),
    totalPending: pendingSwipes.length.toString(),
  });

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
