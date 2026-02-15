import { useState, useEffect } from 'react';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { SwipeCard } from './SwipeCard';
import { TradeAnchorDisplay } from './TradeAnchorDisplay';

interface SwipeInterfaceProps {
  tradeAnchor: Item;
  currentItem: Item | null;
  ownerProfile: UserProfile | null;
  onSwipe: (direction: 'left' | 'right') => void;
  onChangeAnchor: () => void;
  hasMoreItems: boolean;
  loading?: boolean;
  syncStatus?: string | null;
}

/**
 * SwipeInterface component integrates SwipeCard and TradeAnchorDisplay
 * to provide the core swipe trading experience.
 * 
 * Responsibilities:
 * - Display current item in swipeable card
 * - Show trade anchor in fixed position
 * - Handle swipe completion and load next item
 * - Show empty state when pool exhausted
 * - Provide button alternatives for swipe actions
 * 
 * Requirements: 2.1, 2.6, 3.4, 3.7
 */
export function SwipeInterface({
  tradeAnchor,
  currentItem,
  ownerProfile,
  onSwipe,
  onChangeAnchor,
  hasMoreItems,
  loading = false,
  syncStatus = null,
}: SwipeInterfaceProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayItem, setDisplayItem] = useState<Item | null>(currentItem);
  const [displayProfile, setDisplayProfile] = useState<UserProfile | null>(ownerProfile);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showDislikeAnimation, setShowDislikeAnimation] = useState(false);

  // Update display item when not animating
  useEffect(() => {
    if (!isAnimating && currentItem) {
      setDisplayItem(currentItem);
      setDisplayProfile(ownerProfile);
    }
  }, [currentItem, ownerProfile, isAnimating]);

  // Handle swipe with animation state
  const handleSwipe = (direction: 'left' | 'right') => {
    setIsAnimating(true);
    
    // Trigger animation based on direction
    if (direction === 'right') {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    } else {
      setShowDislikeAnimation(true);
      setTimeout(() => setShowDislikeAnimation(false), 1000);
    }
    
    // Wait for card animation to complete before updating state
    setTimeout(() => {
      onSwipe(direction);
      setIsAnimating(false);
    }, 450); // Slightly longer than card animation (400ms)
  };

  // Button handlers for accessibility
  const handlePassClick = () => {
    if (!isAnimating && displayItem) {
      handleSwipe('left');
    }
  };

  const handleLikeClick = () => {
    if (!isAnimating && displayItem) {
      handleSwipe('right');
    }
  };

  // Empty state when no items available
  if (!loading && !currentItem && !hasMoreItems) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Trade Anchor Display */}
        <TradeAnchorDisplay item={tradeAnchor} onChangeClick={onChangeAnchor} />

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center px-4 pt-24">
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

  // Loading state
  if (loading || !displayItem || !displayProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Trade Anchor Display */}
        <TradeAnchorDisplay item={tradeAnchor} onChangeClick={onChangeAnchor} />

        {/* Loading State */}
        <div className="flex-1 flex items-center justify-center px-4 pt-24">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-accent dark:border-t-primary-light mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading items...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* Trade Anchor Display - Fixed at top */}
      <TradeAnchorDisplay item={tradeAnchor} onChangeClick={onChangeAnchor} />

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

      {/* Main Swipe Area */}
      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-24 relative overflow-y-auto">
        <div className="w-full max-w-md">
          <SwipeCard
            key={displayItem.id}
            item={displayItem}
            ownerProfile={displayProfile}
            onSwipeLeft={() => handleSwipe('left')}
            onSwipeRight={() => handleSwipe('right')}
          />
        </div>
        
        {/* Like Animation - Floating Hearts */}
        {showLikeAnimation && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-floatHeart"
                style={{
                  left: `${50 + (Math.random() - 0.5) * 40}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.8 + Math.random() * 0.4}s`,
                }}
              >
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            ))}
          </div>
        )}
        
        {/* Dislike Animation - Floating X marks */}
        {showDislikeAnimation && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-floatX"
                style={{
                  left: `${50 + (Math.random() - 0.5) * 40}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.8 + Math.random() * 0.4}s`,
                }}
              >
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Button Controls - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-800 dark:via-gray-800 dark:to-transparent border-t border-gray-200 dark:border-gray-700 px-4 py-4 backdrop-blur-sm">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-4">
            {/* Pass Button */}
            <button
              onClick={handlePassClick}
              disabled={isAnimating}
              className={`group relative w-14 h-14 rounded-full bg-white dark:bg-gray-700 border-2 border-red-500 text-red-500 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg ${
                showDislikeAnimation ? 'animate-pulse' : ''
              }`}
              aria-label="Pass on this item"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Like Button */}
            <button
              onClick={handleLikeClick}
              disabled={isAnimating}
              className={`group relative w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent-dark dark:from-primary-light dark:to-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${
                showLikeAnimation ? 'animate-pulse' : ''
              }`}
              aria-label="Like this item and send trade offer"
            >
              <svg
                className="w-8 h-8"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>

            {/* Info Button */}
            <button
              onClick={() => {/* Could open item details modal */}}
              disabled={isAnimating}
              className="group relative w-12 h-12 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              aria-label="View item details"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
