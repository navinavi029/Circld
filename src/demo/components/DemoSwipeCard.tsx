import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SwipeCard } from '../../components/SwipeCard';
import { useDemoData } from '../contexts/DemoDataContext';
import { executeSwipeSimulation } from '../utils/simulatedInteractions';

/**
 * DemoSwipeCard Component
 * 
 * Wrapper component that integrates SwipeCard with demo data and simulated interactions.
 * Uses useDemoData hook to get demo items and users, then passes them to the real SwipeCard component.
 * Implements simulated swipe interaction on mount with visual hints.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.7, 8.1, 8.2, 8.3
 */

interface DemoSwipeCardProps {
  /** Delay in milliseconds before starting the swipe simulation */
  simulationDelay?: number;
  /** Duration in milliseconds for the swipe animation */
  simulationDuration?: number;
  /** Callback function when swipe simulation completes */
  onSimulationComplete?: () => void;
  /** Whether to enable the simulated swipe interaction */
  enableSimulation?: boolean;
  /** Whether the viewport is in mobile mode (width < 768px) */
  isMobile?: boolean;
  /** Whether this is an instant display (revisiting the slide) */
  instant?: boolean;
}

export const DemoSwipeCard: React.FC<DemoSwipeCardProps> = ({
  simulationDelay = 2000,
  simulationDuration = 800,
  onSimulationComplete,
  enableSimulation = true,
  isMobile = false,
  instant = false,
}) => {
  const { items, users } = useDemoData();
  const cardRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [showHints, setShowHints] = useState(!instant);
  const [isSwiping, setIsSwiping] = useState(false);

  // Get the first item and its owner for the demo
  const demoItem = items[1]; // Guitar (index 1 from design doc)
  const demoOwner = users[1]; // Jordan (index 1 from design doc)

  useEffect(() => {
    if (!enableSimulation || !cardRef.current || instant) return;

    // Hide hints before swipe starts
    const hideHintsTimer = setTimeout(() => {
      setShowHints(false);
    }, simulationDelay - 200);

    // Show swiping state
    const swipeStartTimer = setTimeout(() => {
      setIsSwiping(true);
    }, simulationDelay);

    // Execute swipe simulation after mount
    cleanupRef.current = executeSwipeSimulation(
      cardRef.current,
      {
        delay: simulationDelay,
        duration: simulationDuration,
        onComplete: () => {
          setIsSwiping(false);
          onSimulationComplete?.();
        },
      }
    );

    // Cleanup on unmount
    return () => {
      clearTimeout(hideHintsTimer);
      clearTimeout(swipeStartTimer);
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [simulationDelay, simulationDuration, onSimulationComplete, enableSimulation, instant]);

  // Touch gesture handling for mobile
  useEffect(() => {
    if (!isMobile || !cardRef.current) return;

    const element = cardRef.current;
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Only trigger swipe if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          handleSwipeRight();
        } else {
          handleSwipeLeft();
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

  // No-op handlers for demo (interactions are simulated)
  const handleSwipeLeft = () => {
    // Demo mode - no actual action needed
  };

  const handleSwipeRight = () => {
    // Demo mode - no actual action needed
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Swipe Hints */}
      <AnimatePresence>
        {showHints && !instant && (
          <>
            {/* Left hint */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-10"
            >
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{ x: [-10, 0, -10] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-4xl sm:text-5xl"
                >
                  👈
                </motion.div>
                <div className="bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                  <span className="text-white font-semibold text-xs sm:text-sm">Pass</span>
                </div>
              </div>
            </motion.div>

            {/* Right hint */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-10"
            >
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{ x: [10, 0, 10] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-4xl sm:text-5xl"
                >
                  👉
                </motion.div>
                <div className="bg-emerald-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                  <span className="text-white font-semibold text-xs sm:text-sm">Like</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Swiping indicator */}
      <AnimatePresence>
        {isSwiping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-8 right-8 z-20 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-xl font-bold text-sm sm:text-base"
          >
            ❤️ Liked!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <div ref={cardRef} className="relative z-0">
        <SwipeCard
          item={demoItem}
          ownerProfile={demoOwner}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
      </div>
    </div>
  );
};
