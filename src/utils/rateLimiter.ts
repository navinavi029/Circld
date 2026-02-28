import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Action types that can be rate limited
 */
export type RateLimitAction = 'swipe' | 'message';

/**
 * Configuration for rate limits per action type
 */
export interface RateLimitConfig {
  maxActions: number;
  windowMs: number; // Time window in milliseconds
}

/**
 * Rate limit configurations
 */
const RATE_LIMITS: Record<RateLimitAction, RateLimitConfig> = {
  swipe: {
    maxActions: 100,
    windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
  },
  message: {
    maxActions: 50,
    windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
  },
};

/**
 * Action record with timestamp
 */
interface ActionRecord {
  timestamp: Timestamp;
}

/**
 * Rate limit data stored in Firestore
 */
interface RateLimitData {
  userId: string;
  swipes: ActionRecord[];
  messages: ActionRecord[];
  lastUpdated: Timestamp;
}

/**
 * Result of rate limit check
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  error?: string;
}

/**
 * Gets the rate limit document reference for a user
 */
function getRateLimitDocRef(userId: string) {
  return doc(db, 'rateLimits', userId);
}

/**
 * Removes actions outside the rolling window
 */
function filterActionsInWindow(
  actions: ActionRecord[],
  windowMs: number,
  now: Date
): ActionRecord[] {
  const windowStart = now.getTime() - windowMs;
  return actions.filter((action) => {
    const actionTime = action.timestamp.toMillis();
    return actionTime > windowStart;
  });
}

/**
 * Calculates when the rate limit will reset (when the oldest action expires)
 */
function calculateResetTime(
  actions: ActionRecord[],
  windowMs: number
): Date {
  if (actions.length === 0) {
    return new Date();
  }
  
  // Find the oldest action
  const oldestAction = actions.reduce((oldest, current) => {
    return current.timestamp.toMillis() < oldest.timestamp.toMillis() ? current : oldest;
  });
  
  // Reset time is when the oldest action expires from the window
  return new Date(oldestAction.timestamp.toMillis() + windowMs);
}

/**
 * Checks if a user can perform an action based on rate limits
 * 
 * @param userId - ID of the user
 * @param action - Type of action to check
 * @returns Rate limit result indicating if action is allowed
 */
export async function checkRateLimit(
  userId: string,
  action: RateLimitAction
): Promise<RateLimitResult> {
  try {
    if (!userId) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(),
        error: 'User ID is required',
      };
    }

    const config = RATE_LIMITS[action];
    const now = new Date();
    const docRef = getRateLimitDocRef(userId);
    const docSnap = await getDoc(docRef);

    let rateLimitData: RateLimitData;

    if (!docSnap.exists()) {
      // Initialize rate limit data for new user
      rateLimitData = {
        userId,
        swipes: [],
        messages: [],
        lastUpdated: Timestamp.now(),
      };
    } else {
      rateLimitData = docSnap.data() as RateLimitData;
    }

    // Get actions for this action type
    const actionKey = action === 'swipe' ? 'swipes' : 'messages';
    const actions = rateLimitData[actionKey] || [];

    // Filter to only actions within the rolling window
    const actionsInWindow = filterActionsInWindow(actions, config.windowMs, now);

    // Calculate remaining actions
    const remaining = Math.max(0, config.maxActions - actionsInWindow.length);

    // Calculate reset time
    const resetAt = calculateResetTime(actionsInWindow, config.windowMs);

    // Check if limit is exceeded
    if (actionsInWindow.length >= config.maxActions) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        error: action === 'swipe'
          ? "You've reached the hourly swipe limit. Take a break and come back soon!"
          : "You've reached the hourly message limit. Please wait before sending more messages.",
      };
    }

    // Check if user is within 10 actions of limit (warning threshold)
    const warningThreshold = 10;
    if (remaining <= warningThreshold && remaining > 0) {
      // Note: Warning will be handled by the calling code
      // This is just for information in the result
    }

    return {
      allowed: true,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error(`Error checking rate limit for ${action}:`, error);
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(),
      error: 'Unable to check rate limit. Please try again.',
    };
  }
}

/**
 * Records an action for rate limiting
 * 
 * @param userId - ID of the user
 * @param action - Type of action to record
 * @returns Success status
 */
export async function recordAction(
  userId: string,
  action: RateLimitAction
): Promise<boolean> {
  try {
    if (!userId) {
      console.error('User ID is required to record action');
      return false;
    }

    const config = RATE_LIMITS[action];
    const now = new Date();
    const docRef = getRateLimitDocRef(userId);
    const docSnap = await getDoc(docRef);

    const newAction: ActionRecord = {
      timestamp: Timestamp.now(),
    };

    if (!docSnap.exists()) {
      // Create new document
      const rateLimitData: RateLimitData = {
        userId,
        swipes: action === 'swipe' ? [newAction] : [],
        messages: action === 'message' ? [newAction] : [],
        lastUpdated: Timestamp.now(),
      };
      await setDoc(docRef, rateLimitData);
    } else {
      // Update existing document
      const rateLimitData = docSnap.data() as RateLimitData;
      const actionKey = action === 'swipe' ? 'swipes' : 'messages';
      const actions = rateLimitData[actionKey] || [];

      // Filter to only actions within the rolling window and add new action
      const actionsInWindow = filterActionsInWindow(actions, config.windowMs, now);
      actionsInWindow.push(newAction);

      // Update document
      await updateDoc(docRef, {
        [actionKey]: actionsInWindow,
        lastUpdated: Timestamp.now(),
      });
    }

    return true;
  } catch (error) {
    console.error(`Error recording ${action} action:`, error);
    return false;
  }
}

/**
 * Gets the current rate limit status for a user
 * 
 * @param userId - ID of the user
 * @param action - Type of action to check
 * @returns Current rate limit status
 */
export async function getRateLimitStatus(
  userId: string,
  action: RateLimitAction
): Promise<RateLimitResult> {
  return checkRateLimit(userId, action);
}

/**
 * Resets rate limit data for a user (admin function)
 * 
 * @param userId - ID of the user
 * @param action - Optional specific action to reset, or all if not specified
 */
export async function resetRateLimit(
  userId: string,
  action?: RateLimitAction
): Promise<boolean> {
  try {
    if (!userId) {
      console.error('User ID is required to reset rate limit');
      return false;
    }

    const docRef = getRateLimitDocRef(userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Nothing to reset
      return true;
    }

    if (action) {
      // Reset specific action
      const actionKey = action === 'swipe' ? 'swipes' : 'messages';
      await updateDoc(docRef, {
        [actionKey]: [],
        lastUpdated: Timestamp.now(),
      });
    } else {
      // Reset all actions
      await updateDoc(docRef, {
        swipes: [],
        messages: [],
        lastUpdated: Timestamp.now(),
      });
    }

    return true;
  } catch (error) {
    console.error('Error resetting rate limit:', error);
    return false;
  }
}
