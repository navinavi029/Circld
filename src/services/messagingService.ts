import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Conversation, Message, ConversationSummary } from '../types/swipe-trading';
import { retryWithBackoff } from '../utils/retryWithBackoff';
import { createMessageNotification } from './notificationService';
import { calculateTotalUnreadCount } from '../utils/messagingUtils';

// Cache for item and user details to minimize Firestore reads
interface ItemDetails {
  title: string;
  image: string;
}

interface UserDetails {
  name: string;
}

const itemCache = new Map<string, ItemDetails>();
const userCache = new Map<string, UserDetails>();

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;
const cacheTimestamps = new Map<string, number>();

/**
 * Clears expired cache entries
 */
function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > CACHE_EXPIRATION_MS) {
      itemCache.delete(key);
      userCache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
}

/**
 * Clears all cache entries (for testing purposes)
 */
export function clearCache(): void {
  itemCache.clear();
  userCache.clear();
  cacheTimestamps.clear();
}

/**
 * Fetches item details from Firestore with caching
 */
async function getItemDetails(itemId: string): Promise<ItemDetails> {
  clearExpiredCache();
  
  // Check cache first
  if (itemCache.has(itemId)) {
    return itemCache.get(itemId)!;
  }

  // Fetch from Firestore
  const itemDoc = await getDoc(doc(db, 'items', itemId));
  const details: ItemDetails = {
    title: itemDoc.exists() ? itemDoc.data().title || 'Unknown Item' : 'Unknown Item',
    image: itemDoc.exists() ? itemDoc.data().images?.[0] || '' : '',
  };

  // Cache the result
  itemCache.set(itemId, details);
  cacheTimestamps.set(itemId, Date.now());

  return details;
}

/**
 * Fetches user details from Firestore with caching
 */
async function getUserDetails(userId: string): Promise<UserDetails> {
  clearExpiredCache();
  
  // Check cache first
  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }

  // Fetch from Firestore
  const userDoc = await getDoc(doc(db, 'users', userId));
  const details: UserDetails = {
    name: userDoc.exists() ? userDoc.data().name || 'Unknown User' : 'Unknown User',
  };

  // Cache the result
  userCache.set(userId, details);
  cacheTimestamps.set(userId, Date.now());

  return details;
}

/**
 * Creates a conversation for an accepted trade offer with idempotency check.
 * If a conversation already exists for the trade offer, returns the existing conversation.
 * 
 * @param tradeOfferId - ID of the accepted trade offer
 * @returns The created or existing conversation
 * @throws Error if trade offer not found or not accepted
 */
export async function createConversation(tradeOfferId: string): Promise<Conversation> {
  if (!tradeOfferId) {
    throw new Error('Invalid input: Trade offer ID is required');
  }

  return retryWithBackoff(async () => {
    // Check for existing conversation (idempotency)
    const existingConversation = await getConversationByTradeOffer(tradeOfferId);
    if (existingConversation) {
      return existingConversation;
    }

    // Fetch trade offer to validate it exists and is accepted
    const tradeOfferDoc = await getDoc(doc(db, 'tradeOffers', tradeOfferId));
    
    if (!tradeOfferDoc.exists()) {
      throw new Error('Trade offer not found');
    }

    const tradeOffer = tradeOfferDoc.data();

    // Validate trade offer is accepted
    if (tradeOffer.status !== 'accepted') {
      throw new Error('Conversation can only be created for accepted trades');
    }

    // Create new conversation
    const newConversationRef = doc(collection(db, 'conversations'));
    const now = Timestamp.now();
    
    const newConversation: Omit<Conversation, 'id'> = {
      tradeOfferId,
      participantIds: [tradeOffer.offeringUserId, tradeOffer.targetItemOwnerId],
      tradeAnchorId: tradeOffer.tradeAnchorId,
      targetItemId: tradeOffer.targetItemId,
      createdAt: now,
      lastMessageAt: now,
      lastMessageText: '',
      unreadCount: {},
    };
    
    await setDoc(newConversationRef, {
      ...newConversation,
      createdAt: serverTimestamp(),
      lastMessageAt: serverTimestamp(),
    });
    
    return {
      ...newConversation,
      id: newConversationRef.id,
    };
  });
}

