import { useState, useRef, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { useProfile } from '../contexts/ProfileContext';
import { useHaptic } from '../contexts/HapticContext';
import { useAudio } from '../contexts/AudioContext';
import { calculateDistanceForItem, formatDistanceDisplay } from '../utils/location';
import { getResponsiveImageUrl } from '../utils/cloudinary';
import { 
  calculateRotation, 
  calculateDragOpacity, 
  getOverlayState,
  calculateVelocity,
  shouldCompleteSwipe,
  getEntranceConfig
} from '../utils/swipeAnimations';

interface SwipeCardProps {
  item: Item;
  ownerProfile: UserProfile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  compact?: boolean;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
}

const SWIPE_THRESHOLD = 50; // Minimum pixels to trigger swipe (Requirement 11.5)
const SWIPE_DEBOUNCE_MS = 300; // Debounce time to prevent double-triggering (Requirement 11.3)
const VERTICAL_SCROLL_THRESHOLD = 30; // Pixels of vertical movement to cancel swipe (Requirement 11.6)

export const SwipeCard = memo(function SwipeCard({ item, ownerProfile, onSwipeLeft, onSwipeRight, compact = false }: SwipeCardProps) {
  const { profile } = useProfile();
  const { trigger: triggerHaptic } = useHaptic();
  const { play: playSound } = useAudio();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastSwipeTimeRef = useRef<number>(-SWIPE_DEBOUNCE_MS); // Initialize to allow first swipe
  const thresholdReachedRef = useRef<boolean>(false); // Track if threshold haptic was triggered

  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Calculate distance between current user and item owner
  const distance = calculateDistanceForItem(
    profile?.coordinates || null,
    ownerProfile.coordinates
  );
  const distanceDisplay = formatDistanceDisplay(distance, ownerProfile.location);

  // Get responsive image URL for the current image
  const currentImageUrl = item.images && item.images.length > 0
    ? getResponsiveImageUrl(item.images[currentImageIndex], { deviceType: 'auto' })
    : '';

  // Get responsive owner photo URL
  const ownerPhotoUrl = ownerProfile.photoUrl
    ? getResponsiveImageUrl(ownerProfile.photoUrl, { width: 56, height: 56, crop: 'fill' })
    : '';

  // Get condition badge color based on item condition (Requirement 1.5)
  const getConditionColor = (condition: string): string => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-500 text-white border-green-600';
      case 'good':
        return 'bg-blue-500 text-white border-blue-600';
      case 'fair':
        return 'bg-yellow-500 text-white border-yellow-600';
      case 'poor':
        return 'bg-red-500 text-white border-red-600';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
  };

  // Calculate transform values based on drag position using animation utilities
  const deltaX = dragState.currentX - dragState.startX;
  const deltaY = dragState.currentY - dragState.startY;
  const rotation = calculateRotation(deltaX);

  // Calculate opacity with fade-out effect
  let opacity = 1;
  if (isAnimatingOut) {
    // Fade out during exit animation
    opacity = 0;
  } else if (dragState.isDragging) {
    // Gradual fade during drag using animation utility
    opacity = calculateDragOpacity(deltaX);
  }

  // Determine overlay state using animation utility
  const overlayState = getOverlayState(deltaX);
  const showGreenOverlay = overlayState.type === 'like';
  const showRedOverlay = overlayState.type === 'pass';
  const overlayOpacity = overlayState.opacity;

  // Trigger haptic feedback when threshold is reached (Requirement 4.1)
  useEffect(() => {
    if (dragState.isDragging && overlayState.visible && !thresholdReachedRef.current) {
      triggerHaptic('light');
      thresholdReachedRef.current = true;
    } else if (!overlayState.visible) {
      thresholdReachedRef.current = false;
    }
  }, [overlayState.visible, dragState.isDragging, triggerHaptic]);

  // Image navigation
  const nextImage = () => {
    if (item.images && item.images.length > 1) {
      setImageLoaded(false); // Reset loaded state for fade-in animation
      setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
    }
  };

  const prevImage = () => {
    if (item.images && item.images.length > 1) {
      setImageLoaded(false); // Reset loaded state for fade-in animation
      setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
    }
  };

  // Reset image loaded state when item changes
  useEffect(() => {
    setImageLoaded(false);
  }, [item.id, currentImageIndex]);

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent multiple simultaneous drags or swiping after animation started
    if (dragState.isDragging || isAnimatingOut) return;

    const touch = e.touches[0];
    setDragState({
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: Date.now(),
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragState.isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragState.startX;
    const deltaY = touch.clientY - dragState.startY;
    
    // Cancel swipe if vertical scroll is detected (Requirement 11.6)
    if (Math.abs(deltaY) > VERTICAL_SCROLL_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
      console.log('Vertical scroll detected, canceling swipe');
      setDragState(prev => ({
        ...prev,
        isDragging: false,
        currentX: prev.startX,
        currentY: prev.startY,
      }));
      return;
    }
    
    // Prevent default to stop scrolling when horizontal swipe is detected
    if (Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
    
    setDragState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!dragState.isDragging) return;
    
    // Prevent event propagation to avoid triggering button clicks (Requirement 11.1, 11.2)
    e.stopPropagation();
    
    handleSwipeEnd();
  };

  const handleTouchCancel = () => {
    // Handle interrupted touch gesture
    if (!dragState.isDragging) return;

    console.log('Touch gesture interrupted, resetting card position');
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      currentX: prev.startX,
      currentY: prev.startY,
    }));
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent multiple simultaneous drags or swiping after animation started
    if (dragState.isDragging || isAnimatingOut) return;

    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      startTime: Date.now(),
    });
  };



  // Keyboard handlers for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent swiping if already animating out
    if (isAnimatingOut) return;
    
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      animateSwipe('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      animateSwipe('right');
    }
  };

  // Handle swipe completion with velocity check
  const handleSwipeEnd = () => {
    const swipeDistance = deltaX;
    const deltaYAbs = Math.abs(dragState.currentY - dragState.startY);

    // Check if vertical scroll was detected (Requirement 11.6)
    if (deltaYAbs > VERTICAL_SCROLL_THRESHOLD && deltaYAbs > Math.abs(swipeDistance)) {
      console.log('Vertical scroll detected, resetting card');
      setDragState(prev => ({
        ...prev,
        isDragging: false,
        currentX: prev.startX,
        currentY: prev.startY,
      }));
      return;
    }

    // Calculate velocity for velocity-based swipe (Requirement 8.1)
    const deltaTime = Date.now() - dragState.startTime;
    const velocity = calculateVelocity(swipeDistance, deltaTime);

    // Check if swipe should complete (distance or velocity threshold)
    if (shouldCompleteSwipe(swipeDistance, velocity)) {
      // Swipe threshold met - trigger animation
      if (swipeDistance > 0) {
        animateSwipe('right');
      } else {
        animateSwipe('left');
      }
    } else {
      // Reset card position with spring animation
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
    // Prevent duplicate swipes
    if (isAnimatingOut) return;
    
    // Debounce check (Requirement 11.3)
    const now = Date.now();
    if (now - lastSwipeTimeRef.current < SWIPE_DEBOUNCE_MS) {
      console.log('Swipe debounced, ignoring');
      return;
    }
    
    lastSwipeTimeRef.current = now;
    
    const targetX = direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;

    setIsAnimatingOut(true);
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      currentX: prev.startX + targetX,
    }));

    // Trigger haptic and audio feedback (Requirements 4.2, 16.1, 16.2, 16.3)
    triggerHaptic('medium');
    if (direction === 'right') {
      playSound('like');
    } else {
      playSound('pass');
    }

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
        if (!prev.isDragging || isAnimatingOut) return prev;

        const swipeDistance = prev.currentX - prev.startX;

        if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
          // Swipe threshold met - check debounce
          const now = Date.now();
          if (now - lastSwipeTimeRef.current < SWIPE_DEBOUNCE_MS) {
            console.log('Mouse swipe debounced, ignoring');
            return {
              ...prev,
              isDragging: false,
              currentX: prev.startX,
              currentY: prev.startY,
            };
          }
          
          lastSwipeTimeRef.current = now;
          
          // Animate off screen
          const direction = swipeDistance > 0 ? 'right' : 'left';
          const targetX = direction === 'right' ? window.innerWidth * 1.5 : -window.innerWidth * 1.5;

          setIsAnimatingOut(true);

          // Trigger haptic and audio feedback (Requirements 4.2, 16.1, 16.2, 16.3)
          triggerHaptic('medium');
          if (direction === 'right') {
            playSound('like');
          } else {
            playSound('pass');
          }

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

    const handleMouseLeave = (e: MouseEvent) => {
      // Handle interrupted mouse gesture when cursor leaves window
      setDragState(prev => {
        if (!prev.isDragging) return prev;

        // Check if mouse actually left the window (not just the card)
        if (e.clientX <= 0 || e.clientX >= window.innerWidth ||
          e.clientY <= 0 || e.clientY >= window.innerHeight) {
          console.log('Mouse left window during drag, resetting card position');
          return {
            ...prev,
            isDragging: false,
            currentX: prev.startX,
            currentY: prev.startY,
          };
        }
        return prev;
      });
    };

    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [dragState.isDragging, onSwipeLeft, onSwipeRight]);

  const cardStyle: React.CSSProperties = {
    transform: `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg) scale(${isAnimatingOut ? 0.95 : 1}) translateZ(0)`,
    opacity,
    transition: dragState.isDragging
      ? 'none'
      : isAnimatingOut
        ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out'
        : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out',
    cursor: dragState.isDragging ? 'grabbing' : 'grab',
    willChange: dragState.isDragging || isAnimatingOut ? 'transform, opacity' : 'auto',
  };

  // Entrance animation config
  const entranceConfig = getEntranceConfig();

  return (
    <motion.div
      initial={{ scale: entranceConfig.scale.from, opacity: 0 }}
      animate={{ scale: entranceConfig.scale.to, opacity: 1 }}
      transition={{ duration: entranceConfig.duration / 1000 }}
      className={`relative w-full select-none ${compact ? 'h-full' : 'max-w-md mx-auto'}`}
    >
      <div
        ref={cardRef}
        style={cardStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Swipe card for ${item.title}. Press left arrow to pass, right arrow to like.`}
      >
      {/* Card Container - Enhanced with rounded corners and shadows (Requirement 1.1) */}
      {/* Dark mode optimizations: elevated surface colors, softer shadows (Requirements 19.1, 19.3) */}
      <div className={`bg-white dark:bg-gray-800 shadow-2xl dark:shadow-xl dark:shadow-black/30 overflow-hidden border border-gray-200 dark:border-gray-700 ${compact ? 'rounded-2xl h-full flex flex-col' : 'rounded-3xl'} ${dragState.isDragging ? 'shadow-3xl dark:shadow-2xl dark:shadow-black/40 scale-[1.02]' : ''} transition-shadow duration-200`}>
        {/* Image Section with gradient overlay for text readability (Requirement 1.2) */}
        {/* Dark mode: reduced overlay opacity (Requirement 19.2) */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
          {item.images && item.images.length > 0 ? (
            <>
              {/* Image with fade-in animation (Requirement 7.3) and parallax effect (Requirement 7.4) */}
              <motion.img
                key={currentImageUrl}
                src={currentImageUrl}
                alt={item.title}
                className="w-full h-full object-cover dark:brightness-90"
                draggable={false}
                loading="lazy"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ 
                  opacity: imageLoaded ? 1 : 0,
                  scale: imageLoaded ? 1 : 1.1,
                  x: dragState.isDragging ? deltaX * 0.05 : 0 // Parallax effect during drag
                }}
                transition={{ 
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                  x: { duration: 0 } // Instant parallax response
                }}
                onLoad={() => setImageLoaded(true)}
              />
              
              {/* Gradient overlay for better text readability (Requirement 1.2) */}
              {/* Dark mode: reduced opacity by 20% (Requirement 19.2) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 dark:from-black/32 dark:via-transparent dark:to-black/16 pointer-events-none" />

              {/* Image Navigation Buttons */}
              {item.images.length > 1 && (
                <>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      prevImage();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all z-10 ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}
                    aria-label="Previous image"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className={compact ? 'w-4 h-4' : 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </motion.button>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      nextImage();
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all z-10 ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}
                    aria-label="Next image"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className={compact ? 'w-4 h-4' : 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>

                  {/* Image Dots Indicator */}
                  <div className={`absolute left-1/2 -translate-x-1/2 flex gap-1.5 z-10 ${compact ? 'bottom-2' : 'bottom-4'}`}>
                    {item.images.map((_, idx) => (
                      <motion.button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setCurrentImageIndex(idx);
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex
                            ? 'bg-white w-6'
                            : 'bg-white/50 hover:bg-white/75'
                          }`}
                        aria-label={`Go to image ${idx + 1}`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
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
              className="absolute inset-0 bg-gradient-to-br from-green-400/90 to-emerald-600/90 flex items-center justify-center pointer-events-none backdrop-blur-sm"
              style={{ opacity: overlayOpacity * 0.9 }}
            >
              <div className="transform rotate-12 scale-110 animate-bounce">
                <div className="bg-white dark:bg-gray-900 rounded-2xl px-8 py-4 shadow-2xl border-4 border-green-500">
                  <div className="flex items-center gap-3">
                    <svg className="w-12 h-12 text-green-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="text-3xl font-black text-green-500 tracking-wider">LIKE</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Red Overlay (Left Swipe) - PASS */}
          {showRedOverlay && (
            <div
              className="absolute inset-0 bg-gradient-to-br from-red-400/90 to-rose-600/90 flex items-center justify-center pointer-events-none backdrop-blur-sm"
              style={{ opacity: overlayOpacity * 0.9 }}
            >
              <div className="transform -rotate-12 scale-110 animate-bounce">
                <div className="bg-white dark:bg-gray-900 rounded-2xl px-8 py-4 shadow-2xl border-4 border-red-500">
                  <div className="flex items-center gap-3">
                    <svg className="w-12 h-12 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-3xl font-black text-red-500 tracking-wider">PASS</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Condition Badge with color coding (Requirement 1.5) */}
          <div className={`absolute z-10 ${compact ? 'top-2 left-2' : 'top-4 left-4'}`}>
            <span className={`${getConditionColor(item.condition)} backdrop-blur-md font-bold rounded-full shadow-lg border-2 capitalize ${compact ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'}`}>
              {item.condition.replace('-', ' ')}
            </span>
          </div>

          {/* Category Badge - Dark mode: use primary-light for accents (Requirement 19.5) */}
          <div className={`absolute z-10 ${compact ? 'top-2 right-2' : 'top-4 right-4'}`}>
            <span className={`bg-accent dark:bg-primary-light backdrop-blur-md font-bold text-white rounded-full shadow-lg capitalize ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}>
              {item.category}
            </span>
          </div>
        </div>

        {/* Item Details Section */}
        <div className={`space-y-4 bg-gradient-to-b from-white via-gray-50/50 to-gray-50 dark:from-gray-800 dark:via-gray-850/50 dark:to-gray-900 ${compact ? 'p-4 space-y-3' : 'p-6 space-y-4'}`}>
          {/* Title */}
          <h2 className={`font-bold text-gray-900 dark:text-white leading-tight ${compact ? 'text-xl' : 'text-2xl'}`}>
            {item.title}
          </h2>

          {/* Description */}
          <p className={`text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3 ${compact ? 'text-sm line-clamp-2' : 'text-base line-clamp-3'}`}>
            {item.description}
          </p>

          {/* Owner Info with enhanced profile photo styling (Requirement 1.3) */}
          <div className={`border-t-2 border-gray-200 dark:border-gray-700 ${compact ? 'pt-3' : 'pt-4'}`}>
            <div className="flex items-center gap-4">
              {ownerPhotoUrl ? (
                <img
                  src={ownerPhotoUrl}
                  alt={`${ownerProfile.firstName} ${ownerProfile.lastName}`}
                  className={`rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-xl ring-2 ring-gray-200 dark:ring-gray-600 ${compact ? 'w-12 h-12' : 'w-16 h-16'}`}
                  loading="lazy"
                />
              ) : (
                <div className={`rounded-full bg-gradient-to-br from-accent to-accent-dark dark:from-primary-light dark:to-primary flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-xl ring-2 ring-gray-200 dark:ring-gray-600 ${compact ? 'w-12 h-12' : 'w-16 h-16'}`}>
                  <span className={`text-white font-bold ${compact ? 'text-lg' : 'text-2xl'}`}>
                    {ownerProfile.firstName[0]}{ownerProfile.lastName[0]}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-gray-900 dark:text-white truncate ${compact ? 'text-sm' : 'text-base'}`}>
                  {ownerProfile.firstName} {ownerProfile.lastName}
                </p>
                <div className={`flex items-center gap-1.5 text-gray-500 dark:text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
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
      </div>

      {/* Swipe Instructions (visible on focus) */}
      <div className="sr-only" aria-live="polite">
        Use arrow keys to swipe. Left arrow to pass, right arrow to like.
      </div>
    </motion.div>
  );
});
