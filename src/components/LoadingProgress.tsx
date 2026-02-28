import { useEffect, useState } from 'react';

interface LoadingProgressProps {
  /** Current loading phase */
  phase: 'creating-session' | 'loading-items' | 'loading-profiles' | 'applying-filters' | 'complete';
  /** Optional custom messages for each phase */
  messages?: {
    'creating-session'?: string;
    'loading-items'?: string;
    'loading-profiles'?: string;
    'applying-filters'?: string;
    'complete'?: string;
  };
  /** Optional progress percentage (0-100) when available */
  progressPercentage?: number;
  /** Show extended wait message after delay */
  showExtendedMessage?: boolean;
}

/**
 * LoadingProgress - Visual progress indicator for multi-step loading
 * Shows progress through different loading phases with smooth animations
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export function LoadingProgress({ 
  phase, 
  messages, 
  progressPercentage,
  showExtendedMessage = false 
}: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);

  const defaultMessages = {
    'creating-session': 'Creating session',
    'loading-items': 'Loading available items',
    'loading-profiles': 'Loading item details',
    'applying-filters': 'Applying filters',
    'complete': 'Ready',
  };

  const phaseMessages = { ...defaultMessages, ...messages };

  const phases = [
    { key: 'creating-session' as const, progress: 25 },
    { key: 'loading-items' as const, progress: 50 },
    { key: 'loading-profiles' as const, progress: 75 },
    { key: 'applying-filters' as const, progress: 90 },
    { key: 'complete' as const, progress: 100 },
  ];

  const currentPhaseIndex = phases.findIndex(p => p.key === phase);
  const targetProgress = progressPercentage !== undefined 
    ? progressPercentage 
    : (currentPhaseIndex >= 0 ? phases[currentPhaseIndex].progress : 0);

  // Animate progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < targetProgress) {
          return Math.min(prev + 2, targetProgress);
        }
        return prev;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [targetProgress]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4 animate-fadeIn">
      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary-light dark:from-primary-light dark:via-accent-light dark:to-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Progress percentage when available */}
      {progressPercentage !== undefined && (
        <div className="text-center">
          <span className="text-sm font-semibold text-primary dark:text-primary-light">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      )}

      {/* Current phase message */}
      <div className="text-center">
        <p className="text-sm font-medium text-text dark:text-gray-100">
          {phaseMessages[phase]}
        </p>
      </div>

      {/* Extended wait message */}
      {showExtendedMessage && (
        <div className="mt-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg animate-fadeIn">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
              This is taking longer than usual
            </p>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Please wait while we complete the operation...
          </p>
        </div>
      )}

      {/* Phase indicators */}
      <div className="flex justify-between items-center pt-2">
        {phases.map((p, index) => {
          const isActive = index <= currentPhaseIndex;
          const isCurrent = index === currentPhaseIndex;

          return (
            <div
              key={p.key}
              className="flex flex-col items-center gap-2 flex-1"
            >
              {/* Circle indicator */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-br from-primary to-accent dark:from-primary-light dark:to-accent-light shadow-lg scale-110'
                    : 'bg-gray-300 dark:bg-gray-600'
                } ${isCurrent ? 'ring-4 ring-primary/30 dark:ring-primary-light/30' : ''}`}
              >
                {isActive ? (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium text-center transition-colors ${
                  isActive
                    ? 'text-text dark:text-gray-100'
                    : 'text-text-secondary dark:text-gray-500'
                }`}
              >
                {phaseMessages[p.key]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