/**
 * Retrieves a conversation by trade offer ID.
 * 
 * @param tradeOfferId - ID of the trade offer
 * @returns The conversation if found, null otherwise
 */
export async function getConversationByTradeOffer(
  tradeOfferId: string
): Promise<Conversation | null> {
  if (!tradeOfferId) {
    throw new Error('Invalid input: Trade offer ID is required');
  }

  return retryWithBackoff(async () => {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('tradeOfferId', '==', tradeOfferId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const conversationDoc = querySnapshot.docs[0];
    return {
      id: conversationDoc.id,
      ...conversationDoc.data(),
    } as Conversation;
  });
}

/**
 * Retrieves all conversations for a user, sorted by most recent message.
 * 
 * @param userId - ID of the user
 * @returns Array of conversations where the user is a participant, sorted by lastMessageAt (newest first)
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  if (!userId) {
    throw new Error('Invalid input: User ID is required');
  }

  return retryWithBackoff(async () => {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participantIds', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Conversation));
  });
}

/**
 * Sanitizes HTML and script tags from message text while preserving URLs and line breaks.
 * 
 * @param text - The message text to sanitize
 * @returns Sanitized text
 */
function sanitizeMessageText(text: string): string {
  // Remove HTML tags and script content
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
}

/**
 * Validates message text input.
 * 
 * @param text - The message text to validate
 * @throws Error if validation fails
 */
function validateMessageText(text: string): void {
  // Check for empty or whitespace-only messages
  if (!text || text.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }

  // Check message length
  if (text.length > 2000) {
    throw new Error('Message exceeds maximum length');
  }
}

/**
 * Sends a message in a conversation with validation and access control.
 * 
 * @param conversationId - ID of the conversation
 * @param senderId - ID of the user sending the message
 * @param text - The message text content
 * @returns The created message
 * @throws Error if validation fails or user is not authorized
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<Message> {
  if (!conversationId || !senderId) {
    throw new Error('Missing required field: conversationId and senderId are required');
  }

  // Validate message text
  validateMessageText(text);

  return retryWithBackoff(async () => {
    // Fetch conversation to validate access
    const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
    
    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const conversation = conversationDoc.data() as Conversation;

    // Validate sender is a participant
    if (!conversation.participantIds.includes(senderId)) {
      throw new Error('User is not authorized to send messages in this conversation');
    }

    // Sanitize message text
    const sanitizedText = sanitizeMessageText(text);

    // Create new message
    const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
    const now = Timestamp.now();
    
    const newMessage: Omit<Message, 'id'> = {
      conversationId,
      senderId,
      text: sanitizedText,
      createdAt: now,
      readBy: [senderId], // Sender has read their own message
    };
    
    await setDoc(messageRef, {
      ...newMessage,
      createdAt: serverTimestamp(),
    });

    // Update conversation's lastMessageAt and lastMessageText
    const recipientId = conversation.participantIds.find(id => id !== senderId);
    const updatedUnreadCount = {
      ...conversation.unreadCount,
      [recipientId!]: (conversation.unreadCount[recipientId!] || 0) + 1,
    };

    await setDoc(
      doc(db, 'conversations', conversationId),
      {
        lastMessageAt: serverTimestamp(),
        lastMessageText: sanitizedText.substring(0, 100), // Store preview
        unreadCount: updatedUnreadCount,
      },
      { merge: true }
    );

    // Create notification for recipient (handle errors gracefully)
    try {
      // Fetch sender name
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      const senderName = senderDoc.exists() ? senderDoc.data().name || 'Unknown User' : 'Unknown User';

      // Fetch trade anchor item details
      const tradeAnchorDoc = await getDoc(doc(db, 'items', conversation.tradeAnchorId));
      const tradeAnchorTitle = tradeAnchorDoc.exists() ? tradeAnchorDoc.data().title || 'Item' : 'Item';

      // Fetch target item details
      const targetItemDoc = await getDoc(doc(db, 'items', conversation.targetItemId));
      const targetItemTitle = targetItemDoc.exists() ? targetItemDoc.data().title || 'Item' : 'Item';

      // Create notification for recipient
      await createMessageNotification(
        conversationId,
        senderId,
        senderName,
        sanitizedText,
        recipientId!,
        tradeAnchorTitle,
        targetItemTitle
      );
    } catch (notificationError) {
      // Log error but don't fail message send
      console.error('Failed to create message notification:', notificationError);
    }
    
    return {
      ...newMessage,
      id: messageRef.id,
    };
  });
}

/**
 * Retrieves all messages for a conversation with access control.
 * Messages are returned in chronological order (oldest first).
 * 
 * @param conversationId - ID of the conversation
 * @param userId - ID of the user requesting messages
 * @returns Array of messages ordered by timestamp (ascending)
 * @throws Error if user is not authorized
 */
export async function getMessages(
  conversationId: string,
  userId: string
): Promise<Message[]> {
  if (!conversationId || !userId) {
    throw new Error('Missing required field: conversationId and userId are required');
  }

  return retryWithBackoff(async () => {
    // Fetch conversation to validate access
    const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
    
    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const conversation = conversationDoc.data() as Conversation;

    // Validate user is a participant
    if (!conversation.participantIds.includes(userId)) {
      throw new Error('User is not authorized to access this conversation');
    }

    // Fetch messages ordered by timestamp
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Message));
  });
}

