import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationList from './NotificationList';
import { getUserNotifications, markAsRead } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { Notification, TradeOfferNotificationData } from '../types/swipe-trading';
import { User } from 'firebase/auth';

// Mock the services
vi.mock('../services/notificationService');
vi.mock('../contexts/AuthContext');

const mockGetUserNotifications = vi.mocked(getUserNotifications);
const mockMarkAsRead = vi.mocked(markAsRead);
const mockUseAuth = vi.mocked(useAuth);

describe('NotificationList', () => {
  const mockUser = { uid: 'user123' } as User;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      resetPassword: vi.fn(),
    });
  });

  it('displays loading spinner while fetching notifications', () => {
    mockGetUserNotifications.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<NotificationList />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays error message when fetching fails', async () => {
    mockGetUserNotifications.mockRejectedValue(new Error('Network error'));

    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
    });
  });

  it('displays empty state when no notifications', async () => {
    mockGetUserNotifications.mockResolvedValue([]);

    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
  });

  it('displays trade offer notifications with correct information', async () => {
    const mockNotification: Notification = {
      id: 'notif1',
      userId: 'user123',
      type: 'trade_offer',
      tradeOfferId: 'offer1',
      read: false,
      createdAt: Timestamp.fromDate(new Date('2024-01-15')),
      data: {
        offeringUserId: 'user456',
        offeringUserName: 'John Doe',
        tradeAnchorId: 'item1',
        tradeAnchorTitle: 'Vintage Camera',
        tradeAnchorImage: 'https://example.com/camera.jpg',
        targetItemId: 'item2',
        targetItemTitle: 'Retro Bike',
        targetItemImage: 'https://example.com/bike.jpg',
      } as TradeOfferNotificationData,
    };

    mockGetUserNotifications.mockResolvedValue([mockNotification]);

    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe wants to trade with you!')).toBeInTheDocument();
      expect(screen.getByText("They're offering:")).toBeInTheDocument();
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
      expect(screen.getByText('For your:')).toBeInTheDocument();
      expect(screen.getByText('Retro Bike')).toBeInTheDocument();
    });
  });

  it('shows unread indicator for unread notifications', async () => {
    const mockNotification: Notification = {
      id: 'notif1',
      userId: 'user123',
      type: 'trade_offer',
      tradeOfferId: 'offer1',
      read: false,
      createdAt: Timestamp.now(),
      data: {
        offeringUserId: 'user456',
        offeringUserName: 'John Doe',
        tradeAnchorId: 'item1',
        tradeAnchorTitle: 'Camera',
        tradeAnchorImage: 'https://example.com/camera.jpg',
        targetItemId: 'item2',
        targetItemTitle: 'Bike',
        targetItemImage: 'https://example.com/bike.jpg',
      } as TradeOfferNotificationData,
    };

    mockGetUserNotifications.mockResolvedValue([mockNotification]);

    render(<NotificationList />);

    await waitFor(() => {
      const notification = screen.getByText('John Doe wants to trade with you!').closest('div')?.parentElement?.parentElement;
      expect(notification).toHaveClass('bg-blue-50');
    });
  });

  it('marks notification as read when viewing item', async () => {
    const mockNotification: Notification = {
      id: 'notif1',
      userId: 'user123',
      type: 'trade_offer',
      tradeOfferId: 'offer1',
      read: false,
      createdAt: Timestamp.now(),
      data: {
        offeringUserId: 'user456',
        offeringUserName: 'John Doe',
        tradeAnchorId: 'item1',
        tradeAnchorTitle: 'Camera',
        tradeAnchorImage: 'https://example.com/camera.jpg',
        targetItemId: 'item2',
        targetItemTitle: 'Bike',
        targetItemImage: 'https://example.com/bike.jpg',
      } as TradeOfferNotificationData,
    };

    mockGetUserNotifications.mockResolvedValue([mockNotification]);
    mockMarkAsRead.mockResolvedValue();

    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText('View Their Item')).toBeInTheDocument();
    });

    const viewButton = screen.getByText('View Their Item');
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith('notif1');
    });
  });

  it('marks notification as read when starting conversation', async () => {
    const mockNotification: Notification = {
      id: 'notif1',
      userId: 'user123',
      type: 'trade_offer',
      tradeOfferId: 'offer1',
      read: false,
      createdAt: Timestamp.now(),
      data: {
        offeringUserId: 'user456',
        offeringUserName: 'John Doe',
        tradeAnchorId: 'item1',
        tradeAnchorTitle: 'Camera',
        tradeAnchorImage: 'https://example.com/camera.jpg',
        targetItemId: 'item2',
        targetItemTitle: 'Bike',
        targetItemImage: 'https://example.com/bike.jpg',
      } as TradeOfferNotificationData,
    };

    mockGetUserNotifications.mockResolvedValue([mockNotification]);
    mockMarkAsRead.mockResolvedValue();

    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText('Start Conversation')).toBeInTheDocument();
    });

    const conversationButton = screen.getByText('Start Conversation');
    fireEvent.click(conversationButton);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith('notif1');
      expect(alertSpy).toHaveBeenCalledWith(
        'Conversation feature coming soon! You would start a conversation with John Doe'
      );
    });

    alertSpy.mockRestore();
  });

  it('does not mark already read notifications as read again', async () => {
    const mockNotification: Notification = {
      id: 'notif1',
      userId: 'user123',
      type: 'trade_offer',
      tradeOfferId: 'offer1',
      read: true, // Already read
      createdAt: Timestamp.now(),
      data: {
        offeringUserId: 'user456',
        offeringUserName: 'John Doe',
        tradeAnchorId: 'item1',
        tradeAnchorTitle: 'Camera',
        tradeAnchorImage: 'https://example.com/camera.jpg',
        targetItemId: 'item2',
        targetItemTitle: 'Bike',
        targetItemImage: 'https://example.com/bike.jpg',
      } as TradeOfferNotificationData,
    };

    mockGetUserNotifications.mockResolvedValue([mockNotification]);
    mockMarkAsRead.mockResolvedValue();

    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;

    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText('View Their Item')).toBeInTheDocument();
    });

    const viewButton = screen.getByText('View Their Item');
    fireEvent.click(viewButton);

    // Should not call markAsRead since notification is already read
    await waitFor(() => {
      expect(mockMarkAsRead).not.toHaveBeenCalled();
    });
  });

  it('displays multiple notifications', async () => {
    const mockNotifications: Notification[] = [
      {
        id: 'notif1',
        userId: 'user123',
        type: 'trade_offer',
        tradeOfferId: 'offer1',
        read: false,
        createdAt: Timestamp.now(),
        data: {
          offeringUserId: 'user456',
          offeringUserName: 'John Doe',
          tradeAnchorId: 'item1',
          tradeAnchorTitle: 'Camera',
          tradeAnchorImage: 'https://example.com/camera.jpg',
          targetItemId: 'item2',
          targetItemTitle: 'Bike',
          targetItemImage: 'https://example.com/bike.jpg',
        } as TradeOfferNotificationData,
      },
      {
        id: 'notif2',
        userId: 'user123',
        type: 'trade_offer',
        tradeOfferId: 'offer2',
        read: true,
        createdAt: Timestamp.now(),
        data: {
          offeringUserId: 'user789',
          offeringUserName: 'Jane Smith',
          tradeAnchorId: 'item3',
          tradeAnchorTitle: 'Guitar',
          tradeAnchorImage: 'https://example.com/guitar.jpg',
          targetItemId: 'item4',
          targetItemTitle: 'Laptop',
          targetItemImage: 'https://example.com/laptop.jpg',
        } as TradeOfferNotificationData,
      },
    ];

    mockGetUserNotifications.mockResolvedValue(mockNotifications);

    render(<NotificationList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe wants to trade with you!')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith wants to trade with you!')).toBeInTheDocument();
    });
  });
});
