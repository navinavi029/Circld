import { useState, useRef, useEffect } from 'react';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { useProfile } from '../contexts/ProfileContext';
import { calculateDistanceForItem, formatDistanceDisplay } from '../utils/location';

interface SwipeCardProps {
  item: Item;
  ownerProfile: UserProfile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const SWIPE_THRESHOLD = 100; // pixels to trigger swipe
const ROTATION_FACTOR = 0.1; // rotation per pixel moved

export function SwipeCard({ item, ownerProfile, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const { profile } = useProfile();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Calculate distance between current user and item owner
  const distance = calculateDistanceForItem(
    profile?.coordinates || null,
    ownerProfile.coordinates
  );
  const distanceDisplay = formatDistanceDisplay(distance, ownerProfile.location);

  // Calculate transform values based on drag position
  const deltaX = dragState.currentX - dragState.startX;
  const deltaY = dragState.currentY - dragState.startY;
  const rotation = deltaX * ROTATION_FACTOR;
  
  // Calculate opacity with fade-out effect
  let opacity = 1;
  if (isAnimatingOut) {
    // Fade out during exit animation
    opacity = 0;
  } else if (dragState.isDragging) {
    // Gradual fade during drag
    opacity = Math.max(0.5, 1 - Math.abs(deltaX) / 300);
  }

  // Determine overlay color and opacity
  const overlayOpacity = Math.min(Math.abs(deltaX) / SWIPE_THRESHOLD, 1);
  const showGreenOverlay = deltaX > 30;
  const showRedOverlay = deltaX < -30;

  // Image navigation
  const nextImage = () => {
    if (item.images && item.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }
  };

  const prevImage = () => {
    if (item.images && item.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragState({
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.isDragging) return;
    const touch = e.touches[0];
    setDragState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }));
  };

  const handleTouchEnd = () => {
    if (!dragState.isDragging) return;
    handleSwipeEnd();
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  };



  // Keyboard handlers for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      animateSwipe('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      animateSwipe('right');
    }
  };

  // Handle swipe completion
  const handleSwipeEnd = () => {
    const swipeDistance = deltaX;
    
    if (Math.abs(swipeDistance) >= SWIPE_THRESHOLD) {
      // Swipe threshold met
      if (swipeDistance > 0) {
        animateSwipe('right');
      } else {
        animateSwipe('left');
      }
    } else {
      // Reset card position
      setDragState(prev => ({
        ...prev,
        isDragging: false,
        currentX: prev.startX,
        currentY: prev.startY,
      }));
    }
  };

  // Animate card off screen and trigger callback
  const animateSwipe = (direction: 'left' | 'right') => {
    const targetX = direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
    
    setIsAnimatingOut(true);
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      currentX: prev.startX + targetX,
    }));

    // Trigger callback immediately - parent will handle timing
    if (direction === 'right') {
      onSwipeRight();
    } else {
      onSwipeLeft();
    }
  };

  // Add/remove mouse event listeners
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setDragState(prev => {
        if (!prev.isDragging) return prev;
        return {
          ...prev,
          currentX: e.clientX,
          currentY: e.clientY,
        };
      });
    };

    const handleUp = () => {
      setDragState(prev => {
        if (!prev.isDragging) return prev;
        
        const swipeDistance = prev.currentX - prev.startX;
        
        if (Math.abs(swipeDistance) >= SWIPE_THRESHOLD) {
          // Swipe threshold met - animate off screen
          const direction = swipeDistance > 0 ? 'right' : 'left';
          const targetX = direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;
          
          setIsAnimatingOut(true);
          
          // Trigger callback immediately - parent will handle timing
          if (direction === 'right') {
            onSwipeRight();
          } else {
            onSwipeLeft();
          }
          
          return {
            ...prev,
            isDragging: false,
            currentX: prev.startX + targetX,
          };
        } else {
          // Reset card position
          return {
            ...prev,
            isDragging: false,
            currentX: prev.startX,
            currentY: prev.startY,
          };
        }
      });
    };

    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
    }
  }, [dragState.isDragging, onSwipeLeft, onSwipeRight]);

  const cardStyle: React.CSSProperties = {
    transform: `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg) scale(${isAnimatingOut ? 0.9 : 1})`,
    opacity,
    transition: dragState.isDragging 
      ? 'none' 
      : isAnimatingOut 
        ? 'transform 0.4s cubic-bezier(0.4, 0, 1, 1), opacity 0.4s cubic-bezier(0.4, 0, 1, 1), scale 0.4s cubic-bezier(0.4, 0, 1, 1)'
        : 'transform 0.3s ease-out, opacity 0.3s ease-out',
    cursor: dragState.isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={cardRef}
      className="relative w-full max-w-md mx-auto select-none"
      style={cardStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Swipe card for ${item.title}. Press left arrow to pass, right arrow to like.`}
    >
      {/* Card Container */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700">
        {/* Image Section */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
          {item.images && item.images.length > 0 ? (
            <>
              <img
                src={item.images[currentImageIndex]}
                alt={item.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
              
              {/* Image Navigation Buttons */}
              {item.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all z-10"
                    aria-label="Previous image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all z-10"
                    aria-label="Next image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Image Dots Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {item.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIndex
                            ? 'bg-white w-6'
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg 
                className="w-24 h-24 text-gray-300 dark:text-gray-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
          )}

          {/* Green Overlay (Right Swipe) - LIKE */}
          {showGreenOverlay && (
            <div 
              className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center pointer-events-none"
              style={{ opacity: overlayOpacity * 0.85 }}
            >
              <div className="transform rotate-12 scale-110">
                <div className="bg-white rounded-2xl px-8 py-4 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-3xl font-black text-green-500">LIKE</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Red Overlay (Left Swipe) - PASS */}
          {showRedOverlay && (
            <div 
              className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center pointer-events-none"
              style={{ opacity: overlayOpacity * 0.85 }}
            >
              <div className="transform -rotate-12 scale-110">
                <div className="bg-white rounded-2xl px-8 py-4 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-3xl font-black text-red-500">PASS</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Condition Badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md text-sm font-bold text-gray-900 dark:text-white rounded-full shadow-lg border border-gray-200 dark:border-gray-700 capitalize">
              {item.condition.replace('-', ' ')}
            </span>
          </div>

          {/* Category Badge */}
          <div className="absolute top-4 right-4 z-10">
            <span className="px-3 py-1.5 bg-accent/95 dark:bg-primary-light/95 backdrop-blur-md text-sm font-bold text-white rounded-full shadow-lg capitalize">
              {item.category}
            </span>
          </div>
        </div>

        {/* Item Details Section */}
        <div className="p-6 space-y-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {item.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 text-base">
            {item.description}
          </p>

          {/* Owner Info */}
          <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              {ownerProfile.photoUrl ? (
                <img
                  src={ownerProfile.photoUrl}
                  alt={`${ownerProfile.firstName} ${ownerProfile.lastName}`}
                  className="w-14 h-14 rounded-full object-cover border-3 border-white dark:border-gray-700 shadow-lg"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent-dark dark:from-primary-light dark:to-primary flex items-center justify-center border-3 border-white dark:border-gray-700 shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {ownerProfile.firstName[0]}{ownerProfile.lastName[0]}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {ownerProfile.firstName} {ownerProfile.lastName}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{distanceDisplay}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swipe Instructions (visible on focus) */}
      <div className="sr-only" aria-live="polite">
        Use arrow keys to swipe. Left arrow to pass, right arrow to like.
      </div>
    </div>
  );
}
