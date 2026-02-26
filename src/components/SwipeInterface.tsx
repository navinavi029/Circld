import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { SwipeCard } from './SwipeCard';
import { TradeAnchorDisplay } from './TradeAnchorDisplay';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { SwipeCardSkeleton } from './SwipeCardSkeleton';

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
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayItem, setDisplayItem] = useState<Item | null>(currentItem);
  const [displayProfile, setDisplayProfile] = useState<UserProfile | null>(ownerProfile);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showDislikeAnimation, setShowDislikeAnimation] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Update display item when not animating
  useEffect(() => {
    if (!isAnimating) {
      if (currentItem) {
        setDisplayItem(currentItem);
        setDisplayProfile(ownerProfile);
      } else if (hasMoreItems) {
        // Keep showing the previous item while loading next one
        // This prevents empty state flash
      } else {
        // No more items - clear display
        setDisplayItem(null);
        setDisplayProfile(null);
      }
    }
  }, [currentItem, ownerProfile, isAnimating, hasMoreItems]);

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



  // Empty state when no items available
  if (!loading && !currentItem && !hasMoreItems) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Trade Anchor Display */}
        <TradeAnchorDisplay item={tradeAnchor} onChangeClick={onChangeAnchor} />

        {/* Return Button - Fixed at top left */}
        <button
          onClick={() => navigate('/listings')}
          className="fixed top-6 left-6 z-20 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-lg border border-white/20 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label="Return to listings"
        >
          <svg
            className="w-5 h-5 text-gray-700 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>

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
            <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-3">
              No Matches Found
            </h2>
            <p className="text-text-secondary dark:text-gray-400 mb-6">
              There are no available items to trade right now. Check back later for new listings, or try changing your trade anchor.
            </p>
            <button
              onClick={onChangeAnchor}
              className="px-6 py-3 bg-gradient-to-r from-accent to-accent-dark dark:from-primary-light dark:to-primary text-white rounded-lg font-medium hover:shadow-lg hover:shadow-accent/30 dark:hover:shadow-primary/30 transition-all"
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
      <div className="flex-1 flex flex-col">
        {/* Trade Anchor Display */}
        <TradeAnchorDisplay item={tradeAnchor} onChangeClick={onChangeAnchor} />

        {/* Return Button - Fixed at top left */}
        <button
          onClick={() => navigate('/listings')}
          className="fixed top-6 left-6 z-20 p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-lg border border-white/20 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label="Return to listings"
        >
          <svg
            className="w-5 h-5 text-gray-700 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>

        {/* Loading State with Skeleton */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md space-y-6">
            <SwipeCardSkeleton />
            <div className="flex justify-center">
              <LoadingSpinner 
                size="md" 
                message="Loading items" 
                showDots={true}
                subtitle="Finding the best matches for you"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Trade Anchor Display - Fixed at bottom left */}
      <TradeAnchorDisplay item={tradeAnchor} onChangeClick={onChangeAnchor} />

      {/* Return Button - Fixed at top left */}
      <button
        onClick={() => navigate('/listings')}
        className="fixed top-6 left-6 z-20 p-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-full shadow-xl border-2 border-gray-200/60 dark:border-gray-700/60 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 hover:shadow-2xl active:scale-95 transition-all duration-300"
        aria-label="Return to listings"
      >
        <svg
          className="w-5 h-5 text-gray-700 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </button>

      {/* Tips Button - Fixed at top right */}
      <button
        onClick={() => setShowTips(!showTips)}
        className="fixed top-6 right-6 z-20 p-3 bg-gradient-to-br from-accent/95 to-accent-dark/95 dark:from-primary-light/95 dark:to-primary/95 backdrop-blur-xl rounded-full shadow-xl border-2 border-white/40 dark:border-gray-700/60 hover:scale-110 hover:shadow-2xl active:scale-95 transition-all duration-300"
        aria-label="Show tips"
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Backdrop - only visible when tips are shown */}
      {showTips && (
        <div
          className="fixed inset-0 z-10 transition-opacity duration-300"
          onClick={() => setShowTips(false)}
          aria-hidden="true"
        />
      )}

      {/* Tips Panel */}
      <div 
        className={`fixed top-20 right-6 z-20 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden transition-all duration-300 ease-out ${
          showTips ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Review Item Details</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Tap the card to see full description and photos</p>
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
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative overflow-y-auto">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 dark:from-primary-light/5 dark:to-accent/5 pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10">
          {/* Main Card */}
          <div className="relative">
            <SwipeCard
              key={displayItem.id}
              item={displayItem}
              ownerProfile={displayProfile}
              onSwipeLeft={() => handleSwipe('left')}
              onSwipeRight={() => handleSwipe('right')}
            />

            {/* Loading Overlay - Shows when next item is being loaded */}
            {!currentItem && hasMoreItems && displayItem && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl flex items-center justify-center z-20 animate-fadeIn">
                <div className="text-center space-y-4">
                  <div className="relative">
                    {/* Animated spinner */}
                    <div className="w-16 h-16 border-4 border-primary/30 dark:border-primary-light/30 border-t-primary dark:border-t-primary-light rounded-full animate-spin mx-auto" />
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 w-16 h-16 border-4 border-primary/20 dark:border-primary-light/20 rounded-full animate-ping mx-auto" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-text dark:text-gray-100">
                      Loading next card
                      <span className="inline-flex ml-1">
                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                      </span>
                    </p>
                    <p className="text-xs text-text-secondary dark:text-gray-400">
                      Finding your next match
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Swipe Action Buttons - Below Card */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <button
              onClick={() => handleSwipe('left')}
              disabled={isAnimating || (!currentItem && hasMoreItems)}
              className="group relative w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-xl border-2 border-red-200 dark:border-red-900/50 hover:border-red-400 dark:hover:border-red-600 hover:scale-110 hover:shadow-2xl hover:shadow-red-500/30 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Pass on this item"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-600/0 group-hover:from-red-500/10 group-hover:to-red-600/10 rounded-full transition-all duration-300" />
              <svg
                className="w-8 h-8 text-red-500 dark:text-red-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={() => handleSwipe('right')}
              disabled={isAnimating || (!currentItem && hasMoreItems)}
              className="group relative w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-full shadow-2xl shadow-green-500/40 hover:shadow-green-500/60 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Like this item"
            >
              <svg
                className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform drop-shadow-lg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-6 text-center">
            <p className="text-xs text-text-secondary dark:text-gray-500 flex items-center justify-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono border border-gray-300 dark:border-gray-700">←</kbd>
              <span>Pass</span>
              <span className="text-gray-400">•</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono border border-gray-300 dark:border-gray-700">→</kbd>
              <span>Like</span>
            </p>
          </div>

          {/* Loading indicator for next items - Enhanced */}
          {hasMoreItems && currentItem && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 dark:from-primary-light/10 dark:via-accent-light/10 dark:to-primary-light/10 backdrop-blur-md rounded-full shadow-lg border border-primary/20 dark:border-primary-light/20">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-primary dark:bg-primary-light rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-primary/50 dark:bg-primary-light/50 rounded-full animate-ping" />
                </div>
                <span className="text-xs font-semibold text-primary dark:text-primary-light">
                  Preparing next cards
                </span>
              </div>
            </div>
          )}

          {/* Loading indicator when no current item but more are coming */}
          {!currentItem && hasMoreItems && !displayItem && (
            <div className="mt-6 flex justify-center">
              <div className="px-6 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-xl border-2 border-primary/30 dark:border-primary-light/30">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-primary/30 dark:border-primary-light/30 border-t-primary dark:border-t-primary-light rounded-full animate-spin" />
                  <span className="text-sm font-bold text-text dark:text-gray-100">
                    Loading cards...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Like Animation - Floating Hearts */}
        {showLikeAnimation && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-floatHeart"
                style={{
                  left: `${50 + (Math.random() - 0.5) * 50}%`,
                  animationDelay: `${i * 0.08}s`,
                  animationDuration: `${1 + Math.random() * 0.5}s`,
                }}
              >
                <svg
                  className="w-10 h-10 text-red-500 drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))',
                  }}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* Dislike Animation - Floating X marks */}
        {showDislikeAnimation && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-floatX"
                style={{
                  left: `${50 + (Math.random() - 0.5) * 50}%`,
                  animationDelay: `${i * 0.08}s`,
                  animationDuration: `${1 + Math.random() * 0.5}s`,
                }}
              >
                <svg
                  className="w-8 h-8 text-red-600 drop-shadow-lg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3.5}
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(220, 38, 38, 0.5))',
                  }}
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


    </div>
  );
}
