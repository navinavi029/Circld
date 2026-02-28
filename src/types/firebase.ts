import { Timestamp } from 'firebase/firestore';

/**
 * Firebase document type definitions
 * These interfaces represent the structure of documents stored in Firestore collections
 */

/**
 * Rate limit tracking document
 * Collection: rateLimits
 */
export interface RateLimitDocument {
  userId: string;
  actionType: 'swipe' | 'message';
  count: number;
  windowStart: Timestamp;
  lastAction: Timestamp;
}

/**
 * Error log document
 * Collection: errorLogs
 */
export interface ErrorLogDocument {
  userId: string | null;
  errorType: 'network' | 'authentication' | 'permission' | 'validation' | 'unknown';
  errorMessage: string;
  errorCode?: string;
  stackTrace?: string;
  timestamp: Timestamp;
  context?: Record<string, unknown>;
}

/**
 * Session document for tracking user sessions
 * Collection: sessions
 */
export interface SessionDocument {
  userId: string;
  deviceId: string;
  startTime: Timestamp;
  lastActivity: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Analytics event document
 * Collection: analyticsEvents
 */
export interface AnalyticsEventDocument {
  userId: string | null;
  eventType: string;
  eventData: Record<string, unknown>;
  timestamp: Timestamp;
  sessionId?: string;
}

/**
 * Type guard to check if a value is a Timestamp
 */
export function isTimestamp(value: unknown): value is Timestamp {
  return (
    value !== null &&
    typeof value === 'object' &&
    'seconds' in value &&
    'nanoseconds' in value &&
    typeof (value as Timestamp).toDate === 'function'
  );
}

/**
 * Type guard to check if a value is a valid status
 */
export function isValidItemStatus(
  status: unknown
): status is 'available' | 'pending' | 'unavailable' {
  return (
    status === 'available' || status === 'pending' || status === 'unavailable'
  );
}

/**
 * Type guard to check if a value is a valid trade offer status
 */
export function isValidTradeOfferStatus(
  status: unknown
): status is 'pending' | 'read' | 'accepted' | 'declined' | 'completed' {
  return (
    status === 'pending' ||
    status === 'read' ||
    status === 'accepted' ||
    status === 'declined' ||
    status === 'completed'
  );
}

/**
 * Type guard to check if a value is a valid conversation status
 */
export function isValidConversationStatus(
  status: unknown
): status is 'active' | 'disabled' {
  return status === 'active' || status === 'disabled';
}

/**
 * Type guard to check if a value is a valid swipe direction
 */
export function isValidSwipeDirection(
  direction: unknown
): direction is 'left' | 'right' {
  return direction === 'left' || direction === 'right';
}

/**
 * Type guard to check if a value is a valid notification type
 */
export function isValidNotificationType(
  type: unknown
): type is 'trade_offer' | 'message' | 'system' {
  return type === 'trade_offer' || type === 'message' || type === 'system';
}

/**
 * Type guard to check if a value is a valid item condition
 */
export function isValidItemCondition(
  condition: unknown
): condition is 'new' | 'like-new' | 'good' | 'fair' | 'poor' {
  return (
    condition === 'new' ||
    condition === 'like-new' ||
    condition === 'good' ||
    condition === 'fair' ||
    condition === 'poor'
  );
}

/**
 * Helper type for Firestore document data with server timestamps
 * Use this when creating documents that will use serverTimestamp()
 */
export type WithServerTimestamp<T> = Omit<T, 'createdAt' | 'updatedAt'> & {
  createdAt: ReturnType<typeof import('firebase/firestore').serverTimestamp>;
  updatedAt?: ReturnType<typeof import('firebase/firestore').serverTimestamp>;
};

/**
 * Helper type for partial updates to Firestore documents
 */
export type PartialUpdate<T> = Partial<T> & {
  updatedAt?: ReturnType<typeof import('firebase/firestore').serverTimestamp>;
};
