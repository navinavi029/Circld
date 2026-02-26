import { useEffect, useState } from 'react';

interface LoadingProgressProps {
  /** Current loading phase */
  phase: 'creating-session' | 'loading-items' | 'complete';
  /** Optional custom messages for each phase */
  messages?: {
    'creating-session'?: string;
    'loading-items'?: string;
    'complete'?: string;
  };
}

/**
 * LoadingProgress - Visual progress indicator for multi-step loading
 * Shows progress through different loading phases with smooth animations
 */
export function LoadingProgress({ phase, messages }: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);

  const defaultMessages = {
    'creating-session': 'Creating session',
    'loading-items': 'Loading items',
    'complete': 'Ready',
  };

  const phaseMessages = { ...defaultMessages, ...messages };

  const phases = [
    { key: 'creating-session' as const, progress: 33 },
    { key: 'loading-items' as const, progress: 66 },
    { key: 'complete' as const, progress: 100 },
  ];

  const currentPhaseIndex = phases.findIndex(p => p.key === phase);
  const targetProgress = currentPhaseIndex >= 0 ? phases[currentPhaseIndex].progress : 0;

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

      {/* Phase indicators */}
      <div className="flex justify-between items-center">
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
