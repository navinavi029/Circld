import { describe, it, expect } from 'vitest';
import {
  calculateTotalUnreadCount,
  calculateTotalUnreadCountFromSummaries,
  formatUnreadCount,
} from './messagingUtils';
import { Conversation, ConversationSummary } from '../types/swipe-trading';
import { Timestamp } from 'firebase/firestore';

describe('messagingUtils', () => {
  describe('calculateTotalUnreadCount', () => {
    it('should return 0 for empty conversations array', () => {
      const result = calculateTotalUnreadCount([], 'user1');
      expect(result).toBe(0);
    });

    it('should return 0 when userId is empty', () => {
      const conversations: Conversation[] = [
        {
          id: 'conv1',
          tradeOfferId: 'trade1',
          participantIds: ['user1', 'user2'],
          tradeAnchorId: 'item1',
          targetItemId: 'item2',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: 'Hello',
          unreadCount: { user1: 5 },
        },
      ];
      const result = calculateTotalUnreadCount(conversations, '');
      expect(result).toBe(0);
    });

    it('should calculate total unread count for a single conversation', () => {
      const conversations: Conversation[] = [
        {
          id: 'conv1',
          tradeOfferId: 'trade1',
          participantIds: ['user1', 'user2'],
          tradeAnchorId: 'item1',
          targetItemId: 'item2',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: 'Hello',
          unreadCount: { user1: 5 },
        },
      ];
      const result = calculateTotalUnreadCount(conversations, 'user1');
      expect(result).toBe(5);
    });

    it('should calculate total unread count across multiple conversations', () => {
      const conversations: Conversation[] = [
        {
          id: 'conv1',
          tradeOfferId: 'trade1',
          participantIds: ['user1', 'user2'],
          tradeAnchorId: 'item1',
          targetItemId: 'item2',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: 'Hello',
          unreadCount: { user1: 5, user2: 0 },
        },
        {
          id: 'conv2',
          tradeOfferId: 'trade2',
          participantIds: ['user1', 'user3'],
          tradeAnchorId: 'item3',
          targetItemId: 'item4',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: 'Hi there',
          unreadCount: { user1: 3, user3: 2 },
        },
        {
          id: 'conv3',
          tradeOfferId: 'trade3',
          participantIds: ['user1', 'user4'],
          tradeAnchorId: 'item5',
          targetItemId: 'item6',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: 'Hey',
          unreadCount: { user1: 2, user4: 1 },
        },
      ];
      const result = calculateTotalUnreadCount(conversations, 'user1');
      expect(result).toBe(10); // 5 + 3 + 2
    });

    it('should return 0 when user has no unread messages', () => {
      const conversations: Conversation[] = [
        {
          id: 'conv1',
          tradeOfferId: 'trade1',
          participantIds: ['user1', 'user2'],
          tradeAnchorId: 'item1',
          targetItemId: 'item2',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: 'Hello',
          unreadCount: { user2: 5 },
        },
      ];
      const result = calculateTotalUnreadCount(conversations, 'user1');
      expect(result).toBe(0);
    });

    it('should handle conversations with empty unreadCount objects', () => {
      const conversations: Conversation[] = [
        {
          id: 'conv1',
          tradeOfferId: 'trade1',
          participantIds: ['user1', 'user2'],
          tradeAnchorId: 'item1',
          targetItemId: 'item2',
          createdAt: Timestamp.now(),
          lastMessageAt: Timestamp.now(),
          lastMessageText: '',
          unreadCount: {},
        },
      ];
      const result = calculateTotalUnreadCount(conversations, 'user1');
      expect(result).toBe(0);
    });
  });

  describe('calculateTotalUnreadCountFromSummaries', () => {
    it('should return 0 for empty summaries array', () => {
      const result = calculateTotalUnreadCountFromSummaries([]);
      expect(result).toBe(0);
    });

    it('should calculate total unread count from a single summary', () => {
      const summaries: ConversationSummary[] = [
        {
          conversation: {
            id: 'conv1',
            tradeOfferId: 'trade1',
            participantIds: ['user1', 'user2'],
            tradeAnchorId: 'item1',
            targetItemId: 'item2',
            createdAt: Timestamp.now(),
            lastMessageAt: Timestamp.now(),
            lastMessageText: 'Hello',
            unreadCount: { user1: 5 },
          },
          tradeAnchorTitle: 'Item 1',
          tradeAnchorImage: 'image1.jpg',
          targetItemTitle: 'Item 2',
          targetItemImage: 'image2.jpg',
          partnerName: 'John Doe',
          partnerId: 'user2',
          unreadCount: 5,
        },
      ];
      const result = calculateTotalUnreadCountFromSummaries(summaries);
      expect(result).toBe(5);
    });

    it('should calculate total unread count across multiple summaries', () => {
      const summaries: ConversationSummary[] = [
        {
          conversation: {
            id: 'conv1',
            tradeOfferId: 'trade1',
            participantIds: ['user1', 'user2'],
            tradeAnchorId: 'item1',
            targetItemId: 'item2',
            createdAt: Timestamp.now(),
            lastMessageAt: Timestamp.now(),
            lastMessageText: 'Hello',
            unreadCount: { user1: 5 },
          },
          tradeAnchorTitle: 'Item 1',
          tradeAnchorImage: 'image1.jpg',
          targetItemTitle: 'Item 2',
          targetItemImage: 'image2.jpg',
          partnerName: 'John Doe',
          partnerId: 'user2',
          unreadCount: 5,
        },
        {
          conversation: {
            id: 'conv2',
            tradeOfferId: 'trade2',
            participantIds: ['user1', 'user3'],
            tradeAnchorId: 'item3',
            targetItemId: 'item4',
            createdAt: Timestamp.now(),
            lastMessageAt: Timestamp.now(),
            lastMessageText: 'Hi',
            unreadCount: { user1: 3 },
          },
          tradeAnchorTitle: 'Item 3',
          tradeAnchorImage: 'image3.jpg',
          targetItemTitle: 'Item 4',
          targetItemImage: 'image4.jpg',
          partnerName: 'Jane Smith',
          partnerId: 'user3',
          unreadCount: 3,
        },
      ];
      const result = calculateTotalUnreadCountFromSummaries(summaries);
      expect(result).toBe(8); // 5 + 3
    });

    it('should return 0 when all summaries have zero unread count', () => {
      const summaries: ConversationSummary[] = [
        {
          conversation: {
            id: 'conv1',
            tradeOfferId: 'trade1',
            participantIds: ['user1', 'user2'],
            tradeAnchorId: 'item1',
            targetItemId: 'item2',
            createdAt: Timestamp.now(),
            lastMessageAt: Timestamp.now(),
            lastMessageText: 'Hello',
            unreadCount: {},
          },
          tradeAnchorTitle: 'Item 1',
          tradeAnchorImage: 'image1.jpg',
          targetItemTitle: 'Item 2',
          targetItemImage: 'image2.jpg',
          partnerName: 'John Doe',
          partnerId: 'user2',
          unreadCount: 0,
        },
      ];
      const result = calculateTotalUnreadCountFromSummaries(summaries);
      expect(result).toBe(0);
    });
  });

  describe('formatUnreadCount', () => {
    it('should return "0" for zero count', () => {
      expect(formatUnreadCount(0)).toBe('0');
    });

    it('should return "0" for negative count', () => {
      expect(formatUnreadCount(-5)).toBe('0');
    });

    it('should return the count as string for counts 1-9', () => {
      expect(formatUnreadCount(1)).toBe('1');
      expect(formatUnreadCount(5)).toBe('5');
      expect(formatUnreadCount(9)).toBe('9');
    });

    it('should return "9+" for counts greater than 9', () => {
      expect(formatUnreadCount(10)).toBe('9+');
      expect(formatUnreadCount(15)).toBe('9+');
      expect(formatUnreadCount(100)).toBe('9+');
    });
  });
});
