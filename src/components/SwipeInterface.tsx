import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { SwipeCard } from './SwipeCard';
import { TradeAnchorDisplay } from './TradeAnchorDisplay';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { SwipeCardSkeleton } from './SwipeCardSkeleton';
import { EmptyState, EmptyStateReason } from './EmptyState';
import { useSwipeUndo } from '../hooks/useSwipeUndo';
import { useAuth } from '../contexts/AuthContext';

interface SwipeInterfaceProps {
  tradeAnchor: Item | null;
  currentItem: Item | null;
  ownerProfile: UserProfile | null;
  onSwipe: (direction: 'left' | 'right') => void;
  onChangeAnchor: () => void;
  hasMoreItems: boolean;
  loading?: boolean;
  syncStatus?: string | null;
  sessionId: string;
  onItemRestored?: (item: Item, ownerProfile: UserProfile) => void;
  emptyStateReason?: EmptyStateReason;
  onAdjustFilters?: () => void;
  onRetry?: () => void;
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
  sessionId,
  onItemRestored,
  emptyStateReason = 'default',
  onAdjustFilters,
  onRetry,
}: SwipeInterfaceProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { undoStack, canUndo, addSwipe, undo } = useSwipeUndo();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayItem, setDisplayItem] = useState<Item | null>(currentItem);
  const [displayProfile, setDisplayProfile] = useState<UserProfile | null>(ownerProfile);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showDislikeAnimation, setShowDislikeAnimation] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showUndoButton, setShowUndoButton] = useState(false);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(5); // Countdown timer (Requirement 9.6)
  const [undoCountdownInterval, setUndoCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const [undoFeedback, setUndoFeedback] = useState<string | null>(null);
  const [isUndoing, setIsUndoing] = useState(false); // Track undo animation state
  const [politeAnnouncement, setPoliteAnnouncement] = useState<string>('');
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState<string>('');

  // Update display item when not animating
  useEffect(() => {
    if (!isAnimating) {
      if (currentItem) {
        setDisplayItem(currentItem);
        setDisplayProfile(ownerProfile);
      } else {
        // Clear display immediately when no current item
        setDisplayItem(null);
        setDisplayProfile(null);
      }
    }
  }, [currentItem, ownerProfile, isAnimating]);

  // Handle swipe with animation state
  const handleSwipe = (direction: 'left' | 'right') => {
    setIsAnimating(true);

    // Add swipe to undo stack
    if (displayItem && displayProfile && user) {
      addSwipe({
        item: displayItem,
        ownerProfile: displayProfile,
        direction,
        sessionId,
        userId: user.uid,
        timestamp: Date.now(),
      });

      // Announce swipe action to screen readers
      if (direction === 'right') {
        setPoliteAnnouncement(`Liked ${displayItem.title}`);
      } else {
        setPoliteAnnouncement(`Passed on ${displayItem.title}`);
      }

      // Show undo button for 5 seconds (Requirement 9.1)
      setShowUndoButton(true);
      setUndoCountdown(5); // Reset countdown (Requirement 9.6)
      
      // Clear any existing timers
      if (undoTimer) {
        clearTimeout(undoTimer);
      }
      if (undoCountdownInterval) {
        clearInterval(undoCountdownInterval);
      }

      // Start countdown interval (Requirement 9.6)
      const countdownInterval = setInterval(() => {
        setUndoCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setUndoCountdownInterval(countdownInterval);

      // Set timer to hide button after 5 seconds
      const timer = setTimeout(() => {
        setShowUndoButton(false);
        clearInterval(countdownInterval);
      }, 5000);
      setUndoTimer(timer);
    }

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

  // Handle undo action
  const handleUndo = async () => {
    try {
      setIsUndoing(true); // Start undo animation (Requirement 9.2)
      
      const undoneSwipe = await undo();
      
      if (undoneSwipe && onItemRestored) {
        // Restore the item to the top of the stack with reverse animation (Requirement 9.2)
        onItemRestored(undoneSwipe.item, undoneSwipe.ownerProfile);
        
        // Announce undo to screen readers
        setPoliteAnnouncement(`Undid last swipe, showing ${undoneSwipe.item.title}`);
        
        // Show feedback toast with item title (Requirement 9.3)
        setUndoFeedback(`Undid ${undoneSwipe.direction === 'right' ? 'like' : 'pass'} on "${undoneSwipe.item.title}"`);
        setTimeout(() => setUndoFeedback(null), 3000);
        
        // Hide undo button immediately after use
        setShowUndoButton(false);
        if (undoTimer) {
          clearTimeout(undoTimer);
        }
        if (undoCountdownInterval) {
          clearInterval(undoCountdownInterval);
        }
        
        // Note: Trade offer cancellation (Requirement 9.5) is handled by the removeSwipe
        // function in swipeHistoryService, which deletes the swipe record from the database.
        // This prevents the trade offer from being created if it's still pending.
      }
      
      // Wait for animation to complete
      setTimeout(() => {
        setIsUndoing(false);
      }, 450);
    } catch (_error) {
      // Show error feedback
      setUndoFeedback('Failed to undo swipe. Please try again.');
      setTimeout(() => setUndoFeedback(null), 3000);
      setIsUndoing(false);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (undoTimer) {
        clearTimeout(undoTimer);
      }
      if (undoCountdownInterval) {
        clearInterval(undoCountdownInterval);
      }
    };
  }, [undoTimer, undoCountdownInterval]);

  // Announce empty states to screen readers
  useEffect(() => {
    if (!loading && !currentItem && !hasMoreItems) {
      let announcement: string;
      let isAssertive = false;
      
      switch (emptyStateReason) {
        case 'no-filters-match':
          announcement = 'No items match your current filters. Try adjusting your search criteria.';
          break;
        case 'no-location-match':
          announcement = 'No items found in your area. Try expanding your distance range.';
          break;
        case 'all-swiped':
          announcement = "You've seen all available items. Check back later for new listings.";
          break;
        case 'no-anchor':
          announcement = 'Select an item you want to trade to start swiping.';
          break;
        case 'network-error':
          announcement = 'Unable to load items. Check your connection and try again.';
          isAssertive = true;
          break;
        default:
          announcement = 'There are no available items to trade right now. Check back later for new listings.';
          break;
      }
      
      if (isAssertive) {
        setAssertiveAnnouncement(announcement);
      } else {
        setPoliteAnnouncement(announcement);
      }
    }
  }, [loading, currentItem, hasMoreItems, emptyStateReason]);



  // Empty state when no items available
  if (!loading && !currentItem && !hasMoreItems) {
    // Handle case where no trade anchor is selected
    if (!tradeAnchor) {
      return (
        <div className="flex-1 flex flex-col">
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

          <EmptyState
            reason="no-anchor"
            onChangeAnchor={onChangeAnchor}
          />

          {/* Screen Reader Announcements */}
          <div 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
            className="sr-only"
          >
            {politeAnnouncement}
          </div>
          <div 
            role="alert" 
            aria-live="assertive" 
            aria-atomic="true"
            className="sr-only"
          >
            {assertiveAnnouncement}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col">
        {/* Trade Anchor Display - Floating card */}
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

        {/* Contextual Empty State */}
        <EmptyState
          reason={emptyStateReason}
          onAdjustFilters={onAdjustFilters}
          onChangeAnchor={onChangeAnchor}
          onRetry={onRetry}
        />

        {/* Screen Reader Announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {politeAnnouncement}
        </div>
        <div 
          role="alert" 
          aria-live="assertive" 
          aria-atomic="true"
          className="sr-only"
        >
          {assertiveAnnouncement}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !displayItem || !displayProfile) {
    // Handle case where no trade anchor is selected
    if (!tradeAnchor) {
      return (
        <div className="flex-1 flex flex-col">
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
                  variant="flow"
                />
              </div>
            </div>
          </div>

          {/* Screen Reader Announcements */}
          <div 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
            className="sr-only"
          >
            {politeAnnouncement}
          </div>
          <div 
            role="alert" 
            aria-live="assertive" 
            aria-atomic="true"
            className="sr-only"
          >
            {assertiveAnnouncement}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col">
        {/* Trade Anchor Display - Floating card */}
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
                variant="flow"
                size="md" 
                message="Loading items" 
              />
            </div>
          </div>
        </div>

        {/* Screen Reader Announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {politeAnnouncement}
        </div>
        <div 
          role="alert" 
          aria-live="assertive" 
          aria-atomic="true"
          className="sr-only"
        >
          {assertiveAnnouncement}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Trade Anchor Display - Floating card at bottom left */}
      <TradeAnchorDisplay item={tradeAnchor} onChangeClick={onChangeAnchor} />

      {/* Return Button - Fixed at top left */}
      <motion.button
        onClick={() => navigate('/listings')}
        className="fixed top-6 left-6 z-20 min-w-[48px] min-h-[48px] p-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-full shadow-xl border-2 border-gray-200/60 dark:border-gray-700/60 hover:bg-white dark:hover:bg-gray-700 hover:shadow-2xl transition-all duration-300 touch-action-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary-light focus-visible:ring-offset-2"
        aria-label="Return to listings"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
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
      </motion.button>

      {/* Tips Button - Fixed at top right */}
      <motion.button
        onClick={() => setShowTips(!showTips)}
        className="fixed top-6 right-6 z-20 min-w-[48px] min-h-[48px] p-3 bg-gradient-to-br from-accent/95 to-accent-dark/95 dark:from-primary-light/95 dark:to-primary/95 backdrop-blur-xl rounded-full shadow-xl border-2 border-white/40 dark:border-gray-700/60 hover:shadow-2xl transition-all duration-300 touch-action-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary-light focus-visible:ring-offset-2"
        aria-label={showTips ? "Hide swipe tips" : "Show swipe tips"}
        aria-expanded={showTips}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
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
      </motion.button>

      {/* Backdrop - only visible when tips are shown */}
      {showTips && (
        <div
          className="fixed inset-0 z-10 transition-opacity duration-300"
          onClick={() => setShowTips(false)}
          aria-hidden="true"
        />
      )}

      {/* Tips Panel - Slide down with bounce animation (Requirement 7.5) */}
      <motion.div 
        initial={false}
        animate={showTips ? "visible" : "hidden"}
        variants={{
          hidden: { 
            opacity: 0, 
            y: -20,
            scale: 0.95,
            transition: { duration: 0.2 }
          },
          visible: { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 25,
              mass: 0.8
            }
          }
        }}
        className={`fixed top-20 right-6 z-20 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden ${
          showTips ? '' : 'pointer-events-none'
        }`}
      >
        <div className="bg-gradient-to-r from-accent to-accent-dark dark:from-primary-light dark:to-primary px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Swipe Tips
          </h3>
          <motion.button
            onClick={() => setShowTips(false)}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Close swipe tips"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
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
      </motion.div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-full shadow-2xl animate-slideDown" role="status" aria-live="polite">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
          {/* Main Card or Loading Card */}
          <div className="relative">
            {displayItem && displayProfile ? (
              <>
                {/* Reverse animation wrapper for undo (Requirement 9.2) */}
                <motion.div
                  key={`${displayItem.id}-${isUndoing ? 'undo' : 'normal'}`}
                  initial={isUndoing ? { 
                    x: -300, 
                    opacity: 0, 
                    scale: 0.8,
                    rotate: -15 
                  } : false}
                  animate={{ 
                    x: 0, 
                    opacity: 1, 
                    scale: 1,
                    rotate: 0 
                  }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    duration: 0.4
                  }}
                >
                  <SwipeCard
                    key={displayItem.id}
                    item={displayItem}
                    ownerProfile={displayProfile}
                    onSwipeLeft={() => handleSwipe('left')}
                    onSwipeRight={() => handleSwipe('right')}
                  />
                </motion.div>
              </>
            ) : hasMoreItems ? (
              /* Skeleton Loading Card - matches SwipeCard structure */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full aspect-[3/4] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden"
              >
                {/* Image skeleton with shimmer */}
                <div className="relative h-[60%] bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-shimmer">
                  {/* Image navigation dots skeleton */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-white/40 dark:bg-gray-400/40" />
                    ))}
                  </div>
                </div>

                {/* Content skeleton */}
                <div className="p-6 space-y-4 h-[40%] flex flex-col">
                  {/* Title skeleton */}
                  <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-shimmer" />
                  
                  {/* Description skeleton */}
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-shimmer" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-shimmer" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 animate-shimmer" />
                  </div>
                  
                  {/* Bottom metadata skeleton */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    {/* Owner info skeleton */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-shimmer" />
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-shimmer" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-shimmer" />
                      </div>
                    </div>
                    
                    {/* Badges skeleton */}
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-shimmer" />
                      <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-shimmer" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>

          {/* Swipe Action Buttons - Below Card */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <motion.button
              onClick={() => handleSwipe('left')}
              disabled={isAnimating || (!currentItem && hasMoreItems)}
              className="group relative min-w-[56px] min-h-[56px] w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-xl border-2 border-red-200 dark:border-red-900/50 hover:border-red-400 dark:hover:border-red-600 hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed touch-action-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2"
              aria-label="Pass on this item"
              aria-disabled={isAnimating || (!currentItem && hasMoreItems)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
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
            </motion.button>

            <motion.button
              onClick={() => handleSwipe('right')}
              disabled={isAnimating || (!currentItem && hasMoreItems)}
              className="group relative min-w-[56px] min-h-[56px] w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-full shadow-2xl shadow-green-500/40 hover:shadow-green-500/60 transition-all duration-300 border-2 border-white/30 disabled:opacity-50 disabled:cursor-not-allowed touch-action-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 dark:focus-visible:ring-green-300 focus-visible:ring-offset-2"
              aria-label="Like this item and send trade offer"
              aria-disabled={isAnimating || (!currentItem && hasMoreItems)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform drop-shadow-lg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </motion.button>
          </div>

          {/* Undo Button - Appears for 5 seconds after swipe with countdown timer (Requirements 9.1, 9.6) */}
          {showUndoButton && (
            <div className="flex justify-center mt-4 animate-fadeIn">
              <motion.button
                onClick={handleUndo}
                disabled={!canUndo || isUndoing}
                className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-full shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white/30"
                aria-label={`Undo last swipe${undoStack.length > 0 ? `, ${undoStack.length} swipes available to undo` : ''}, ${undoCountdown} seconds remaining`}
                aria-disabled={!canUndo || isUndoing}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`w-5 h-5 text-white transition-transform duration-300 ${
                      isUndoing ? 'animate-spin' : 'group-hover:rotate-[-30deg]'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                  <span className="text-white font-semibold text-sm">
                    Undo {undoStack.length > 0 && `(${undoStack.length})`}
                  </span>
                  {/* Countdown timer (Requirement 9.6) */}
                  <span className="text-white/80 text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
                    {undoCountdown}s
                  </span>
                </div>
              </motion.button>
            </div>
          )}

          {/* Undo Feedback Toast */}
          {undoFeedback && (
            <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl animate-slideDown" role="status" aria-live="polite">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{undoFeedback}</span>
              </div>
            </div>
          )}

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

        {/* Like Animation - Floating Hearts with burst effect */}
        {showLikeAnimation && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            {/* Central burst effect */}
            <div className="absolute animate-burst">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-400/40 to-emerald-500/40 blur-2xl" />
            </div>
            
            {/* Ripple effect */}
            <div className="absolute animate-ripple">
              <div className="w-40 h-40 rounded-full border-4 border-green-400/60" />
            </div>
            
            {/* Floating hearts */}
            {[...Array(16)].map((_, i) => {
              const angle = (i / 16) * 360;
              const radius = 20 + Math.random() * 30;
              const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
              const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
              
              return (
                <div
                  key={i}
                  className="absolute animate-floatHeart"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: `${1.2 + Math.random() * 0.4}s`,
                  }}
                >
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    style={{
                      filter: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.8))',
                      transform: `scale(${0.8 + Math.random() * 0.6})`,
                    }}
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              );
            })}
            
            {/* Sparkles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={`sparkle-${i}`}
                className="absolute animate-floatHeart"
                style={{
                  left: `${50 + (Math.random() - 0.5) * 60}%`,
                  top: `${50 + (Math.random() - 0.5) * 60}%`,
                  animationDelay: `${i * 0.06}s`,
                  animationDuration: `${1 + Math.random() * 0.3}s`,
                }}
              >
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))',
                  }}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* Dislike Animation - Floating X marks with burst effect */}
        {showDislikeAnimation && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            {/* Central burst effect */}
            <div className="absolute animate-burst">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-400/40 to-red-600/40 blur-2xl" />
            </div>
            
            {/* Ripple effect */}
            <div className="absolute animate-ripple">
              <div className="w-40 h-40 rounded-full border-4 border-red-400/60" />
            </div>
            
            {/* Floating X marks */}
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * 360;
              const radius = 20 + Math.random() * 30;
              const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
              const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
              
              return (
                <div
                  key={i}
                  className="absolute animate-floatX"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: `${1.2 + Math.random() * 0.4}s`,
                  }}
                >
                  <svg
                    className="w-7 h-7 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={4}
                    style={{
                      filter: 'drop-shadow(0 0 10px rgba(220, 38, 38, 0.8))',
                      transform: `scale(${0.8 + Math.random() * 0.5}) rotate(${Math.random() * 360}deg)`,
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              );
            })}
            
            {/* Smoke/dust particles */}
            {[...Array(6)].map((_, i) => (
              <div
                key={`smoke-${i}`}
                className="absolute animate-floatX"
                style={{
                  left: `${50 + (Math.random() - 0.5) * 50}%`,
                  top: `${50 + (Math.random() - 0.5) * 50}%`,
                  animationDelay: `${i * 0.08}s`,
                  animationDuration: `${1.3 + Math.random() * 0.3}s`,
                }}
              >
                <div 
                  className="w-4 h-4 rounded-full bg-gray-400/60 blur-sm"
                  style={{
                    transform: `scale(${1 + Math.random() * 1.5})`,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screen Reader Announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {politeAnnouncement}
      </div>
      <div 
        role="alert" 
        aria-live="assertive" 
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveAnnouncement}
      </div>

    </div>
  );
}

