import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification, TradeOfferNotificationData } from '../types/swipe-trading';
import { getUserNotifications, markAsRead } from '../services/notificationService';
import { acceptTradeOffer } from '../services/tradeOfferService';
import { createConversation } from '../services/messagingService';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui/LoadingSpinner';

const NotificationList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const userNotifications = await getUserNotifications(user.uid);
        setNotifications(userNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleViewItem = async (notification: Notification, itemId: string) => {
    // Mark notification as read
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }

    // Navigate to item detail page
    window.location.href = `/items/${itemId}`;
  };

  const handleStartConversation = async (notification: Notification) => {
    if (!user) return;

    // Mark notification as read
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    }

    // Get trade offer ID from notification
    const tradeOfferId = notification.tradeOfferId;
    if (!tradeOfferId) {
      alert('Error: Trade offer ID not found');
      return;
    }

    try {
      setAcceptingOfferId(tradeOfferId);

      // Accept the trade offer
      await acceptTradeOffer(tradeOfferId, user.uid);

      // Create conversation for the accepted trade
      const conversation = await createConversation(tradeOfferId);

      // Navigate to the conversation
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      console.error('Error accepting trade offer or creating conversation:', err);
      alert(
        err instanceof Error 
          ? err.message 
          : 'Failed to start conversation. Please try again.'
      );
    } finally {
      setAcceptingOfferId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map(notification => {
        if (notification.type !== 'trade_offer') return null;

        const data = notification.data as TradeOfferNotificationData;

        return (
          <div
            key={notification.id}
            className={`border rounded-lg p-4 ${
              notification.read ? 'bg-white' : 'bg-blue-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {data.offeringUserName} wants to trade with you!
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(notification.createdAt.toMillis()).toLocaleDateString()}
                </p>
              </div>
              {!notification.read && (
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              {/* Their item (trade anchor) */}
              <div className="border rounded p-2">
                <p className="text-xs text-gray-500 mb-1">They're offering:</p>
                <img
                  src={data.tradeAnchorImage}
                  alt={data.tradeAnchorTitle}
                  className="w-full h-24 object-cover rounded mb-2"
                />
                <p className="text-sm font-medium truncate">{data.tradeAnchorTitle}</p>
              </div>

              {/* Your item (target) */}
              <div className="border rounded p-2">
                <p className="text-xs text-gray-500 mb-1">For your:</p>
                <img
                  src={data.targetItemImage}
                  alt={data.targetItemTitle}
                  className="w-full h-24 object-cover rounded mb-2"
                />
                <p className="text-sm font-medium truncate">{data.targetItemTitle}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleViewItem(notification, data.tradeAnchorId)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View Their Item
              </button>
              <button
                onClick={() => handleStartConversation(notification)}
                disabled={acceptingOfferId === notification.tradeOfferId}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {acceptingOfferId === notification.tradeOfferId ? 'Starting...' : 'Start Conversation'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NotificationList;
