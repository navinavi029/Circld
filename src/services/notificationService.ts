import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Notification, TradeOffer, TradeOfferNotificationData, MessageNotificationData } from '../types/swipe-trading';
import { retryWithBackoff } from '../utils/retryWithBackoff';

/**
 * Creates a notification for a trade offer.
 * 
 * @param tradeOffer - The trade offer to create a notification for
 * @param tradeAnchorTitle - Title of the trade anchor item
 * @param tradeAnchorImage - Primary image URL of the trade anchor item
 * @param targetItemTitle - Title of the target item
 * @param targetItemImage - Primary image URL of the target item
 * @param offeringUserName - Name of the user making the offer
 * @returns The created notification
 */
export async function createTradeOfferNotification(
  tradeOffer: TradeOffer,
  tradeAnchorTitle: string,
  tradeAnchorImage: string,
  targetItemTitle: string,
  targetItemImage: string,
  offeringUserName: string
): Promise<Notification> {
  // Validate inputs
  if (!tradeOffer || !tradeOffer.id) {
    throw new Error('Invalid input: Trade offer is required');
  }

  if (!tradeAnchorTitle || !targetItemTitle || !offeringUserName) {
    throw new Error('Invalid input: Item titles and user name are required');
  }

  return retryWithBackoff(async () => {
    const notificationData: TradeOfferNotificationData = {
      offeringUserId: tradeOffer.offeringUserId,
      offeringUserName,
      tradeAnchorId: tradeOffer.tradeAnchorId,
      tradeAnchorTitle,
      tradeAnchorImage: tradeAnchorImage || '',
      targetItemId: tradeOffer.targetItemId,
      targetItemTitle,
      targetItemImage: targetItemImage || '',
    };

    const newNotificationRef = doc(collection(db, 'notifications'));
    const newNotification: Omit<Notification, 'id'> = {
      userId: tradeOffer.targetItemOwnerId,
      type: 'trade_offer',
      tradeOfferId: tradeOffer.id,
      read: false,
      createdAt: Timestamp.now(),
      data: notificationData,
    };

    await setDoc(newNotificationRef, {
      ...newNotification,
      createdAt: serverTimestamp(),
    });

    return {
      ...newNotification,
      id: newNotificationRef.id,
    };
  });
}

/**
 * Creates a notification for a new message in a conversation.
 * 
 * @param conversationId - ID of the conversation
 * @param senderId - ID of the user who sent the message
 * @param senderName - Name of the user who sent the message
 * @param messageText - Full text of the message
 * @param recipientId - ID of the user who should receive the notification
 * @param tradeAnchorTitle - Title of the trade anchor item
 * @param targetItemTitle - Title of the target item
 * @returns The created notification
 */
export async function createMessageNotification(
  conversationId: string,
  senderId: string,
  senderName: string,
  messageText: string,
  recipientId: string,
  tradeAnchorTitle: string,
  targetItemTitle: string
): Promise<Notification> {
  // Validate inputs
  if (!conversationId || !senderId || !recipientId) {
    throw new Error('Invalid input: conversationId, senderId, and recipientId are required');
  }

  if (!senderName || !messageText || !tradeAnchorTitle || !targetItemTitle) {
    throw new Error('Invalid input: senderName, messageText, and item titles are required');
  }

  return retryWithBackoff(async () => {
    // Create message preview (first 50 characters)
    const messagePreview = messageText.length > 50 
      ? messageText.substring(0, 50) + '...' 
      : messageText;

    const notificationData: MessageNotificationData = {
      conversationId,
      senderId,
      senderName,
      messagePreview,
      tradeAnchorTitle,
      targetItemTitle,
    };

    const newNotificationRef = doc(collection(db, 'notifications'));
    const newNotification: Omit<Notification, 'id'> = {
      userId: recipientId,
      type: 'message',
      read: false,
      createdAt: Timestamp.now(),
      data: notificationData,
    };

    await setDoc(newNotificationRef, {
      ...newNotification,
      createdAt: serverTimestamp(),
    });

    return {
      ...newNotification,
      id: newNotificationRef.id,
    };
  });
}

/**
 * Retrieves all notifications for a specific user, ordered by creation date (newest first).
 * 
 * @param userId - ID of the user to get notifications for
 * @returns Array of notifications for the user
 */
export async function getUserNotifications(userId: string): Promise<Notification[]> {
  if (!userId) {
    throw new Error('Invalid input: User ID is required');
  }

  return retryWithBackoff(async () => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Notification));
  });
}

/**
 * Marks a notification as read.
 * 
 * @param notificationId - ID of the notification to mark as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  if (!notificationId) {
    throw new Error('Invalid input: Notification ID is required');
  }

  return retryWithBackoff(async () => {
    const notificationRef = doc(db, 'notifications', notificationId);
    
    // Verify notification exists before updating
    const notificationDoc = await getDoc(notificationRef);
    if (!notificationDoc.exists()) {
      throw new Error('Notification not found');
    }

    await updateDoc(notificationRef, {
      read: true,
    });
  });
}
