import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserConversationsWithDetails } from '../services/messagingService';
import { ConversationSummary } from '../types/swipe-trading';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Pagination } from '../components/ui/Pagination';
import { calculateTotalUnreadCountFromSummaries } from '../utils/messagingUtils';
import { PageTransition } from '../components/PageTransition';
import { getPageBackgroundClasses, getPageTitleClasses, typography, getCardClasses } from '../styles/designSystem';
import { usePageTitle } from '../hooks/usePageTitle';

export function MessagesPage() {
  usePageTitle('Messages');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 10;

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

      console.log('[MessagesPage] Loading conversations for user:', user.uid);

      // Fetch user conversations with enriched details
      const enrichedConversations = await getUserConversationsWithDetails(user.uid);

      console.log('[MessagesPage] Loaded conversations:', {
        count: enrichedConversations.length,
        conversations: enrichedConversations.map(c => ({
          id: c.conversation.id,
          tradeOfferId: c.conversation.tradeOfferId,
          participantIds: c.conversation.participantIds,
          lastMessageText: c.conversation.lastMessageText,
        })),
      });

      setConversations(enrichedConversations);

      // Calculate total unread count across all conversations
      const totalUnread = calculateTotalUnreadCountFromSummaries(enrichedConversations);
      setTotalUnreadCount(totalUnread);
    } catch (err) {
      console.error('[MessagesPage] Error loading conversations:', err);
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
      <div className="flex-1 w-full flex items-center justify-center h-[calc(100vh-4rem)] min-h-[50vh]">
        <LoadingSpinner message="Loading conversations..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 w-full">
        <div className="max-w-4xl mx-auto px-4 py-8 w-full">
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
      <PageTransition variant="page">
        <div className="flex-1 w-full flex flex-col items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 py-8 w-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-text dark:text-gray-100 mb-4 sm:mb-6">
              Messages
            </h1>
            <div className={getCardClasses('glass', 'large')}>
              <div className="text-center">
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
                <h3 className="text-base sm:text-xl font-semibold text-text dark:text-gray-100 mb-2">
                  No conversations yet
                </h3>
                <p className="text-sm sm:text-base text-text-secondary dark:text-gray-400 mb-6">
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
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition variant="page">
      <div className={`flex-1 w-full flex flex-col ${getPageBackgroundClasses()}`}>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
              <div>
                <h1 className={getPageTitleClasses()}>
                  Messages
                </h1>
                <p className={`${typography.subtitle} mt-2 flex items-center gap-2`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
                </p>
              </div>
              {totalUnreadCount > 0 && (
                <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-primary/10 via-primary/15 to-primary/10 dark:from-primary-light/20 dark:via-primary-light/25 dark:to-primary-light/20 rounded-2xl border border-primary/30 dark:border-primary-light/40 shadow-lg shadow-primary/10 dark:shadow-primary-light/10">
                  <div className="relative">
                    <div className="w-3 h-3 bg-primary dark:bg-primary-light rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-3 h-3 bg-primary dark:bg-primary-light rounded-full animate-ping opacity-75" />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-primary dark:text-primary-light">
                    {totalUnreadCount} unread
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Conversations List */}
          <div className={getCardClasses('glass')}>
            {conversations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((summary, index) => (
              <button
                key={summary.conversation.id}
                onClick={() => handleConversationClick(summary.conversation.id)}
                className={`w-full p-5 hover:bg-gradient-to-r hover:from-primary/5 hover:via-primary/10 hover:to-primary/5 dark:hover:from-primary-light/10 dark:hover:via-primary-light/15 dark:hover:to-primary-light/10 transition-all duration-300 text-left flex items-center gap-5 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 group relative overflow-hidden ${
                  summary.unreadCount > 0 ? 'bg-primary/5 dark:bg-primary-light/5' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent dark:via-primary-light/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                {/* Trade Item Images */}
                <div className="flex-shrink-0 relative z-10">
                  <div className="relative">
                    <div className="flex -space-x-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary-light/20 dark:to-accent/20 rounded-2xl blur-md group-hover:blur-lg transition-all" />
                        <img
                          src={summary.tradeAnchorImage || '/placeholder-item.png'}
                          alt={summary.tradeAnchorTitle}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-item.png';
                          }}
                          className="relative w-16 h-16 rounded-2xl object-cover border-3 border-white dark:border-gray-800 shadow-lg group-hover:scale-110 group-hover:rotate-[-5deg] transition-all duration-300"
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 dark:from-accent/20 dark:to-primary-light/20 rounded-2xl blur-md group-hover:blur-lg transition-all" />
                        <img
                          src={summary.targetItemImage || '/placeholder-item.png'}
                          alt={summary.targetItemTitle}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-item.png';
                          }}
                          className="relative w-16 h-16 rounded-2xl object-cover border-3 border-white dark:border-gray-800 shadow-lg group-hover:scale-110 group-hover:rotate-[5deg] transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base sm:text-lg font-bold truncate ${
                        summary.unreadCount > 0 
                          ? 'text-text dark:text-gray-100' 
                          : 'text-text dark:text-gray-100'
                      }`}>
                        {summary.partnerName}
                      </h3>
                      {summary.unreadCount > 0 && (
                        <div className="w-2 h-2 bg-primary dark:bg-primary-light rounded-full animate-pulse" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-text-secondary dark:text-gray-400 flex-shrink-0 ml-3 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                      {formatLastMessageTime(summary.conversation.lastMessageAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/30 rounded-xl w-fit">
                    <p className="text-xs font-medium text-text-secondary dark:text-gray-400 truncate max-w-[120px]">
                      {summary.tradeAnchorTitle}
                    </p>
                    <svg className="w-3.5 h-3.5 text-primary dark:text-primary-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <p className="text-xs font-medium text-text-secondary dark:text-gray-400 truncate max-w-[120px]">
                      {summary.targetItemTitle}
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-text-secondary dark:text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className={`text-sm truncate flex-1 ${
                      summary.unreadCount > 0 
                        ? 'text-text dark:text-gray-100 font-semibold' 
                        : 'text-text-secondary dark:text-gray-400'
                    }`}>
                      {summary.conversation.lastMessageText || 'Start the conversation'}
                    </p>
                  </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3 flex-shrink-0 relative z-10">
                  {/* Unread Badge */}
                  {summary.unreadCount > 0 && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary dark:bg-primary-light rounded-full blur-md opacity-50" />
                      <div className="relative min-w-[28px] h-7 bg-gradient-to-br from-primary to-primary-dark dark:from-primary-light dark:to-primary rounded-full flex items-center justify-center px-2.5 shadow-lg">
                        <span className="text-xs font-bold text-white">
                          {summary.unreadCount > 9 ? '9+' : summary.unreadCount}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Arrow indicator */}
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                    <svg className="w-4 h-4 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {conversations.length > PAGE_SIZE && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(conversations.length / PAGE_SIZE)}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
