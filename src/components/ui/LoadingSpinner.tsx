interface LoadingSpinnerProps {
  /** Message describing what is loading */
  message?: string;
  /** Size variant of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to display as fullscreen overlay */
  fullscreen?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  fullscreen = false,
  className = '',
}: LoadingSpinnerProps) {
  // Size mappings for spinner dimensions
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
  };

  // Size mappings for text
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center gap-3 animate-fadeInFast ${className}`}>
      <div
        className={`${sizeClasses[size]} border-primary dark:border-primary-light border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-live="polite"
        aria-label={message}
      />
      {message && (
        <p className={`${textSizeClasses[size]} text-text-secondary dark:text-gray-300 font-medium`}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fadeInFast">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
}
