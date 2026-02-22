import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import NotificationList from './NotificationList';
import * as notificationService from '../services/notificationService';
import * as tradeOfferService from '../services/tradeOfferService';
import * as messagingService from '../services/messagingService';
import { Timestamp } from 'firebase/firestore';

// Mock the auth context
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'user-123' },
  }),
}));

// Mock services
vi.mock('../services/notificationService');
vi.mock('../services/tradeOfferService');
vi.mock('../services/messagingService');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotificationList - Trade Acceptance Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept trade and create conversation when Start Conversation is clicked', async () => {
    const user = userEvent.setup();
    
    // Mock notification data
    const mockNotification = {
      id: 'notif-123',
      userId: 'user-123',
      type: 'trade_offer' as const,
      tradeOfferId: 'trade-offer-123',
      read: false,
      createdAt: Timestamp.now(),
      data: {
        offeringUserId: 'user-456',
        offeringUserName: 'John Doe',
        tradeAnchorId: 'item-1',
        tradeAnchorTitle: 'Vintage Camera',
        tradeAnchorImage: 'camera.jpg',
        targetItemId: 'item-2',
        targetItemTitle: 'Retro Bike',
        targetItemImage: 'bike.jpg',
      },
    };

    // Mock accepted trade offer
    const mockAcceptedOffer = {
      id: 'trade-offer-123',
      tradeAnchorId: 'item-1',
      tradeAnchorOwnerId: 'user-456',
      targetItemId: 'item-2',
      targetItemOwnerId: 'user-123',
      offeringUserId: 'user-456',
      status: 'accepted' as const,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Mock conversation
    const mockConversation = {
      id: 'conversation-123',
      tradeOfferId: 'trade-offer-123',
      participantIds: ['user-456', 'user-123'] as [string, string],
      tradeAnchorId: 'item-1',
      targetItemId: 'item-2',
      createdAt: Timestamp.now(),
      lastMessageAt: Timestamp.now(),
      lastMessageText: '',
      unreadCount: {},
    };

    // Setup mocks
    vi.mocked(notificationService.getUserNotifications).mockResolvedValue([mockNotification]);
    vi.mocked(notificationService.markAsRead).mockResolvedValue();
    vi.mocked(tradeOfferService.acceptTradeOffer).mockResolvedValue(mockAcceptedOffer);
    vi.mocked(messagingService.createConversation).mockResolvedValue(mockConversation);

    // Render component
    render(
      <BrowserRouter>
        <NotificationList />
      </BrowserRouter>
    );

    // Wait for notifications to load
    await waitFor(() => {
      expect(screen.getByText('John Doe wants to trade with you!')).toBeDefined();
    });

    // Click Start Conversation button
    const startConversationButton = screen.getByText('Start Conversation');
    await user.click(startConversationButton);

    // Verify the flow
    await waitFor(() => {
      // Notification marked as read
      expect(notificationService.markAsRead).toHaveBeenCalledWith('notif-123');
      
      // Trade offer accepted
      expect(tradeOfferService.acceptTradeOffer).toHaveBeenCalledWith('trade-offer-123', 'user-123');
      
      // Conversation created
      expect(messagingService.createConversation).toHaveBeenCalledWith('trade-offer-123');
      
      // Navigated to conversation
      expect(mockNavigate).toHaveBeenCalledWith('/messages/conversation-123');
    });
  });

  it('should handle errors gracefully when conversation creation fails', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    const mockNotification = {
      id: 'notif-123',
      userId: 'user-123',
      type: 'trade_offer' as const,
      tradeOfferId: 'trade-offer-123',
      read: false,
      createdAt: Timestamp.now(),
      data: {
        offeringUserId: 'user-456',
        offeringUserName: 'John Doe',
        tradeAnchorId: 'item-1',
        tradeAnchorTitle: 'Vintage Camera',
        tradeAnchorImage: 'camera.jpg',
        targetItemId: 'item-2',
        targetItemTitle: 'Retro Bike',
        targetItemImage: 'bike.jpg',
      },
    };

    vi.mocked(notificationService.getUserNotifications).mockResolvedValue([mockNotification]);
    vi.mocked(notificationService.markAsRead).mockResolvedValue();
    vi.mocked(tradeOfferService.acceptTradeOffer).mockRejectedValue(
      new Error('Failed to accept trade offer')
    );

    render(
      <BrowserRouter>
        <NotificationList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe wants to trade with you!')).toBeDefined();
    });

    const startConversationButton = screen.getByText('Start Conversation');
    await user.click(startConversationButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to accept trade offer');
    });

    alertSpy.mockRestore();
  });
});
