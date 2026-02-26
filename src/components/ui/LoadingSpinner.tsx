interface LoadingSpinnerProps {
  /** Message describing what is loading */
  message?: string;
  /** Size variant of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to display as fullscreen overlay */
  fullscreen?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Optional subtitle for additional context */
  subtitle?: string;
  /** Show progress dots animation */
  showDots?: boolean;
}

export function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  fullscreen = false,
  className = '',
  subtitle,
  showDots = false,
}: LoadingSpinnerProps) {
  // Size mappings for spinner dimensions
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-12 h-12 border-[3px]',
    lg: 'w-20 h-20 border-4',
  };

  // Size mappings for text
  const textSizeClasses = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-lg sm:text-xl',
  };

  const subtitleSizeClasses = {
    sm: 'text-[10px] sm:text-xs',
    md: 'text-xs sm:text-sm',
    lg: 'text-sm sm:text-base',
  };

  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center gap-5 animate-fadeInFast ${className}`}>
      <div className="relative">
        {/* Outer glow ring - pulsing */}
        <div className={`${sizeClasses[size]} absolute inset-0 border-primary/30 dark:border-primary-light/30 rounded-full animate-ping`} />
        {/* Middle glow ring - slower pulse */}
        <div className={`${sizeClasses[size]} absolute inset-0 border-accent/20 dark:border-accent-light/20 rounded-full animate-ping`} style={{ animationDuration: '1.5s' }} />
        {/* Main spinner with gradient effect */}
        <div
          className={`${sizeClasses[size]} border-transparent rounded-full animate-spin shadow-2xl relative overflow-hidden`}
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, var(--color-primary) 90deg, var(--color-accent) 180deg, transparent 270deg)',
          }}
          role="status"
          aria-live="polite"
          aria-label={message}
        >
          <div className="absolute inset-[3px] bg-white dark:bg-gray-900 rounded-full" />
        </div>
      </div>
      <div className="text-center space-y-2">
        {message && (
          <p className={`${textSizeClasses[size]} text-text dark:text-gray-100 font-bold tracking-wide`}>
            {message}
            {showDots && (
              <span className="inline-flex ml-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            )}
          </p>
        )}
        {subtitle && (
          <p className={`${subtitleSizeClasses[size]} text-text-secondary dark:text-gray-400 max-w-xs`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white/95 via-gray-50/95 to-white/95 dark:from-gray-950/95 dark:via-gray-900/95 dark:to-gray-950/95 backdrop-blur-xl animate-fadeInFast">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
}
