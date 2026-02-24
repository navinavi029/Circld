import { Timestamp } from 'firebase/firestore';

/**
 * Represents a single swipe action within a session
 */
export interface SwipeRecord {
  itemId: string;
  direction: 'left' | 'right';
  timestamp: Timestamp;
}

/**
 * Represents a swipe session where a user is browsing items with a trade anchor
 */
export interface SwipeSession {
  id: string;
  userId: string;
  tradeAnchorId: string;
  createdAt: Timestamp;
  lastActivityAt: Timestamp;
  swipes: SwipeRecord[];
}

/**
 * Represents a trade offer created when a user swipes right on an item
 */
export interface TradeOffer {
  id: string;
  tradeAnchorId: string;
  tradeAnchorOwnerId: string;
  targetItemId: string;
  targetItemOwnerId: string;
  offeringUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'pending' | 'read' | 'accepted' | 'declined' | 'completed';
  completedBy?: string[]; // Array of user IDs who have confirmed completion
}

/**
 * Data structure for trade offer notifications
 */
export interface TradeOfferNotificationData {
  offeringUserId: string;
  offeringUserName: string;
  tradeAnchorId: string;
  tradeAnchorTitle: string;
  tradeAnchorImage: string;
  targetItemId: string;
  targetItemTitle: string;
  targetItemImage: string;
}

/**
 * Generic notification structure supporting multiple notification types
 */
export interface Notification {
  id: string;
  userId: string;
  type: 'trade_offer' | 'message' | 'system';
  tradeOfferId?: string;
  read: boolean;
  createdAt: Timestamp;
  data: TradeOfferNotificationData | MessageNotificationData | Record<string, unknown>;
}

/**
 * Query parameters for building the item pool
 */
export interface ItemPoolQuery {
  excludeOwnerIds: string[];
  excludeItemIds: string[];
  status: 'available';
  limit: number;
  offset: number;
}

/**
 * Service interface for managing trade offers
 */
export interface TradeOfferService {
  createTradeOffer(
    tradeAnchorId: string,
    targetItemId: string,
    offeringUserId: string
  ): Promise<TradeOffer>;
  
  getTradeOffersForUser(userId: string): Promise<TradeOffer[]>;
  
  markOfferAsRead(offerId: string): Promise<void>;
}

/**
 * Service interface for managing swipe history
 */
export interface SwipeHistoryService {
  recordSwipe(
    sessionId: string,
    userId: string,
    itemId: string,
    direction: 'left' | 'right'
  ): Promise<void>;
  
  getSwipeHistory(sessionId: string, userId: string): Promise<SwipeRecord[]>;
  
  clearHistory(sessionId: string, userId: string): Promise<void>;
}

/**
 * Service interface for managing notifications
 */
export interface NotificationService {
  createTradeOfferNotification(
    tradeOffer: TradeOffer,
    tradeAnchorTitle: string,
    tradeAnchorImage: string,
    targetItemTitle: string,
    targetItemImage: string,
    offeringUserName: string
  ): Promise<Notification>;
  
  getUserNotifications(userId: string): Promise<Notification[]>;
  
  markAsRead(notificationId: string): Promise<void>;
}

/**
 * Represents a conversation between two users for an accepted trade
 */
export interface Conversation {
  id: string;
  tradeOfferId: string;
  participantIds: [string, string]; // [offeringUserId, targetItemOwnerId]
  tradeAnchorId: string;
  targetItemId: string;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  lastMessageText: string;
  unreadCount: {
    [userId: string]: number;
  };
}

/**
 * Represents a single message within a conversation
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
  readBy: string[]; // Array of user IDs who have read the message
}

/**
 * Enriched conversation data for displaying in conversation lists
 */
export interface ConversationSummary {
  conversation: Conversation;
  tradeAnchorTitle: string;
  tradeAnchorImage: string;
  targetItemTitle: string;
  targetItemImage: string;
  partnerName: string;
  partnerId: string;
  unreadCount: number;
}

/**
 * Data structure for message notifications
 */
export interface MessageNotificationData {
  conversationId: string;
  senderId: string;
  senderName: string;
  messagePreview: string; // First 50 chars of message
  tradeAnchorTitle: string;
  targetItemTitle: string;
}

/**
 * Filter preferences for swipe trading
 */
export interface SwipeFilterPreferences {
  maxDistance: number | null; // in kilometers, null = no limit
  categories: string[];
  conditions: string[]; // item conditions: new, like-new, good, fair, poor
}
