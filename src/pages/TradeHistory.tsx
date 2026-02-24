import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, or } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Pagination } from '../components/ui/Pagination';
import { PageTransition } from '../components/PageTransition';
import { TradeOffer } from '../types/swipe-trading';
import { Item } from '../types/item';

interface EnrichedTradeHistory extends TradeOffer {
  tradeAnchorTitle: string;
  tradeAnchorImage: string;
  targetItemTitle: string;
  targetItemImage: string;
  partnerName: string;
  isOffering: boolean;
}

export function TradeHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tradeHistory, setTradeHistory] = useState<EnrichedTradeHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'accepted' | 'completed' | 'declined'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 10;

  useEffect(() => {
    if (user) {
      loadTradeHistory();
    }
  }, [user]);

  const loadTradeHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get all trade offers where user is either offering or receiving
      const tradeOffersRef = collection(db, 'tradeOffers');
      const q = query(
        tradeOffersRef,
        or(
          where('offeringUserId', '==', user.uid),
          where('targetItemOwnerId', '==', user.uid)
        )
      );

      const querySnapshot = await getDocs(q);
      const allTrades: EnrichedTradeHistory[] = [];

      // Process each trade offer
      for (const tradeDoc of querySnapshot.docs) {
        const trade = { id: tradeDoc.id, ...tradeDoc.data() } as TradeOffer;

        try {
          // Fetch trade anchor item
          const tradeAnchorDoc = await getDoc(doc(db, 'items', trade.tradeAnchorId));
          const tradeAnchorData = tradeAnchorDoc.exists() ? tradeAnchorDoc.data() as Item : null;

          // Fetch target item
          const targetItemDoc = await getDoc(doc(db, 'items', trade.targetItemId));
          const targetItemData = targetItemDoc.exists() ? targetItemDoc.data() as Item : null;

          // Determine partner (the other user in the trade)
          const isOffering = trade.offeringUserId === user.uid;
          const partnerId = isOffering ? trade.targetItemOwnerId : trade.offeringUserId;

          // Fetch partner user info
          const partnerDoc = await getDoc(doc(db, 'users', partnerId));
          const partnerData = partnerDoc.exists() ? partnerDoc.data() : null;

          allTrades.push({
            ...trade,
            tradeAnchorTitle: tradeAnchorData?.title || 'Unknown Item',
            tradeAnchorImage: tradeAnchorData?.images?.[0] || '/placeholder-item.png',
            targetItemTitle: targetItemData?.title || 'Unknown Item',
            targetItemImage: targetItemData?.images?.[0] || '/placeholder-item.png',
            partnerName: partnerData
              ? `${partnerData.firstName || ''} ${partnerData.lastName || ''}`.trim() || 'Unknown User'
              : 'Unknown User',
            isOffering,
          });
        } catch (err) {
          console.error('Error enriching trade:', err);
        }
      }

      // Sort by updated date (newest first)
      allTrades.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() ?? 0;
        const bTime = b.updatedAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });

      setTradeHistory(allTrades);
    } catch (err) {
      console.error('Error loading trade history:', err);
      setError('Failed to load trade history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = tradeHistory.filter(trade => {
    if (filter === 'all') return true;
    return trade.status === filter;
  });

  const formatDate = (timestamp: any) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            Accepted
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            Completed
          </span>
        );
      case 'declined':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
            Declined
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 w-full bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner message="Loading trade history..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <PageTransition variant="page">
      <div className="flex-1 w-full flex flex-col">
        <div className="container mx-auto px-4 py-6 max-w-7xl flex-1">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-accent via-accent-dark to-primary bg-clip-text text-transparent dark:from-primary-light dark:via-primary dark:to-accent-dark leading-tight pb-0.5">
              Trade History
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary dark:text-gray-400 mt-1">
              View all your past and current trades
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => { setFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${filter === 'all'
                ? 'bg-gradient-to-r from-accent to-accent-dark dark:from-primary-light dark:to-primary text-white shadow-md'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
            >
              All ({tradeHistory.length})
            </button>
            <button
              onClick={() => { setFilter('accepted'); setCurrentPage(1); }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${filter === 'accepted'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
            >
              Accepted ({tradeHistory.filter(t => t.status === 'accepted').length})
            </button>
            <button
              onClick={() => { setFilter('completed'); setCurrentPage(1); }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${filter === 'completed'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
            >
              Completed ({tradeHistory.filter(t => t.status === 'completed').length})
            </button>
            <button
              onClick={() => { setFilter('declined'); setCurrentPage(1); }}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${filter === 'declined'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
            >
              Declined ({tradeHistory.filter(t => t.status === 'declined').length})
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={loadTradeHistory}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {filteredHistory.length === 0 && !error && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
              <h3 className="mt-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                No trade history
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Start trading to see your history here
              </p>
              <button
                onClick={() => navigate('/swipe-trading')}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Start Trading
              </button>
            </div>
          )}

          {/* Trade History List */}
          <div className="space-y-4">
            {filteredHistory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((trade) => (
              <div
                key={trade.id}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 hover:shadow-xl hover:shadow-primary/10 hover:border-accent/40 dark:hover:border-primary-light/40 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  {/* Trade Direction Indicator */}
                  <div className="flex-shrink-0 pt-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trade.isOffering
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-purple-100 dark:bg-purple-900/30'
                      }`}>
                      <svg
                        className={`w-5 h-5 ${trade.isOffering
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-purple-600 dark:text-purple-400'
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={trade.isOffering
                            ? "M7 16V4m0 0L3 8m4-4l4 4"
                            : "M17 8v12m0 0l4-4m-4 4l-4-4"
                          }
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${trade.isOffering
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-purple-600 dark:text-purple-400'
                            }`}>
                            {trade.isOffering ? 'You offered' : 'Received offer'}
                          </span>
                          {getStatusBadge(trade.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          With {trade.partnerName}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDate(trade.updatedAt)}
                      </span>
                    </div>

                    {/* Trade Items */}
                    <div className="flex items-center gap-3 mb-3">
                      {/* Trade Anchor (Offered Item) */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                          src={trade.tradeAnchorImage}
                          alt={trade.tradeAnchorTitle}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {trade.tradeAnchorTitle}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {trade.isOffering ? 'Your item' : 'Their item'}
                          </p>
                        </div>
                      </div>

                      {/* Swap Icon */}
                      <div className="flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                      </div>

                      {/* Target Item */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <img
                          src={trade.targetItemImage}
                          alt={trade.targetItemTitle}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {trade.targetItemTitle}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {trade.isOffering ? 'Their item' : 'Your item'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {(trade.status === 'accepted' || trade.status === 'completed') && (
                      <button
                        onClick={() => navigate(`/messages`)}
                        className="text-sm text-primary dark:text-primary-light hover:underline font-medium"
                      >
                        View Messages →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredHistory.length > PAGE_SIZE && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredHistory.length / PAGE_SIZE)}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
