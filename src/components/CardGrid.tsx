import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { SwipeCard } from './SwipeCard';
import { useRef, useEffect, useState, memo } from 'react';

interface CardGridProps {
  items: Item[];
  ownerProfiles: Map<string, UserProfile>;
  onSwipe: (itemId: string, direction: 'left' | 'right') => void;
  animatingCards: Set<string>;
  loadingSlots: number;
  loadingError?: string | null;
}

export const CardGrid = memo(function CardGrid({ 
  items, 
  ownerProfiles, 
  onSwipe, 
  animatingCards,
  loadingSlots,
  loadingError = null
}: CardGridProps) {
  const [focusedCardIndex, setFocusedCardIndex] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Handle keyboard navigation between cards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (items.length === 0) return;

      // Arrow key navigation between cards
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
          e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        
        // Check if we're already focused on a card
        const activeElement = document.activeElement;
        const isCardFocused = cardRefs.current.some(ref => 
          ref && (ref === activeElement || ref.contains(activeElement))
        );

        if (!isCardFocused) return; // Let individual cards handle their own arrow keys

        // Calculate grid dimensions based on viewport
        const width = window.innerWidth;
        let columns = 2; // default mobile portrait
        if (width >= 1280) columns = 3; // desktop
        else if (width >= 768) columns = 2; // tablet
        else if (width >= 640) columns = 3; // mobile landscape

        let newIndex = focusedCardIndex;

        switch (e.key) {
          case 'ArrowRight':
            if ((focusedCardIndex + 1) % columns !== 0 && focusedCardIndex < items.length - 1) {
              newIndex = focusedCardIndex + 1;
              e.preventDefault();
            }
            break;
          case 'ArrowLeft':
            if (focusedCardIndex % columns !== 0) {
              newIndex = focusedCardIndex - 1;
              e.preventDefault();
            }
            break;
          case 'ArrowDown':
            if (focusedCardIndex + columns < items.length) {
              newIndex = focusedCardIndex + columns;
              e.preventDefault();
            }
            break;
          case 'ArrowUp':
            if (focusedCardIndex - columns >= 0) {
              newIndex = focusedCardIndex - columns;
              e.preventDefault();
            }
            break;
        }

        if (newIndex !== focusedCardIndex) {
          setFocusedCardIndex(newIndex);
          cardRefs.current[newIndex]?.focus();
          
          // Announce card navigation to screen readers
          const item = items[newIndex];
          setAnnouncement(`Focused on card ${newIndex + 1} of ${items.length}: ${item.title}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, focusedCardIndex]);

  // Handle swipe with screen reader announcement
  const handleSwipeWithAnnouncement = (itemId: string, direction: 'left' | 'right', itemTitle: string) => {
    const action = direction === 'right' ? 'liked' : 'passed';
    setAnnouncement(`${itemTitle} ${action}. ${items.length - 1} cards remaining.`);
    onSwipe(itemId, direction);
  };

  // Render loading placeholder
  const renderLoadingPlaceholder = (index: number) => {
    // If there's a loading error, show error state instead of loading
    if (loadingError) {
      return (
        <div
          key={`loading-error-${index}`}
          className="card-grid-item animate-fade-in"
          style={{
            animationDelay: `${index * 50}ms`,
          }}
          role="alert"
          aria-label="Error loading card"
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border-2 border-red-200 dark:border-red-800">
            <div className="aspect-[4/3] bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center">
              <div className="text-center p-6">
                <svg
                  className="w-16 h-16 mx-auto text-red-400 dark:text-red-600 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Failed to load card
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Normal loading state
    return (
      <div
        key={`loading-${index}`}
        className="card-grid-item animate-fade-in"
        style={{
          animationDelay: `${index * 50}ms`,
        }}
        role="status"
        aria-label="Loading card"
      >
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 animate-pulse relative">
          {/* Image skeleton */}
          <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 relative">
            {/* Loading spinner overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-600 border-t-accent dark:border-t-primary-light rounded-full animate-spin" />
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="p-6 space-y-4">
            {/* Title skeleton */}
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4" />
            
            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            </div>
            
            {/* Badges skeleton */}
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
            
            {/* Owner skeleton */}
            <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Loading text */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <span className="sr-only">Loading card...</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="card-grid-container">
      {/* Screen reader announcements */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {announcement}
      </div>

      <div 
        className="card-grid"
        role="group"
        aria-label="Swipeable item cards"
      >
        {/* Render actual cards */}
        {items.map((item, index) => {
          const ownerProfile = ownerProfiles.get(item.ownerId);
          if (!ownerProfile) return null;

          const isAnimating = animatingCards.has(item.id);

          return (
            <div
              key={item.id}
              ref={el => { cardRefs.current[index] = el; }}
              className={`card-grid-item ${isAnimating ? 'animate-fade-out' : 'animate-fade-in'}`}
              style={{
                animationDelay: isAnimating ? '0ms' : `${index * 50}ms`,
              }}
              tabIndex={0}
              role="article"
              aria-label={`Card ${index + 1} of ${items.length}: ${item.title} by ${ownerProfile.firstName} ${ownerProfile.lastName}`}
              onFocus={() => setFocusedCardIndex(index)}
            >
              <SwipeCard
                item={item}
                ownerProfile={ownerProfile}
                onSwipeLeft={() => handleSwipeWithAnnouncement(item.id, 'left', item.title)}
                onSwipeRight={() => handleSwipeWithAnnouncement(item.id, 'right', item.title)}
                compact={true}
              />
            </div>
          );
        })}

        {/* Render loading placeholders */}
        {Array.from({ length: loadingSlots }).map((_, index) => 
          renderLoadingPlaceholder(index)
        )}
      </div>

      <style>{`
        .card-grid-container {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 1rem;
        }

        .card-grid {
          display: grid;
          gap: 1rem;
          width: 100%;
          max-width: 100%;
          touch-action: none; /* Prevent browser gestures during swipe */
        }

        /* Desktop: 3 columns, up to 5 cards */
        @media (min-width: 1280px) {
          .card-grid {
            grid-template-columns: repeat(3, 1fr);
            max-width: 1400px;
            gap: 1.5rem;
          }
        }

        /* Tablet: 2 columns, up to 4 cards */
        @media (min-width: 768px) and (max-width: 1279px) {
          .card-grid {
            grid-template-columns: repeat(2, 1fr);
            max-width: 900px;
            gap: 1.25rem;
          }
        }

        /* Mobile landscape: 3 columns, up to 3 cards */
        @media (min-width: 640px) and (max-width: 767px) {
          .card-grid {
            grid-template-columns: repeat(3, 1fr);
            max-width: 700px;
            gap: 0.75rem;
          }
        }

        /* Mobile portrait: 2 columns, minimum 2 cards */
        @media (max-width: 639px) {
          .card-grid {
            grid-template-columns: repeat(2, 1fr);
            max-width: 500px;
            gap: 0.75rem;
          }
        }

        .card-grid-item {
          width: 100%;
          height: 100%;
        }

        /* Entrance animation: fade + scale - GPU accelerated with transform and opacity */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateZ(0);
          }
          to {
            opacity: 1;
            transform: scale(1) translateZ(0);
          }
        }

        /* Exit animation: slide + fade - GPU accelerated with transform and opacity */
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1) translateZ(0);
          }
          to {
            opacity: 0;
            transform: translateY(20px) scale(0.95) translateZ(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          will-change: transform, opacity;
        }

        .animate-fade-out {
          animation: fadeOut 0.3s cubic-bezier(0.4, 0, 1, 1) forwards;
          will-change: transform, opacity;
        }

        /* Ensure cards maintain aspect ratio and don't overflow */
        .card-grid-item > div {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
});
