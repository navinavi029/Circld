import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_FLOW_STEPS, FlowStep } from '../config/flowSteps';
import { DemoErrorBoundary } from './DemoErrorBoundary';

/**
 * DemoFlowController Props
 */
export interface DemoFlowControllerProps {
  /** Enable automatic advancement between steps */
  autoAdvance?: boolean;
  /** Delay in milliseconds before auto-advancing (default: 5000ms) */
  autoAdvanceDelay?: number;
}

/**
 * DemoFlowState Interface
 * 
 * Tracks the current state of the demo flow presentation.
 */
interface DemoFlowState {
  /** Current step index (0-based) */
  currentStep: number;
  /** Direction of navigation (1 = forward, -1 = backward) */
  direction: 1 | -1;
  /** Whether a transition animation is in progress */
  isAnimating: boolean;
  /** Set of step indices that have been fully viewed/completed */
  completedSteps: Set<number>;
  /** Whether the demo is paused */
  isPaused: boolean;
}

/**
 * Debounce utility for resize events
 */
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * DemoFlowController Component
 * 
 * Main orchestrator component that manages the demo flow state and coordinates
 * all sub-components. Handles auto-advance timing and tracks visited steps 
 * for instant vs animated text display.
 * 
 * Requirements: 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 7.3, 7.5
 */
export function DemoFlowController({
  autoAdvance = false,
  autoAdvanceDelay = 5000
}: DemoFlowControllerProps) {
  // State management
  const [state, setState] = useState<DemoFlowState>({
    currentStep: 0,
    direction: 1,
    isAnimating: false,
    completedSteps: new Set(), // Empty - no steps completed yet
    isPaused: false
  });

  // Responsive layout state
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Refs for timers and cleanup
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Clear auto-advance timer
   */
  const clearAutoAdvanceTimer = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, []);

  /**
   * Navigate to next step
   */
  const nextStep = useCallback(() => {
    setState(prev => {
      // Block navigation during animations
      if (prev.isAnimating) {
        return prev;
      }

      // Check if we're at the last step
      if (prev.currentStep >= DEMO_FLOW_STEPS.length - 1) {
        return prev;
      }

      // Clear auto-advance timer on manual navigation
      clearAutoAdvanceTimer();

      // Mark current step as completed when moving forward
      const newCompletedSteps = new Set(prev.completedSteps);
      newCompletedSteps.add(prev.currentStep);

      // Update state
      const newStep = prev.currentStep + 1;

      // Clear animation flag after transition
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      animationTimeoutRef.current = setTimeout(() => {
        setState(s => ({ ...s, isAnimating: false }));
      }, 500); // Match transition duration

      return {
        ...prev,
        currentStep: newStep,
        direction: 1,
        isAnimating: true,
        completedSteps: newCompletedSteps
      };
    });
  }, [clearAutoAdvanceTimer]);

  /**
   * Navigate to previous step
   */
  const prevStep = useCallback(() => {
    setState(prev => {
      // Block navigation during animations
      if (prev.isAnimating) {
        return prev;
      }

      // Check if we're at the first step
      if (prev.currentStep <= 0) {
        return prev;
      }

      // Clear auto-advance timer on manual navigation
      clearAutoAdvanceTimer();

      // Clear animation flag after transition
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      animationTimeoutRef.current = setTimeout(() => {
        setState(s => ({ ...s, isAnimating: false }));
      }, 500); // Match transition duration

      // Update state
      return {
        ...prev,
        currentStep: prev.currentStep - 1,
        direction: -1,
        isAnimating: true
      };
    });
  }, [clearAutoAdvanceTimer]);

  /**
   * Setup auto-advance timer
   */
  useEffect(() => {
    // Don't auto-advance if disabled, animating, or paused
    if (!autoAdvance || state.isAnimating || state.isPaused) {
      return;
    }

    // Don't auto-advance on last step
    if (state.currentStep >= DEMO_FLOW_STEPS.length - 1) {
      return;
    }

    // Get current step configuration
    const currentStepConfig = DEMO_FLOW_STEPS[state.currentStep];
    
    // Calculate delay: use the maximum of autoAdvanceDelay and minDisplayDuration
    const delay = Math.max(autoAdvanceDelay, currentStepConfig.minDisplayDuration);

    // Set timer
    autoAdvanceTimerRef.current = setTimeout(() => {
      nextStep();
    }, delay);

    // Cleanup
    return () => {
      clearAutoAdvanceTimer();
    };
  }, [autoAdvance, autoAdvanceDelay, state.currentStep, state.isAnimating, state.isPaused, nextStep, clearAutoAdvanceTimer]);

  /**
   * Setup keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'Enter':
          event.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          prevStep();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nextStep, prevStep]);

  /**
   * Setup responsive layout detection with debounced resize listener
   * Requirements: 6.1, 6.2
   */
  useEffect(() => {
    const handleResize = debounce(() => {
      setIsMobile(window.innerWidth < 768);
    }, 300);

    // Initial check
    setIsMobile(window.innerWidth < 768);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      clearAutoAdvanceTimer();
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [clearAutoAdvanceTimer]);

  // Get current step configuration
  const currentStepConfig: FlowStep = DEMO_FLOW_STEPS[state.currentStep];
  const StepComponent = currentStepConfig.component;

  // Determine if current step has been visited before (for instant text display)
  // Only instant if the step was previously completed
  const isRevisit = state.completedSteps.has(state.currentStep);

  // Special exit animation for swipe card slide (slide 5 - index 4)
  const isLeavingSwipeSlide = state.currentStep === 4 && state.direction === 1;

  // Animation variants for step transitions
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      rotate: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      rotate: 0
    },
    exit: (direction: number) => {
      // Special swipe-right exit for slide 5 when moving forward
      if (isLeavingSwipeSlide) {
        return {
          x: 1500,
          opacity: 0,
          rotate: 15,
          scale: 0.9
        };
      }
      // Normal exit for other slides
      return {
        x: direction > 0 ? -1000 : 1000,
        opacity: 0,
        rotate: 0
      };
    }
  };

  return (
    <div className="relative w-full h-full">
      <AnimatePresence initial={false} custom={state.direction} mode="wait">
        <motion.div
          key={state.currentStep}
          custom={state.direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={
            isLeavingSwipeSlide
              ? {
                  x: { type: "spring", stiffness: 200, damping: 25 },
                  opacity: { duration: 0.3 },
                  rotate: { duration: 0.4 },
                  scale: { duration: 0.4 }
                }
              : {
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }
          }
          className="w-full h-full"
        >
          <DemoErrorBoundary
            stepName={currentStepConfig.title}
            onSkipStep={nextStep}
          >
            <StepComponent
              {...currentStepConfig.componentProps}
              title={currentStepConfig.title}
              description={currentStepConfig.description}
              instant={isRevisit}
              isMobile={isMobile}
            />
          </DemoErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