/**
 * Marks all messages in a conversation as read by the specified user.
 * 
 * @param conversationId - ID of the conversation
 * @param userId - ID of the user marking messages as read
 * @throws Error if user is not authorized
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  if (!conversationId || !userId) {
    throw new Error('Missing required field: conversationId and userId are required');
  }

  return retryWithBackoff(async () => {
    // Fetch conversation to validate access
    const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
    
    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const conversation = conversationDoc.data() as Conversation;

    // Validate user is a participant
    if (!conversation.participantIds.includes(userId)) {
      throw new Error('User is not authorized to access this conversation');
    }

    // Fetch all messages
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const querySnapshot = await getDocs(messagesRef);
    
    // Update each message to include userId in readBy array if not already present
    const updatePromises = querySnapshot.docs.map(async (messageDoc) => {
      const message = messageDoc.data() as Message;
      if (!message.readBy.includes(userId)) {
        await setDoc(
          doc(db, 'conversations', conversationId, 'messages', messageDoc.id),
          {
            readBy: [...message.readBy, userId],
          },
          { merge: true }
        );
      }
    });

    await Promise.all(updatePromises);

    // Reset unread count for this user in the conversation
    await setDoc(
      doc(db, 'conversations', conversationId),
      {
        unreadCount: {
          ...conversation.unreadCount,
          [userId]: 0,
        },
      },
      { merge: true }
    );
  });
}

/**
 * Subscribes to real-time message updates for a conversation.
 * Validates access control before establishing the listener.
 * Includes automatic reconnection logic on errors.
 * 
 * @param conversationId - ID of the conversation
 * @param userId - ID of the user subscribing to messages
 * @param callback - Function called with updated messages array when changes occur
 * @returns Unsubscribe function to clean up the listener
 * @throws Error if user is not authorized
 */
