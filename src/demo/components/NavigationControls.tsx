import { playSoundEffect, resumeAudioContext } from '../utils/soundEffects';

/**
 * NavigationControls Component
 * 
 * Provides navigation UI for the demo flow including:
 * - Previous/Next buttons
 * - Progress indicator dots
 * - Step counter
 * - Restart button (on last step)
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 6.4, 7.4
 */

export interface NavigationControlsProps {
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Callback for previous button */
  onPrevious: () => void;
  /** Callback for next button */
  onNext: () => void;
  /** Callback for navigating to specific step */
  onGoToStep: (step: number) => void;
  /** Whether previous button should be enabled */
  canGoPrevious: boolean;
  /** Whether next button should be enabled */
  canGoNext: boolean;
  /** Whether navigation is currently blocked (during animations) */
  isAnimating: boolean;
  /** Whether the viewport is in mobile mode (width < 768px) */
  isMobile?: boolean;
  /** Callback for restart button (shown on last step) */
  onRestart?: () => void;
}

/**
 * NavigationControls Component
 * 
 * Renders navigation controls for the demo flow with responsive design.
 * All controls are disabled during animations to prevent navigation conflicts.
 */
export function NavigationControls({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onGoToStep,
  canGoPrevious,
  canGoNext,
  isAnimating,
  isMobile = false,
  onRestart
}: NavigationControlsProps) {
  const isLastStep = currentStep >= totalSteps - 1;

  // Handlers with sound effects
  const handlePrevious = () => {
    resumeAudioContext();
    playSoundEffect('navigation');
    onPrevious();
  };

  const handleNext = () => {
    resumeAudioContext();
    playSoundEffect('navigation');
    onNext();
  };

  const handleGoToStep = (step: number) => {
    resumeAudioContext();
    playSoundEffect('navigation');
    onGoToStep(step);
  };

  const handleRestart = () => {
    resumeAudioContext();
    playSoundEffect('complete');
    onRestart?.();
  };

  return (
    <>
      {/* Bottom Navigation Controls */}
      <div className={`absolute bottom-6 sm:bottom-8 left-0 right-0 flex items-center justify-center ${isMobile ? 'gap-3 px-4' : 'gap-8'}`}>
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious || isAnimating}
          className={`${isMobile ? 'px-4 py-2.5 text-sm' : 'px-7 py-3.5 text-base'} bg-white/15 hover:bg-white/25 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-semibold rounded-full backdrop-blur-md transition-all duration-300 disabled:opacity-40 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-white/20`}
          aria-label="Previous step"
        >
          ← {isMobile ? 'Prev' : 'Previous'}
        </button>

        {/* Progress Indicators - Compact on mobile with many slides */}
        {isMobile && totalSteps > 7 ? (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/15 rounded-full backdrop-blur-md shadow-lg border border-white/20">
            <div className="w-24 h-2 bg-white/25 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-white to-white/90 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
            <span className="text-white/90 text-xs ml-1 font-bold">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
        ) : (
          <div className="flex gap-2.5 px-4 py-2.5 bg-white/15 rounded-full backdrop-blur-md shadow-lg border border-white/20" role="navigation" aria-label="Demo progress">
            {Array.from({ length: totalSteps }, (_, index) => (
              <button
                key={index}
                onClick={() => handleGoToStep(index)}
                disabled={isAnimating}
                className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-white scale-125 shadow-lg shadow-white/50'
                    : 'bg-white/40 hover:bg-white/60 hover:scale-110'
                } ${isAnimating ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                aria-label={`Go to step ${index + 1}`}
                aria-current={index === currentStep ? 'step' : undefined}
              />
            ))}
          </div>
        )}

        {/* Next/Restart Button */}
        {!isLastStep ? (
          <button
            onClick={handleNext}
            disabled={!canGoNext || isAnimating}
            className={`${isMobile ? 'px-4 py-2.5 text-sm' : 'px-7 py-3.5 text-base'} bg-white/15 hover:bg-white/25 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-semibold rounded-full backdrop-blur-md transition-all duration-300 disabled:opacity-40 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-white/20`}
            aria-label="Next step"
          >
            {isMobile ? 'Next' : 'Next'} →
          </button>
        ) : (
          <button
            onClick={handleRestart}
            disabled={isAnimating}
            className={`${isMobile ? 'px-4 py-2.5 text-sm' : 'px-7 py-3.5 text-base'} bg-white/15 hover:bg-white/25 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-semibold rounded-full backdrop-blur-md transition-all duration-300 disabled:opacity-40 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-white/20`}
            aria-label="Restart demo"
          >
            ↻ {isMobile ? 'Restart' : 'Restart'}
          </button>
        )}
      </div>

      {/* Step Counter - Enhanced styling */}
      {!(isMobile && totalSteps > 7) && (
        <div 
          className={`absolute ${isMobile ? 'top-4 right-4 text-sm' : 'top-6 sm:top-8 right-6 sm:right-8 text-base sm:text-lg'} text-white/70 font-semibold bg-white/10 px-4 py-2 rounded-full backdrop-blur-md shadow-lg border border-white/20`}
          aria-live="polite"
          aria-atomic="true"
        >
          {currentStep + 1} / {totalSteps}
        </div>
      )}
    </>
  );
}
