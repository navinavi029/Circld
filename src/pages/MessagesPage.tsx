import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserConversationsWithDetails } from '../services/messagingService';
import { ConversationSummary } from '../types/swipe-trading';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { calculateTotalUnreadCountFromSummaries } from '../utils/messagingUtils';

export function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadConversations();
  }, [user, navigate]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user conversations with enriched details
      const enrichedConversations = await getUserConversationsWithDetails(user.uid);

      setConversations(enrichedConversations);

      // Calculate total unread count across all conversations
      const totalUnread = calculateTotalUnreadCountFromSummaries(enrichedConversations);
      setTotalUnreadCount(totalUnread);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load conversations'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    navigate(`/messages/${conversationId}`);
  };

  const formatLastMessageTime = (timestamp: any) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <LoadingSpinner message="Loading conversations..." size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Error Loading Conversations
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={loadConversations}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-text dark:text-gray-100 mb-6">
            Messages
          </h1>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg p-12 text-center border border-white/20 dark:border-gray-700/50">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-text dark:text-gray-100 mb-2">
              No conversations yet
            </h3>
            <p className="text-text-secondary dark:text-gray-400 mb-6">
              Start trading to begin conversations with other users
            </p>
            <button
              onClick={() => navigate('/swipe-trading')}
              className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark dark:from-primary-light dark:to-primary text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Start Trading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-text dark:text-gray-100">
            Messages
          </h1>
          {totalUnreadCount > 0 && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-primary/10 dark:bg-primary-light/20 rounded-lg">
              <div className="w-2 h-2 bg-primary dark:bg-primary-light rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-primary dark:text-primary-light">
                {totalUnreadCount} unread {totalUnreadCount === 1 ? 'message' : 'messages'}
              </span>
            </div>
          )}
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 divide-y divide-gray-100 dark:divide-gray-700/50 overflow-hidden">
          {conversations.map((summary) => (
            <button
              key={summary.conversation.id}
              onClick={() => handleConversationClick(summary.conversation.id)}
              className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left flex items-center space-x-4"
            >
              {/* Trade Item Images */}
              <div className="flex-shrink-0 relative">
                <div className="flex -space-x-2">
                  <img
                    src={summary.tradeAnchorImage}
                    alt={summary.tradeAnchorTitle}
                    className="w-12 h-12 rounded-lg object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                  />
                  <img
                    src={summary.targetItemImage}
                    alt={summary.targetItemTitle}
                    className="w-12 h-12 rounded-lg object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                  />
                </div>
              </div>

              {/* Conversation Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-text dark:text-gray-100 truncate">
                    {summary.partnerName}
                  </h3>
                  <span className="text-xs text-text-secondary dark:text-gray-400 flex-shrink-0 ml-2">
                    {formatLastMessageTime(summary.conversation.lastMessageAt)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary dark:text-gray-400 mb-1">
                  {summary.tradeAnchorTitle} ↔ {summary.targetItemTitle}
                </p>
                <p className="text-sm text-text-secondary dark:text-gray-400 truncate">
                  {summary.conversation.lastMessageText ||
                    'Conversation just started'}
                </p>
              </div>

              {/* Unread Badge */}
              {summary.unreadCount > 0 && (
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-primary dark:bg-primary-light rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {summary.unreadCount > 9 ? '9+' : summary.unreadCount}
                    </span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
