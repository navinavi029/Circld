import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SwipeSession, SwipeRecord } from '../types/swipe-trading';
import { Item } from '../types/item';

interface SwipeHistoryItem extends SwipeRecord {
  item?: Item;
  tradeAnchor?: Item;
  sessionCreatedAt: Date;
}

export function SwipeHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [swipeHistory, setSwipeHistory] = useState<SwipeHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'left' | 'right'>('all');

  useEffect(() => {
    if (user) {
      loadSwipeHistory();
    }
  }, [user]);

  const loadSwipeHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get all swipe sessions for the user
      const sessionsRef = collection(db, 'swipeSessions');
      const q = query(sessionsRef, where('userId', '==', user.uid));
      const sessionsSnapshot = await getDocs(q);

      const allSwipes: SwipeHistoryItem[] = [];

      // Process each session
      for (const sessionDoc of sessionsSnapshot.docs) {
        const session = { id: sessionDoc.id, ...sessionDoc.data() } as SwipeSession;

        // Get trade anchor item
        let tradeAnchor: Item | undefined;
        try {
          const anchorDoc = await getDoc(doc(db, 'items', session.tradeAnchorId));
          if (anchorDoc.exists()) {
            tradeAnchor = { id: anchorDoc.id, ...anchorDoc.data() } as Item;
          }
        } catch (err) {
          console.error('Error loading trade anchor:', err);
        }

        // Process each swipe in the session
        for (const swipe of session.swipes) {
          // Get item details
          let item: Item | undefined;
          try {
            const itemDoc = await getDoc(doc(db, 'items', swipe.itemId));
            if (itemDoc.exists()) {
              item = { id: itemDoc.id, ...itemDoc.data() } as Item;
            }
          } catch (err) {
            console.error('Error loading item:', err);
          }

          allSwipes.push({
            ...swipe,
            item,
            tradeAnchor,
            sessionCreatedAt: session.createdAt.toDate(),
          });
        }
      }

      // Sort by timestamp (newest first)
      allSwipes.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

      setSwipeHistory(allSwipes);
    } catch (err) {
      console.error('Error loading swipe history:', err);
      setError('Failed to load swipe history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = swipeHistory.filter(swipe => {
    if (filter === 'all') return true;
    return swipe.direction === filter;
  });

  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate();
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
      <div className="flex-1 w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1.5">
            Swipe History
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            View all your past swipes and interactions
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            All ({swipeHistory.length})
          </button>
          <button
            onClick={() => setFilter('right')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 ${filter === 'right'
              ? 'bg-green-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            Interested ({swipeHistory.filter(s => s.direction === 'right').length})
          </button>
          <button
            onClick={() => setFilter('left')}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 ${filter === 'left'
              ? 'bg-gray-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Passed ({swipeHistory.filter(s => s.direction === 'left').length})
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={loadSwipeHistory}
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
              No swipe history
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Start swiping to see your history here
            </p>
            <button
              onClick={() => navigate('/swipe-trading')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Start Swiping
            </button>
          </div>
        )}

        {/* Swipe History List */}
        <div className="space-y-4">
          {filteredHistory.map((swipe, index) => (
            <div
              key={`${swipe.itemId}-${swipe.timestamp.toMillis()}-${index}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Item Image */}
                <div className="flex-shrink-0">
                  {swipe.item?.images?.[0] ? (
                    <img
                      src={swipe.item.images[0]}
                      alt={swipe.item.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {swipe.item?.title || 'Unknown Item'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        For: {swipe.tradeAnchor?.title || 'Unknown Item'}
                      </p>
                    </div>

                    {/* Direction Badge */}
                    <div
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium ${swipe.direction === 'right'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                    >
                      {swipe.direction === 'right' ? 'Interested' : 'Passed'}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatDate(swipe.timestamp)}</span>
                    {swipe.item?.category && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{swipe.item.category}</span>
                      </>
                    )}
                    {swipe.item?.condition && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{swipe.item.condition}</span>
                      </>
                    )}
                  </div>

                  {/* View Item Button */}
                  {swipe.item && (
                    <button
                      onClick={() => navigate(`/item/${swipe.item!.id}`)}
                      className="mt-3 text-sm text-primary dark:text-primary-light hover:underline font-medium"
                    >
                      View Item Details →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
