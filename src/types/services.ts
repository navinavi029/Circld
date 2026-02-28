import { Item } from './item';
import { UserProfile } from './user';
import {
  SwipeSession,
  SwipeRecord,
  TradeOffer,
  Message,
  ConversationSummary,
  Notification,
  SwipeFilterPreferences,
} from './swipe-trading';
import { DocumentSnapshot } from 'firebase/firestore';

/**
 * Service function return types and interfaces
 */

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  error?: string;
}

/**
 * Result of recording an action (swipe or message)
 */
export interface ActionResult {
  success: boolean;
  warning?: string;
}

/**
 * Result of sending a message
 */
export interface SendMessageResult {
  message: Message;
  warning?: string;
}

/**
 * Pagination state for item pool
 */
export interface PaginationState {
  loadedItems: Item[];
  currentIndex: number;
  lastDocument?: DocumentSnapshot;
  hasMore: boolean;
  isLoading: boolean;
  totalLoaded: number;
}

/**
 * Error classification result
 */
export interface ClassifiedError {
  type: 'network' | 'authentication' | 'permission' | 'validation' | 'unknown';
  message: string;
  userMessage: string;
  code?: string;
  originalError: Error;
  retryable: boolean;
}

/**
 * Item pool query parameters
 */
export interface ItemPoolQueryParams {
  currentUserId: string;
  swipeHistory: SwipeRecord[];
  limit?: number;
  lastDoc?: DocumentSnapshot;
  filters?: SwipeFilterPreferences;
  userCoordinates?: { latitude: number; longitude: number } | null;
}

/**
 * Batch profile fetch result
 */
export interface BatchProfileResult {
  profiles: Map<string, UserProfile>;
  cacheHitRate: number;
  fetchedCount: number;
}

/**
 * Sync result for pending swipes
 */
export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  errors: Error[];
}

/**
 * Conversation enrichment result
 */
export interface EnrichmentResult {
  summaries: ConversationSummary[];
  successCount: number;
  failedCount: number;
}

/**
 * Item details for messaging
 */
export interface ItemDetails {
  title: string;
  image: string;
}

/**
 * User details for messaging
 */
export interface UserDetails {
  name: string;
}

/**
 * Notification creation result
 */
export interface NotificationResult {
  notification: Notification;
  success: boolean;
  error?: string;
}

/**
 * Trade offer creation result
 */
export interface TradeOfferResult {
  tradeOffer: TradeOffer;
  isNew: boolean;
}

/**
 * Trade completion result
 */
export interface TradeCompletionResult {
  tradeOffer: TradeOffer;
  bothConfirmed: boolean;
  disabledConversations: number;
}

/**
 * Swipe session creation result
 */
export interface SwipeSessionResult {
  session: SwipeSession;
  cached: boolean;
}

/**
 * Message subscription options
 */
export interface MessageSubscriptionOptions {
  conversationId: string;
  userId: string;
  onMessage: (messages: Message[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Unsubscribe function type
 */
export type UnsubscribeFunction = () => void;

/**
 * Cache statistics
 */
export interface CacheStats {
  size: number;
  hitRate: number;
  missRate: number;
  evictions: number;
}

/**
 * Service health check result
 */
export interface ServiceHealthResult {
  healthy: boolean;
  latency: number;
  errors: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Message validation result
 */
export interface MessageValidationResult extends ValidationResult {
  sanitizedText?: string;
}

/**
 * Conversation status check result
 */
export interface ConversationStatusResult {
  active: boolean;
  status: 'active' | 'disabled';
  reason?: string;
  disabledAt?: Date;
}
