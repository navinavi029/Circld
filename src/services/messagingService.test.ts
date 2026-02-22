import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import {
  createConversation,
  getConversationByTradeOffer,
  getUserConversations,
  sendMessage,
  getMessages,
  markConversationAsRead,
  subscribeToMessages,
  clearCache,
  getTotalUnreadCount,
} from './messagingService';
import { createMessageNotification } from './notificationService';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}));

// Mock notification service
vi.mock('./notificationService', () => ({
  createMessageNotification: vi.fn(),
}));

// Mock Firestore functions
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    Timestamp: {
      now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
    },
  };
});

// Mock retryWithBackoff to execute immediately
vi.mock('../utils/retryWithBackoff', () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
}));

describe('messagingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createConversation', () => {
    it('should create a new conversation for an accepted trade offer', async () => {
      const tradeOfferId = 'trade-123';
      const mockTradeOffer = {
        id: tradeOfferId,
        status: 'accepted',
        offeringUserId: 'user-1',
        targetItemOwnerId: 'user-2',
        tradeAnchorId: 'item-1',
        targetItemId: 'item-2',
      };

      // Mock getConversationByTradeOffer to return null (no existing conversation)
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock getDoc for trade offer
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockTradeOffer,
      } as any);

      // Mock doc and collection for creating conversation
      const mockConversationRef = { id: 'conversation-123' };
      vi.mocked(doc).mockReturnValue(mockConversationRef as any);
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValueOnce(undefined);

      const result = await createConversation(tradeOfferId);

      expect(result).toMatchObject({
        id: 'conversation-123',
        tradeOfferId,
        participantIds: ['user-1', 'user-2'],
        tradeAnchorId: 'item-1',
        targetItemId: 'item-2',
        lastMessageText: '',
        unreadCount: {},
      });
      expect(setDoc).toHaveBeenCalled();
    });

    it('should return existing conversation if one already exists (idempotency)', async () => {
      const tradeOfferId = 'trade-123';
      const existingConversation = {
        id: 'conversation-123',
        tradeOfferId,
        participantIds: ['user-1', 'user-2'],
        tradeAnchorId: 'item-1',
        targetItemId: 'item-2',
        createdAt: Timestamp.now(),
        lastMessageAt: Timestamp.now(),
        lastMessageText: '',
        unreadCount: {},
      };

      // Mock getConversationByTradeOffer to return existing conversation
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'conversation-123',
            data: () => existingConversation,
          },
        ],
      } as any);

      const result = await createConversation(tradeOfferId);

      expect(result).toEqual(existingConversation);
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should throw error if trade offer not found', async () => {
      const tradeOfferId = 'trade-123';

      // Mock getConversationByTradeOffer to return null
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock getDoc to return non-existent trade offer
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      await expect(createConversation(tradeOfferId)).rejects.toThrow(
        'Trade offer not found'
      );
    });

    it('should throw error if trade offer is not accepted', async () => {
      const tradeOfferId = 'trade-123';
      const mockTradeOffer = {
        id: tradeOfferId,
        status: 'pending',
        offeringUserId: 'user-1',
        targetItemOwnerId: 'user-2',
      };

      // Mock getConversationByTradeOffer to return null
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      // Mock getDoc for trade offer
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockTradeOffer,
      } as any);

      await expect(createConversation(tradeOfferId)).rejects.toThrow(
        'Conversation can only be created for accepted trades'
      );
    });

    it('should throw error if trade offer ID is empty', async () => {
      await expect(createConversation('')).rejects.toThrow(
        'Invalid input: Trade offer ID is required'
      );
    });
  });

  describe('getConversationByTradeOffer', () => {
    it('should return conversation if found', async () => {
      const tradeOfferId = 'trade-123';
      const mockConversation = {
        id: 'conversation-123',
        tradeOfferId,
        participantIds: ['user-1', 'user-2'],
      };

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'conversation-123',
            data: () => mockConversation,
          },
        ],
      } as any);

      const result = await getConversationByTradeOffer(tradeOfferId);

      expect(result).toEqual(mockConversation);
    });

    it('should return null if conversation not found', async () => {
      const tradeOfferId = 'trade-123';

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      const result = await getConversationByTradeOffer(tradeOfferId);

      expect(result).toBeNull();
    });

    it('should throw error if trade offer ID is empty', async () => {
      await expect(getConversationByTradeOffer('')).rejects.toThrow(
        'Invalid input: Trade offer ID is required'
      );
    });
  });

  describe('getUserConversations', () => {
    it('should return conversations for a user sorted by lastMessageAt', async () => {
      const userId = 'user-1';
      const mockConversations = [
        {
          id: 'conversation-1',
          participantIds: ['user-1', 'user-2'],
          lastMessageAt: { seconds: 1234567892, nanoseconds: 0 },
        },
        {
          id: 'conversation-2',
          participantIds: ['user-1', 'user-3'],
          lastMessageAt: { seconds: 1234567890, nanoseconds: 0 },
        },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: mockConversations.map((conv) => ({
          id: conv.id,
          data: () => conv,
        })),
      } as any);

      const result = await getUserConversations(userId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('conversation-1');
      expect(result[1].id).toBe('conversation-2');
      expect(query).toHaveBeenCalled();
    });

    it('should return empty array if user has no conversations', async () => {
      const userId = 'user-1';

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      const result = await getUserConversations(userId);

      expect(result).toEqual([]);
    });

    it('should throw error if user ID is empty', async () => {
      await expect(getUserConversations('')).rejects.toThrow(
        'Invalid input: User ID is required'
      );
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully for a participant', async () => {
      const conversationId = 'conversation-123';
      const senderId = 'user-1';
      const text = 'Hello, world!';
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
        unreadCount: {},
        tradeAnchorId: 'item-1',
        targetItemId: 'item-2',
      };

      // Mock getDoc for conversation
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockConversation,
        } as any)
        // Mock getDoc for sender user
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ name: 'John Doe' }),
        } as any)
        // Mock getDoc for trade anchor item
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ title: 'Trade Anchor Item' }),
        } as any)
        // Mock getDoc for target item
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ title: 'Target Item' }),
        } as any);

      // Mock doc and collection for creating message
      const mockMessageRef = { id: 'message-123' };
      vi.mocked(doc).mockReturnValue(mockMessageRef as any);
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(createMessageNotification).mockResolvedValue({} as any);

      const result = await sendMessage(conversationId, senderId, text);

      expect(result).toMatchObject({
        id: 'message-123',
        conversationId,
        senderId,
        text: 'Hello, world!',
        readBy: [senderId],
      });
      expect(setDoc).toHaveBeenCalledTimes(2); // Once for message, once for conversation update
    });

    it('should sanitize HTML tags from message text', async () => {
      const conversationId = 'conversation-123';
      const senderId = 'user-1';
      const text = '<script>alert("xss")</script>Hello <b>world</b>!';
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
        unreadCount: {},
        tradeAnchorId: 'item-1',
        targetItemId: 'item-2',
      };

      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockConversation,
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ name: 'John Doe' }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ title: 'Trade Anchor Item' }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ title: 'Target Item' }),
        } as any);

      const mockMessageRef = { id: 'message-123' };
      vi.mocked(doc).mockReturnValue(mockMessageRef as any);
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(createMessageNotification).mockResolvedValue({} as any);

      const result = await sendMessage(conversationId, senderId, text);

      expect(result.text).toBe('Hello world!');
      expect(result.text).not.toContain('<script>');
      expect(result.text).not.toContain('<b>');
    });

    it('should reject empty message', async () => {
      const conversationId = 'conversation-123';
      const senderId = 'user-1';
      const text = '';

      await expect(sendMessage(conversationId, senderId, text)).rejects.toThrow(
        'Message cannot be empty'
      );
    });

    it('should reject whitespace-only message', async () => {
      const conversationId = 'conversation-123';
      const senderId = 'user-1';
      const text = '   \t\n  ';

      await expect(sendMessage(conversationId, senderId, text)).rejects.toThrow(
        'Message cannot be empty'
      );
    });

    it('should reject message exceeding 2000 characters', async () => {
      const conversationId = 'conversation-123';
      const senderId = 'user-1';
      const text = 'a'.repeat(2001);

      await expect(sendMessage(conversationId, senderId, text)).rejects.toThrow(
        'Message exceeds maximum length'
      );
    });

    it('should reject message from non-participant', async () => {
      const conversationId = 'conversation-123';
      const senderId = 'user-3'; // Not a participant
      const text = 'Hello!';
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
        unreadCount: {},
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockConversation,
      } as any);

      await expect(sendMessage(conversationId, senderId, text)).rejects.toThrow(
        'User is not authorized to send messages in this conversation'
      );
    });

    it('should throw error if conversation not found', async () => {
      const conversationId = 'conversation-123';
      const senderId = 'user-1';
      const text = 'Hello!';

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      await expect(sendMessage(conversationId, senderId, text)).rejects.toThrow(
        'Conversation not found'
      );
    });

    it('should preserve URLs in message text', async () => {
      const conversationId = 'conversation-123';
      const senderId = 'user-1';
      const text = 'Check out https://example.com for more info';
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
        unreadCount: {},
        tradeAnchorId: 'item-1',
        targetItemId: 'item-2',
      };

      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockConversation,
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ name: 'John Doe' }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ title: 'Trade Anchor Item' }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ title: 'Target Item' }),
        } as any);

      const mockMessageRef = { id: 'message-123' };
      vi.mocked(doc).mockReturnValue(mockMessageRef as any);
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(createMessageNotification).mockResolvedValue({} as any);

      const result = await sendMessage(conversationId, senderId, text);

      expect(result.text).toContain('https://example.com');
    });

    it('should preserve line breaks in message text', async () => {
      const conversationId = 'conversation-123';
      const senderId = 'user-1';
      const text = 'Line 1\nLine 2\nLine 3';
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
        unreadCount: {},
        tradeAnchorId: 'item-1',
        targetItemId: 'item-2',
      };

      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockConversation,
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ name: 'John Doe' }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ title: 'Trade Anchor Item' }),
        } as any)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ title: 'Target Item' }),
        } as any);

      const mockMessageRef = { id: 'message-123' };
      vi.mocked(doc).mockReturnValue(mockMessageRef as any);
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(createMessageNotification).mockResolvedValue({} as any);

      const result = await sendMessage(conversationId, senderId, text);

      expect(result.text).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should create notification for recipient after sending message', async () => {
      const conversationId = 'conversation-123';
      const senderId = 'user-1';
      const recipientId = 'user-2';
      const text = 'Hello, world!';
      const mockConversation = {
        id: conversationId,
        participantIds: [senderId, recipientId],
        unreadCount: {},
        tradeAnchorId: 'item-1',
        targetItemId: 'item-2',
      };

      // Mock getDoc for conversation
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockConversation,
        } as any)
        // Mock getDoc for sender user
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ name: 'John Doe' }),
        } as any)
        // Mock getDoc for trade anchor item
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ title: 'Trade Anchor Item' }),
        } as any)
        // Mock getDoc for target item
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ title: 'Target Item' }),
        } as any);

      const mockMessageRef = { id: 'message-123' };
      vi.mocked(doc).mockReturnValue(mockMessageRef as any);
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(createMessageNotification).mockResolvedValue({} as any);

      await sendMessage(conversationId, senderId, text);

      expect(createMessageNotification).toHaveBeenCalledWith(
        conversationId,
        senderId,
        'John Doe',
        text,
        recipientId,
        'Trade Anchor Item',
        'Target Item'
      );
    });

    it('should handle notification creation errors gracefully', async () => {
      const conversationId = 'conversation-123';
      const senderId = 'user-1';
      const text = 'Hello, world!';
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
        unreadCount: {},
        tradeAnchorId: 'item-1',
        targetItemId: 'item-2',
      };

      // Mock getDoc for conversation
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockConversation,
        } as any)
        // Mock getDoc for sender user (will fail)
        .mockRejectedValueOnce(new Error('User not found'));

      const mockMessageRef = { id: 'message-123' };
      vi.mocked(doc).mockReturnValue(mockMessageRef as any);
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      // Should not throw error even if notification creation fails
      const result = await sendMessage(conversationId, senderId, text);

      expect(result).toMatchObject({
        id: 'message-123',
        conversationId,
        senderId,
        text,
      });
      expect(createMessageNotification).not.toHaveBeenCalled();
    });

    it('should use default values when user or item data is missing', async () => {
      const conversationId = 'conversation-123';
      const senderId = 'user-1';
      const recipientId = 'user-2';
      const text = 'Hello, world!';
      const mockConversation = {
        id: conversationId,
        participantIds: [senderId, recipientId],
        unreadCount: {},
        tradeAnchorId: 'item-1',
        targetItemId: 'item-2',
      };

      // Mock getDoc for conversation
      vi.mocked(getDoc)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => mockConversation,
        } as any)
        // Mock getDoc for sender user (no name field)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({}),
        } as any)
        // Mock getDoc for trade anchor item (no title field)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({}),
        } as any)
        // Mock getDoc for target item (doesn't exist)
        .mockResolvedValueOnce({
          exists: () => false,
        } as any);

      const mockMessageRef = { id: 'message-123' };
      vi.mocked(doc).mockReturnValue(mockMessageRef as any);
      vi.mocked(collection).mockReturnValue({} as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      vi.mocked(createMessageNotification).mockResolvedValue({} as any);

      await sendMessage(conversationId, senderId, text);

      expect(createMessageNotification).toHaveBeenCalledWith(
        conversationId,
        senderId,
        'Unknown User',
        text,
        recipientId,
        'Item',
        'Item'
      );
    });
  });

  describe('getMessages', () => {
    it('should retrieve messages for a participant', async () => {
      const conversationId = 'conversation-123';
      const userId = 'user-1';
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
      };
      const mockMessages = [
        {
          id: 'message-1',
          conversationId,
          senderId: 'user-1',
          text: 'Hello',
          createdAt: { seconds: 1234567890, nanoseconds: 0 },
          readBy: ['user-1'],
        },
        {
          id: 'message-2',
          conversationId,
          senderId: 'user-2',
          text: 'Hi there',
          createdAt: { seconds: 1234567891, nanoseconds: 0 },
          readBy: ['user-2'],
        },
      ];

      // Mock getDoc for conversation
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockConversation,
      } as any);

      // Mock getDocs for messages
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: mockMessages.map((msg) => ({
          id: msg.id,
          data: () => msg,
        })),
      } as any);

      const result = await getMessages(conversationId, userId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('message-1');
      expect(result[1].id).toBe('message-2');
    });

    it('should return empty array if no messages', async () => {
      const conversationId = 'conversation-123';
      const userId = 'user-1';
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockConversation,
      } as any);

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      const result = await getMessages(conversationId, userId);

      expect(result).toEqual([]);
    });

    it('should reject request from non-participant', async () => {
      const conversationId = 'conversation-123';
      const userId = 'user-3'; // Not a participant
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockConversation,
      } as any);

      await expect(getMessages(conversationId, userId)).rejects.toThrow(
        'User is not authorized to access this conversation'
      );
    });

    it('should throw error if conversation not found', async () => {
      const conversationId = 'conversation-123';
      const userId = 'user-1';

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      await expect(getMessages(conversationId, userId)).rejects.toThrow(
        'Conversation not found'
      );
    });
  });

  describe('markConversationAsRead', () => {
    it('should mark all messages as read for a participant', async () => {
      const conversationId = 'conversation-123';
      const userId = 'user-1';
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
        unreadCount: { 'user-1': 3 },
      };
      const mockMessages = [
        {
          id: 'message-1',
          readBy: ['user-2'],
        },
        {
          id: 'message-2',
          readBy: ['user-2'],
        },
        {
          id: 'message-3',
          readBy: ['user-2'],
        },
      ];

      // Mock getDoc for conversation
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockConversation,
      } as any);

      // Mock getDocs for messages
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: mockMessages.map((msg) => ({
          id: msg.id,
          data: () => msg,
        })),
      } as any);

      vi.mocked(setDoc).mockResolvedValue(undefined);

      await markConversationAsRead(conversationId, userId);

      // Should update each message + conversation unread count
      expect(setDoc).toHaveBeenCalledTimes(4); // 3 messages + 1 conversation
    });

    it('should not update messages already read by user', async () => {
      const conversationId = 'conversation-123';
      const userId = 'user-1';
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
        unreadCount: { 'user-1': 0 },
      };
      const mockMessages = [
        {
          id: 'message-1',
          readBy: ['user-1', 'user-2'],
        },
      ];

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockConversation,
      } as any);

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: mockMessages.map((msg) => ({
          id: msg.id,
          data: () => msg,
        })),
      } as any);

      vi.mocked(setDoc).mockResolvedValue(undefined);

      await markConversationAsRead(conversationId, userId);

      // Should only update conversation unread count, not the message
      expect(setDoc).toHaveBeenCalledTimes(1);
    });

    it('should reject request from non-participant', async () => {
      const conversationId = 'conversation-123';
      const userId = 'user-3'; // Not a participant
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
        unreadCount: {},
      };

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockConversation,
      } as any);

      await expect(markConversationAsRead(conversationId, userId)).rejects.toThrow(
        'User is not authorized to access this conversation'
      );
    });

    it('should throw error if conversation not found', async () => {
      const conversationId = 'conversation-123';
      const userId = 'user-1';

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      await expect(markConversationAsRead(conversationId, userId)).rejects.toThrow(
        'Conversation not found'
      );
    });
  });

  describe('subscribeToMessages', () => {
    it('should establish subscription for a participant', async () => {
      const conversationId = 'conversation-123';
      const userId = 'user-1';
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
      };
      const mockMessages = [
        {
          id: 'message-1',
          conversationId,
          senderId: 'user-1',
          text: 'Hello',
          createdAt: { seconds: 1234567890, nanoseconds: 0 },
          readBy: ['user-1'],
        },
      ];
      const callback = vi.fn();

      // Mock getDoc for conversation validation
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockConversation,
      } as any);

      // Mock onSnapshot to call callback immediately
      const unsubscribeMock = vi.fn();
      vi.mocked(onSnapshot).mockImplementation((q, successCallback: any) => {
        successCallback({
          docs: mockMessages.map((msg) => ({
            id: msg.id,
            data: () => msg,
          })),
        });
        return unsubscribeMock;
      });

      const unsubscribe = subscribeToMessages(conversationId, userId, callback);

      // Wait for async validation
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(callback).toHaveBeenCalledWith(mockMessages);
      expect(onSnapshot).toHaveBeenCalled();

      // Test cleanup
      unsubscribe();
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should reject subscription for non-participant', async () => {
      const conversationId = 'conversation-123';
      const userId = 'user-3'; // Not a participant
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
      };
      const callback = vi.fn();

      // Mock getDoc for conversation validation
      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockConversation,
      } as any);

      // subscribeToMessages should throw during validation
      expect(() => {
        subscribeToMessages(conversationId, userId, callback);
      }).not.toThrow(); // Function itself doesn't throw, but validation will fail

      // Wait for async validation to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // onSnapshot should not be called for non-participants
      expect(onSnapshot).not.toHaveBeenCalled();
    });

    it('should handle listener errors with reconnection', async () => {
      const conversationId = 'conversation-123';
      const userId = 'user-1';
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
      };
      const callback = vi.fn();

      // Mock getDoc for conversation validation
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockConversation,
      } as any);

      // Mock onSnapshot to trigger error callback
      const unsubscribeMock = vi.fn();
      let errorCallback: any;
      vi.mocked(onSnapshot).mockImplementation((q, successCallback: any, errCallback: any) => {
        errorCallback = errCallback;
        return unsubscribeMock;
      });

      const unsubscribe = subscribeToMessages(conversationId, userId, callback);

      // Wait for async validation
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Trigger error
      const mockError = new Error('Connection lost');
      errorCallback(mockError);

      // Should attempt reconnection
      await new Promise((resolve) => setTimeout(resolve, 1100)); // Wait for reconnect delay

      expect(getDoc).toHaveBeenCalledTimes(2); // Initial + reconnect attempt

      // Cleanup
      unsubscribe();
    });

    it('should clean up listener when unsubscribe is called', async () => {
      const conversationId = 'conversation-123';
      const userId = 'user-1';
      const mockConversation = {
        id: conversationId,
        participantIds: ['user-1', 'user-2'],
      };
      const callback = vi.fn();

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockConversation,
      } as any);

      const unsubscribeMock = vi.fn();
      vi.mocked(onSnapshot).mockImplementation(() => unsubscribeMock);

      const unsubscribe = subscribeToMessages(conversationId, userId, callback);

      // Wait for async validation
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Call unsubscribe
      unsubscribe();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should throw error if conversation not found', async () => {
      const conversationId = 'conversation-123';
      const userId = 'user-1';
      const callback = vi.fn();

      vi.mocked(getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      // Function doesn't throw immediately, but validation will fail
      expect(() => {
        subscribeToMessages(conversationId, userId, callback);
      }).not.toThrow();

      // Wait for async validation
      await new Promise((resolve) => setTimeout(resolve, 0));

      // onSnapshot should not be called
      expect(onSnapshot).not.toHaveBeenCalled();
    });

    it('should throw error if required parameters are missing', () => {
      const callback = vi.fn();

      expect(() => {
        subscribeToMessages('', 'user-1', callback);
      }).toThrow('Missing required field: conversationId and userId are required');

      expect(() => {
        subscribeToMessages('conversation-123', '', callback);
      }).toThrow('Missing required field: conversationId and userId are required');
    });
  });

  describe('Property-Based Tests', () => {
    describe('Property 16: Accepted trades only', () => {
      /**
       * **Validates: Requirements 6.3, 6.4**
       * 
       * For any trade offer with status other than 'accepted', 
       * attempting to create a conversation should be rejected.
       */
      it('should reject conversation creation for non-accepted trade offers', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              tradeOfferId: fc.uuid(),
              status: fc.constantFrom('pending', 'read', 'declined'),
              offeringUserId: fc.uuid(),
              targetItemOwnerId: fc.uuid(),
              tradeAnchorId: fc.uuid(),
              targetItemId: fc.uuid(),
            }),
            async ({ tradeOfferId, status, offeringUserId, targetItemOwnerId, tradeAnchorId, targetItemId }) => {
              // Mock getConversationByTradeOffer to return null (no existing conversation)
              vi.mocked(getDocs).mockResolvedValueOnce({
                empty: true,
                docs: [],
              } as any);

              // Mock getDoc for trade offer with non-accepted status
              vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                  id: tradeOfferId,
                  status,
                  offeringUserId,
                  targetItemOwnerId,
                  tradeAnchorId,
                  targetItemId,
                }),
              } as any);

              // Attempt to create conversation should throw error
              await expect(createConversation(tradeOfferId)).rejects.toThrow(
                'Conversation can only be created for accepted trades'
              );
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should allow conversation creation only for accepted trade offers', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              tradeOfferId: fc.uuid(),
              offeringUserId: fc.uuid(),
              targetItemOwnerId: fc.uuid(),
              tradeAnchorId: fc.uuid(),
              targetItemId: fc.uuid(),
            }),
            async ({ tradeOfferId, offeringUserId, targetItemOwnerId, tradeAnchorId, targetItemId }) => {
              // Mock getConversationByTradeOffer to return null (no existing conversation)
              vi.mocked(getDocs).mockResolvedValueOnce({
                empty: true,
                docs: [],
              } as any);

              // Mock getDoc for trade offer with accepted status
              vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                  id: tradeOfferId,
                  status: 'accepted',
                  offeringUserId,
                  targetItemOwnerId,
                  tradeAnchorId,
                  targetItemId,
                }),
              } as any);

              // Mock doc and collection for creating conversation
              const mockConversationRef = { id: fc.uuid() };
              vi.mocked(doc).mockReturnValue(mockConversationRef as any);
              vi.mocked(collection).mockReturnValue({} as any);
              vi.mocked(setDoc).mockResolvedValueOnce(undefined);

              // Attempt to create conversation should succeed
              const result = await createConversation(tradeOfferId);

              expect(result).toBeDefined();
              expect(result.tradeOfferId).toBe(tradeOfferId);
              expect(result.participantIds).toEqual([offeringUserId, targetItemOwnerId]);
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('enrichConversations', () => {
    beforeEach(() => {
      clearCache();
    });

    it('should enrich conversations with item and user details', async () => {
      const currentUserId = 'user-1';
      const partnerId = 'user-2';
      const mockConversations = [
        {
          id: 'conversation-1',
          tradeOfferId: 'trade-1',
          participantIds: [currentUserId, partnerId] as [string, string],
          tradeAnchorId: 'item-1',
          targetItemId: 'item-2',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: 'Hello',
          unreadCount: { [currentUserId]: 2 },
        },
      ];

      // Mock getDoc for items and user
      vi.mocked(getDoc)
        // Trade anchor item
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ title: 'Trade Anchor Item', images: ['image1.jpg'] }),
        } as any)
        // Target item
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ title: 'Target Item', images: ['image2.jpg'] }),
        } as any)
        // Partner user
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ name: 'Partner Name' }),
        } as any);

      const { enrichConversations } = await import('./messagingService');
      const result = await enrichConversations(mockConversations, currentUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        conversation: mockConversations[0],
        tradeAnchorTitle: 'Trade Anchor Item',
        tradeAnchorImage: 'image1.jpg',
        targetItemTitle: 'Target Item',
        targetItemImage: 'image2.jpg',
        partnerName: 'Partner Name',
        partnerId,
        unreadCount: 2,
      });
    });

    it('should use default values when item or user data is missing', async () => {
      const currentUserId = 'user-1';
      const partnerId = 'user-2';
      const mockConversations = [
        {
          id: 'conversation-1',
          tradeOfferId: 'trade-1',
          participantIds: [currentUserId, partnerId] as [string, string],
          tradeAnchorId: 'item-1',
          targetItemId: 'item-2',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: '',
          unreadCount: {},
        },
      ];

      // Mock getDoc with missing data
      vi.mocked(getDoc)
        // Trade anchor item (no title)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({}),
        } as any)
        // Target item (doesn't exist)
        .mockResolvedValueOnce({
          exists: () => false,
        } as any)
        // Partner user (no name)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({}),
        } as any);

      const { enrichConversations } = await import('./messagingService');
      const result = await enrichConversations(mockConversations, currentUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        tradeAnchorTitle: 'Unknown Item',
        tradeAnchorImage: '',
        targetItemTitle: 'Unknown Item',
        targetItemImage: '',
        partnerName: 'Unknown User',
        partnerId,
        unreadCount: 0,
      });
    });

    it('should handle multiple conversations efficiently', async () => {
      const currentUserId = 'user-1';
      const mockConversations = [
        {
          id: 'conversation-1',
          tradeOfferId: 'trade-1',
          participantIds: [currentUserId, 'user-2'] as [string, string],
          tradeAnchorId: 'item-1',
          targetItemId: 'item-2',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: '',
          unreadCount: {},
        },
        {
          id: 'conversation-2',
          tradeOfferId: 'trade-2',
          participantIds: [currentUserId, 'user-3'] as [string, string],
          tradeAnchorId: 'item-3',
          targetItemId: 'item-4',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: '',
          unreadCount: {},
        },
      ];

      // Mock getDoc for all items and users
      vi.mocked(getDoc)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ title: 'Item 1', images: ['img1.jpg'] }) } as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ title: 'Item 2', images: ['img2.jpg'] }) } as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'User 2' }) } as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ title: 'Item 3', images: ['img3.jpg'] }) } as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ title: 'Item 4', images: ['img4.jpg'] }) } as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'User 3' }) } as any);

      const { enrichConversations } = await import('./messagingService');
      const result = await enrichConversations(mockConversations, currentUserId);

      expect(result).toHaveLength(2);
      expect(result[0].partnerName).toBe('User 2');
      expect(result[1].partnerName).toBe('User 3');
    });

    it('should throw error if current user is not a participant', async () => {
      const currentUserId = 'user-3'; // Not a participant
      const mockConversations = [
        {
          id: 'conversation-1',
          tradeOfferId: 'trade-1',
          participantIds: ['user-1', 'user-2'] as [string, string],
          tradeAnchorId: 'item-1',
          targetItemId: 'item-2',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: '',
          unreadCount: {},
        },
      ];

      const { enrichConversations } = await import('./messagingService');
      await expect(enrichConversations(mockConversations, currentUserId)).rejects.toThrow(
        'Current user user-3 is not a participant in conversation conversation-1'
      );
    });

    it('should throw error if current user ID is empty', async () => {
      const mockConversations = [
        {
          id: 'conversation-1',
          tradeOfferId: 'trade-1',
          participantIds: ['user-1', 'user-2'] as [string, string],
          tradeAnchorId: 'item-1',
          targetItemId: 'item-2',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: '',
          unreadCount: {},
        },
      ];

      const { enrichConversations } = await import('./messagingService');
      await expect(enrichConversations(mockConversations, '')).rejects.toThrow(
        'Invalid input: Current user ID is required'
      );
    });

    it('should handle empty conversations array', async () => {
      const currentUserId = 'user-1';
      const mockConversations: any[] = [];

      const { enrichConversations } = await import('./messagingService');
      const result = await enrichConversations(mockConversations, currentUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getUserConversationsWithDetails', () => {
    beforeEach(() => {
      clearCache();
    });

    it('should retrieve and enrich user conversations', async () => {
      const userId = 'user-1';
      const mockConversations = [
        {
          id: 'conversation-1',
          tradeOfferId: 'trade-1',
          participantIds: [userId, 'user-2'] as [string, string],
          tradeAnchorId: 'item-1',
          targetItemId: 'item-2',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: 'Hello',
          unreadCount: { [userId]: 1 },
        },
      ];

      // Mock getUserConversations
      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: mockConversations.map((conv) => ({
          id: conv.id,
          data: () => conv,
        })),
      } as any);

      // Mock getDoc for enrichment
      vi.mocked(getDoc)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ title: 'Item 1', images: ['img1.jpg'] }) } as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ title: 'Item 2', images: ['img2.jpg'] }) } as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'User 2' }) } as any);

      const { getUserConversationsWithDetails } = await import('./messagingService');
      const result = await getUserConversationsWithDetails(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        conversation: expect.objectContaining({ id: 'conversation-1' }),
        tradeAnchorTitle: 'Item 1',
        targetItemTitle: 'Item 2',
        partnerName: 'User 2',
        unreadCount: 1,
      });
    });

    it('should return empty array if user has no conversations', async () => {
      const userId = 'user-1';

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      const { getUserConversationsWithDetails } = await import('./messagingService');
      const result = await getUserConversationsWithDetails(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getTotalUnreadCount', () => {
    it('should return total unread count for a user', async () => {
      const userId = 'user-1';
      const mockConversations = [
        {
          id: 'conversation-1',
          participantIds: ['user-1', 'user-2'],
          tradeOfferId: 'trade-1',
          tradeAnchorId: 'item-1',
          targetItemId: 'item-2',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: 'Hello',
          unreadCount: { 'user-1': 5, 'user-2': 0 },
        },
        {
          id: 'conversation-2',
          participantIds: ['user-1', 'user-3'],
          tradeOfferId: 'trade-2',
          tradeAnchorId: 'item-3',
          targetItemId: 'item-4',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: 'Hi',
          unreadCount: { 'user-1': 3, 'user-3': 2 },
        },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: mockConversations.map((conv) => ({
          id: conv.id,
          data: () => conv,
        })),
      } as any);

      const result = await getTotalUnreadCount(userId);

      expect(result).toBe(8); // 5 + 3
    });

    it('should return 0 if user has no unread messages', async () => {
      const userId = 'user-1';
      const mockConversations = [
        {
          id: 'conversation-1',
          participantIds: ['user-1', 'user-2'],
          tradeOfferId: 'trade-1',
          tradeAnchorId: 'item-1',
          targetItemId: 'item-2',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: 'Hello',
          unreadCount: { 'user-2': 5 },
        },
      ];

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: false,
        docs: mockConversations.map((conv) => ({
          id: conv.id,
          data: () => conv,
        })),
      } as any);

      const result = await getTotalUnreadCount(userId);

      expect(result).toBe(0);
    });

    it('should return 0 if user has no conversations', async () => {
      const userId = 'user-1';

      vi.mocked(getDocs).mockResolvedValueOnce({
        empty: true,
        docs: [],
      } as any);

      const result = await getTotalUnreadCount(userId);

      expect(result).toBe(0);
    });
  });
});
