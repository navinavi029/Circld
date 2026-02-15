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
  status: 'pending' | 'read' | 'accepted' | 'declined';
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
  data: TradeOfferNotificationData | Record<string, unknown>;
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