export function subscribeToMessages(
  conversationId: string,
  userId: string,
  callback: (messages: Message[]) => void
): () => void {
  if (!conversationId || !userId) {
    throw new Error('Missing required field: conversationId and userId are required');
  }

  let unsubscribe: (() => void) | null = null;
  let isActive = true;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY_MS = 1000;

  // Validate access control before subscribing
  const validateAndSubscribe = async () => {
    try {
      // Fetch conversation to validate access
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      
      if (!conversationDoc.exists()) {
        console.error('Failed to establish message subscription: Conversation not found');
        return;
      }

      const conversation = conversationDoc.data() as Conversation;

      // Validate user is a participant
      if (!conversation.participantIds.includes(userId)) {
        console.error('Failed to establish message subscription: User is not authorized to access this conversation');
        return;
      }

      // Access validated, establish listener
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          // Reset reconnect attempts on successful update
          reconnectAttempts = 0;

          const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Message));

          callback(messages);
        },
        (error) => {
          console.error('Message subscription error:', error);

          // Attempt reconnection if still active and under max attempts
          if (isActive && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            
            setTimeout(() => {
              if (isActive) {
                validateAndSubscribe();
              }
            }, RECONNECT_DELAY_MS * reconnectAttempts); // Exponential backoff
          } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.error('Max reconnection attempts reached. Subscription failed.');
          }
        }
      );
    } catch (error) {
      console.error('Failed to establish message subscription:', error);
    }
  };

  // Start the subscription
  validateAndSubscribe();

  // Return cleanup function
  return () => {
    isActive = false;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

/**
 * Enriches conversations with item and user details to create ConversationSummary objects.
 * Fetches trade item details (titles, images) and partner user details (name) from Firestore.
 * Results are cached to minimize Firestore reads.
 * 
 * @param conversations - Array of conversations to enrich
 * @param currentUserId - ID of the current user (to determine partner)
 * @returns Array of enriched conversation summaries
 */
export async function enrichConversations(
  conversations: Conversation[],
  currentUserId: string
): Promise<ConversationSummary[]> {
  if (!currentUserId) {
    throw new Error('Invalid input: Current user ID is required');
  }

  return retryWithBackoff(async () => {
    // Fetch all required details in parallel for better performance
    const enrichmentPromises = conversations.map(async (conversation) => {
      // Validate that current user is a participant
      if (!conversation.participantIds.includes(currentUserId)) {
        throw new Error(`Current user ${currentUserId} is not a participant in conversation ${conversation.id}`);
      }

      // Determine partner ID (the participant who is not the current user)
      const partnerId = conversation.participantIds.find(id => id !== currentUserId);
      
      if (!partnerId) {
        throw new Error(`Could not determine partner for conversation ${conversation.id}`);
      }

      // Fetch all details in parallel
      const [tradeAnchorDetails, targetItemDetails, partnerDetails] = await Promise.all([
        getItemDetails(conversation.tradeAnchorId),
        getItemDetails(conversation.targetItemId),
        getUserDetails(partnerId),
      ]);

      // Get unread count for current user
      const unreadCount = conversation.unreadCount[currentUserId] || 0;

      // Construct ConversationSummary
      const summary: ConversationSummary = {
        conversation,
        tradeAnchorTitle: tradeAnchorDetails.title,
        tradeAnchorImage: tradeAnchorDetails.image,
        targetItemTitle: targetItemDetails.title,
        targetItemImage: targetItemDetails.image,
        partnerName: partnerDetails.name,
        partnerId,
        unreadCount,
      };

      return summary;
    });

    return Promise.all(enrichmentPromises);
  });
}

/**
 * Retrieves all conversations for a user with enriched details.
 * Combines getUserConversations with enrichConversations for convenience.
 * 
 * @param userId - ID of the user
 * @returns Array of enriched conversation summaries, sorted by lastMessageAt (newest first)
 */
export async function getUserConversationsWithDetails(userId: string): Promise<ConversationSummary[]> {
  const conversations = await getUserConversations(userId);
  return enrichConversations(conversations, userId);
}

/**
 * Gets the total unread message count for a user across all their conversations.
 * This is a convenience function that combines getUserConversations with calculateTotalUnreadCount.
 * 
 * @param userId - ID of the user
 * @returns Total number of unread messages across all conversations
 */
export async function getTotalUnreadCount(userId: string): Promise<number> {
  const conversations = await getUserConversations(userId);
  return calculateTotalUnreadCount(conversations, userId);
}
