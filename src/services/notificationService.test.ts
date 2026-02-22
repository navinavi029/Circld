import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMessageNotification } from './notificationService';
import { Notification, MessageNotificationData } from '../types/swipe-trading';
import * as retryModule from '../utils/retryWithBackoff';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ _type: 'collection' })),
  doc: vi.fn((collectionOrDb: any, ...args: string[]) => {
    if (args.length === 0) {
      return { id: 'mock-notification-id', _type: 'doc' };
    }
    return { id: args[args.length - 1], _type: 'doc' };
  }),
  setDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1234567890, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })),
  },
}));

describe('notificationService - createMessageNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a message notification with all required fields', async () => {
    const conversationId = 'conv-123';
    const senderId = 'sender-456';
    const senderName = 'John Doe';
    const messageText = 'Hello, is this item still available?';
    const recipientId = 'recipient-789';
    const tradeAnchorTitle = 'Vintage Camera';
    const targetItemTitle = 'Retro Lens';

    const notification = await createMessageNotification(
      conversationId,
      senderId,
      senderName,
      messageText,
      recipientId,
      tradeAnchorTitle,
      targetItemTitle
    );

    expect(notification).toBeDefined();
    expect(notification.id).toBe('mock-notification-id');
    expect(notification.userId).toBe(recipientId);
    expect(notification.type).toBe('message');
    expect(notification.read).toBe(false);
    
    const data = notification.data as MessageNotificationData;
    expect(data.conversationId).toBe(conversationId);
    expect(data.senderId).toBe(senderId);
    expect(data.senderName).toBe(senderName);
    expect(data.messagePreview).toBe(messageText);
    expect(data.tradeAnchorTitle).toBe(tradeAnchorTitle);
    expect(data.targetItemTitle).toBe(targetItemTitle);
  });

  it('should truncate message preview to 50 characters', async () => {
    const longMessage = 'This is a very long message that exceeds fifty characters and should be truncated';
    
    const notification = await createMessageNotification(
      'conv-123',
      'sender-456',
      'John Doe',
      longMessage,
      'recipient-789',
      'Vintage Camera',
      'Retro Lens'
    );

    const data = notification.data as MessageNotificationData;
    expect(data.messagePreview).toBe('This is a very long message that exceeds fifty cha...');
    expect(data.messagePreview.length).toBeLessThanOrEqual(53); // 50 chars + '...'
  });

  it('should not truncate messages shorter than 50 characters', async () => {
    const shortMessage = 'Short message';
    
    const notification = await createMessageNotification(
      'conv-123',
      'sender-456',
      'John Doe',
      shortMessage,
      'recipient-789',
      'Vintage Camera',
      'Retro Lens'
    );

    const data = notification.data as MessageNotificationData;
    expect(data.messagePreview).toBe(shortMessage);
  });

  it('should throw error when conversationId is missing', async () => {
    await expect(
      createMessageNotification(
        '',
        'sender-456',
        'John Doe',
        'Hello',
        'recipient-789',
        'Vintage Camera',
        'Retro Lens'
      )
    ).rejects.toThrow('Invalid input: conversationId, senderId, and recipientId are required');
  });

  it('should throw error when senderId is missing', async () => {
    await expect(
      createMessageNotification(
        'conv-123',
        '',
        'John Doe',
        'Hello',
        'recipient-789',
        'Vintage Camera',
        'Retro Lens'
      )
    ).rejects.toThrow('Invalid input: conversationId, senderId, and recipientId are required');
  });

  it('should throw error when recipientId is missing', async () => {
    await expect(
      createMessageNotification(
        'conv-123',
        'sender-456',
        'John Doe',
        'Hello',
        '',
        'Vintage Camera',
        'Retro Lens'
      )
    ).rejects.toThrow('Invalid input: conversationId, senderId, and recipientId are required');
  });

  it('should throw error when senderName is missing', async () => {
    await expect(
      createMessageNotification(
        'conv-123',
        'sender-456',
        '',
        'Hello',
        'recipient-789',
        'Vintage Camera',
        'Retro Lens'
      )
    ).rejects.toThrow('Invalid input: senderName, messageText, and item titles are required');
  });

  it('should throw error when messageText is missing', async () => {
    await expect(
      createMessageNotification(
        'conv-123',
        'sender-456',
        'John Doe',
        '',
        'recipient-789',
        'Vintage Camera',
        'Retro Lens'
      )
    ).rejects.toThrow('Invalid input: senderName, messageText, and item titles are required');
  });

  it('should throw error when tradeAnchorTitle is missing', async () => {
    await expect(
      createMessageNotification(
        'conv-123',
        'sender-456',
        'John Doe',
        'Hello',
        'recipient-789',
        '',
        'Retro Lens'
      )
    ).rejects.toThrow('Invalid input: senderName, messageText, and item titles are required');
  });

  it('should throw error when targetItemTitle is missing', async () => {
    await expect(
      createMessageNotification(
        'conv-123',
        'sender-456',
        'John Doe',
        'Hello',
        'recipient-789',
        'Vintage Camera',
        ''
      )
    ).rejects.toThrow('Invalid input: senderName, messageText, and item titles are required');
  });

  it('should include sender name and trade item details in notification data', async () => {
    const notification = await createMessageNotification(
      'conv-123',
      'sender-456',
      'Alice Smith',
      'Interested in trading',
      'recipient-789',
      'Canon EOS 5D',
      'Nikon D850'
    );

    const data = notification.data as MessageNotificationData;
    expect(data.senderName).toBe('Alice Smith');
    expect(data.tradeAnchorTitle).toBe('Canon EOS 5D');
    expect(data.targetItemTitle).toBe('Nikon D850');
  });
});
