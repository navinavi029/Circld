import { useState, useEffect, useRef } from 'react';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { CardGrid } from './CardGrid';
import { TradeAnchorDisplay } from './TradeAnchorDisplay';

interface MultiCardSwipeInterfaceProps {
  tradeAnchor: Item;
  itemPool: Item[];
  ownerProfiles: Map<string, UserProfile>;
  onSwipe: (itemId: string, direction: 'left' | 'right') => void;
  onChangeAnchor: () => void;
  loading: boolean;
  syncStatus: string | null;
  loadingError?: string | null;
}

/**
 * MultiCardSwipeInterface component displays multiple cards simultaneously
 * and manages the multi-card swipe trading experience.
 * 
 * Responsibilities:
 * - Determines how many cards to show based on viewport size
 * - Manages the visible subset of the item pool
 * - Coordinates animations for card entrance/exit
 * - Provides loading states for individual card positions
 * - Maintains tips panel and trade anchor display
 * 
 * Requirements: 2.1, 2.5, 3.4, 9.2
 */
export function MultiCardSwipeInterface({
  tradeAnchor,
  itemPool,
  ownerProfiles,
  onSwipe,
  onChangeAnchor,
  loading,
  syncStatus,
  loadingError = null,
}: MultiCardSwipeInterfaceProps) {
  const [visibleCardCount, setVisibleCardCount] = useState(3);
  const [showTips, setShowTips] = useState(false);
  const [animatingCards, setAnimatingCards] = useState<Set<string>>(new Set());
  const animationTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Determine visible card count based on viewport size
  useEffect(() => {
    const updateCardCount = () => {
      const width = window.innerWidth;
      
      if (width >= 1280) {
        // Desktop: 5 cards
        setVisibleCardCount(5);
      } else if (width >= 768) {
        // Tablet: 4 cards
        setVisibleCardCount(4);
      } else if (width >= 640) {
        // Mobile landscape: 3 cards
        setVisibleCardCount(3);
      } else {
        // Mobile portrait: 2 cards
        setVisibleCardCount(2);
      }
    };

    // Initial calculation
    updateCardCount();

    // Debounced resize handler with animation protection
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      
      resizeTimer = setTimeout(() => {
        // Wait for animations to complete before recalculating layout
        if (animatingCards.size === 0) {
          updateCardCount();
        } else {
          // Retry after animations complete
          const checkAnimations = setInterval(() => {
            if (animatingCards.size === 0) {
              clearInterval(checkAnimations);
              updateCardCount();
            }
          }, 100);
          
          // Force update after 1 second even if animations haven't completed
          setTimeout(() => {
            clearInterval(checkAnimations);
            updateCardCount();
          }, 1000);
        }
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [animatingCards.size]);

  // Handle card swipe with animation and timeout
  const handleCardSwipe = (itemId: string, direction: 'left' | 'right') => {
    // Add card to animating set
    setAnimatingCards(prev => new Set(prev).add(itemId));

    // Set animation timeout (600ms max as per design spec)
    const timeoutId = setTimeout(() => {
      console.log(`Animation timeout for card ${itemId}, forcing completion`);
      
      // Force complete animation
      onSwipe(itemId, direction);
      
      // Remove from animating set
      setAnimatingCards(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      
      // Clean up timeout reference
      animationTimeoutsRef.current.delete(itemId);
    }, 600);
    
    // Store timeout reference
    animationTimeoutsRef.current.set(itemId, timeoutId);

    // Wait for animation to complete before calling parent callback
    setTimeout(() => {
      // Clear the timeout if animation completes normally
      const timeout = animationTimeoutsRef.current.get(itemId);
      if (timeout) {
        clearTimeout(timeout);
        animationTimeoutsRef.current.delete(itemId);
      }
      
      onSwipe(itemId, direction);
      
      // Remove from animating set after callback
      setAnimatingCards(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }, 400); // Match card exit animation duration
  };

  // Cleanup animation timeouts on unmount
  useEffect(() => {
    return () => {
      animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      animationTimeoutsRef.current.clear();
    };
  }, []);

  // Get visible items (first N items from pool)
  const visibleItems = itemPool.slice(0, visibleCardCount);
  
  // Calculate loading slots (if we have fewer items than card count)
  // Show loading placeholders when:
  // 1. Initial loading (loading=true)
  // 2. Cards are being replaced after swipe (animating cards exist and pool is smaller than card count)
  const hasAnimatingCards = animatingCards.size > 0;
  const shouldShowLoading = loading || (hasAnimatingCards && visibleItems.length < visibleCardCount);
  const loadingSlots = shouldShowLoading ? Math.max(0, visibleCardCount - visibleItems.length) : 0;

  // Empty state when no items available
  if (!loading && itemPool.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Trade Anchor Display */}
        <TradeAnchorDisplay item={tradeAnchor} onChangeClick={onChangeAnchor} />

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <svg
                className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No Matches Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There are no available items to trade right now. Check back later for new listings, or try changing your trade anchor.
            </p>
            <button
              onClick={onChangeAnchor}
              className="px-6 py-3 bg-accent dark:bg-primary-light text-white rounded-lg font-medium hover:bg-accent-dark dark:hover:bg-primary transition-colors"
            >
              Change Trade Anchor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* Trade Anchor Display - Fixed at bottom left */}
      <TradeAnchorDisplay item={tradeAnchor} onChangeClick={onChangeAnchor} />

      {/* Tips Button - Fixed at top right */}
      <button
        onClick={() => setShowTips(!showTips)}
        className="fixed top-6 right-6 z-20 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform"
        aria-label="Show tips"
      >
        <svg
          className="w-5 h-5 text-accent dark:text-primary-light"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Tips Panel */}
      {showTips && (
        <div className="fixed top-20 right-6 z-20 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-accent dark:border-primary-light overflow-hidden animate-slideDown">
          <div className="bg-gradient-to-r from-accent to-accent-dark dark:from-primary-light dark:to-primary px-4 py-3 flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Swipe Tips
            </h3>
            <button
              onClick={() => setShowTips(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="Close tips"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Swipe Right to Like</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Send a trade offer for items you're interested in</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Swipe Left to Pass</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Skip items that don't interest you</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Multiple Cards</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Swipe any card independently to browse efficiently</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Change Your Item</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Click the card in the bottom-left to trade a different item</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Quick Swiping</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Swipe fast to browse more items quickly</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for tips panel */}
      {showTips && (
        <div
          className="fixed inset-0 bg-black/20 z-10"
          onClick={() => setShowTips(false)}
        />
      )}

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full shadow-2xl animate-slideDown">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="font-semibold">{syncStatus}</span>
          </div>
        </div>
      )}

      {/* Main Card Grid Area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative overflow-y-auto">
        <CardGrid
          items={visibleItems}
          ownerProfiles={ownerProfiles}
          onSwipe={handleCardSwipe}
          animatingCards={animatingCards}
          loadingSlots={loadingSlots}
          loadingError={loadingError}
        />
      </div>
    </div>
  );
}
