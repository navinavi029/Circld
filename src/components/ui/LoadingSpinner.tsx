interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'gradient' | 'orbit' | 'bars' | 'flow' | 'ripple' | 'wave';
  message?: string;
  className?: string;
}

/**
 * LoadingSpinner component for displaying loading states
 * Features multiple ultra-stylish variants with smooth animations
 * Inherits text color from parent for theme consistency
 */
export const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'flow',
  message,
  className = '' 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const dotSizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2.5 w-2.5',
    lg: 'h-3.5 w-3.5',
    xl: 'h-5 w-5',
  };

  const messageSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex items-center gap-2">
            <div 
              className={`${dotSizeClasses[size]} rounded-full bg-gradient-to-br from-primary via-accent to-primary-dark shadow-xl shadow-primary/60 dark:shadow-primary-light/60 animate-bounce`}
              style={{ animationDelay: '0ms', animationDuration: '0.8s' }}
            />
            <div 
              className={`${dotSizeClasses[size]} rounded-full bg-gradient-to-br from-accent via-primary-dark to-primary shadow-xl shadow-accent/60 dark:shadow-accent-light/60 animate-bounce`}
              style={{ animationDelay: '120ms', animationDuration: '0.8s' }}
            />
            <div 
              className={`${dotSizeClasses[size]} rounded-full bg-gradient-to-br from-primary-dark via-primary to-accent shadow-xl shadow-primary-dark/60 dark:shadow-primary/60 animate-bounce`}
              style={{ animationDelay: '240ms', animationDuration: '0.8s' }}
            />
          </div>
        );

      case 'pulse':
        return (
          <div className="relative">
            {/* Multiple expanding rings */}
            <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary via-accent to-primary-dark animate-ping absolute opacity-30 blur-md`} style={{ animationDuration: '1.5s' }} />
            <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary via-accent to-primary-dark animate-ping absolute opacity-20 blur-lg`} style={{ animationDuration: '2s' }} />
            {/* Main pulsing circle */}
            <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary via-accent to-primary-dark relative shadow-2xl shadow-primary/60 dark:shadow-primary-light/60`}>
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/30 to-transparent animate-pulse" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-0 rounded-full bg-gradient-to-bl from-transparent to-white/10" />
            </div>
          </div>
        );

      case 'orbit':
        return (
          <div className={`${sizeClasses[size]} relative`}>
            {/* Center dot with pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`${dotSizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/60 dark:shadow-primary-light/60 animate-pulse`} style={{ animationDuration: '2s' }} />
            </div>
            {/* Orbiting dots with trails */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${dotSizeClasses[size]} rounded-full bg-gradient-to-br from-accent to-primary-dark shadow-xl shadow-accent/60 dark:shadow-accent-light/60`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
              </div>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDelay: '0.66s' }}>
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${dotSizeClasses[size]} rounded-full bg-gradient-to-br from-primary-dark to-primary shadow-xl shadow-primary-dark/60 dark:shadow-primary/60`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
              </div>
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDelay: '1.33s' }}>
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${dotSizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-accent-dark shadow-xl shadow-primary/60 dark:shadow-primary-light/60`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
              </div>
            </div>
            {/* Orbital path hint */}
            <div className="absolute inset-0 rounded-full border border-primary/10 dark:border-primary-light/10" />
          </div>
        );

      case 'bars':
        return (
          <div className="flex items-end gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="relative"
                style={{
                  width: size === 'sm' ? '3px' : size === 'md' ? '4px' : size === 'lg' ? '5px' : '6px',
                }}
              >
                <div
                  className="rounded-full bg-gradient-to-t from-primary via-accent to-primary-dark shadow-lg shadow-primary/60 dark:shadow-primary-light/60"
                  style={{
                    animation: 'barPulse 1.2s ease-in-out infinite',
                    animationDelay: `${i * 0.12}s`,
                    height: size === 'sm' ? '8px' : size === 'md' ? '12px' : size === 'lg' ? '16px' : '20px',
                  }}
                />
                {/* Glow effect */}
                <div
                  className="absolute inset-0 rounded-full bg-gradient-to-t from-primary/50 via-accent/50 to-primary-dark/50 blur-sm"
                  style={{
                    animation: 'barPulse 1.2s ease-in-out infinite',
                    animationDelay: `${i * 0.12}s`,
                  }}
                />
              </div>
            ))}
          </div>
        );

      case 'flow':
        return (
          <div className="relative">
            {/* Multi-layered flowing gradient spinner with liquid effect */}
            <svg
              className={`${sizeClasses[size]} relative`}
              style={{ animation: 'spin 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <defs>
                {/* Primary flowing gradient */}
                <linearGradient id="flow-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }}>
                    <animate attributeName="stop-color" values="#10b981; #14b8a6; #2dd4bf; #059669; #10b981" dur="4s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="50%" style={{ stopColor: '#14b8a6', stopOpacity: 0.9 }}>
                    <animate attributeName="stop-color" values="#14b8a6; #2dd4bf; #059669; #10b981; #14b8a6" dur="4s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }}>
                    <animate attributeName="stop-color" values="#059669; #10b981; #14b8a6; #2dd4bf; #059669" dur="4s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
                
                {/* Dark mode flowing gradient */}
                <linearGradient id="flow-gradient-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#34d399', stopOpacity: 1 }}>
                    <animate attributeName="stop-color" values="#34d399; #2dd4bf; #5eead4; #10b981; #34d399" dur="4s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="50%" style={{ stopColor: '#2dd4bf', stopOpacity: 0.9 }}>
                    <animate attributeName="stop-color" values="#2dd4bf; #5eead4; #10b981; #34d399; #2dd4bf" dur="4s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }}>
                    <animate attributeName="stop-color" values="#10b981; #34d399; #2dd4bf; #5eead4; #10b981" dur="4s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
                
                {/* Enhanced glow filter */}
                <filter id="flow-glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feComposite in="coloredBlur" in2="SourceAlpha" operator="in" result="monoBlur"/>
                  <feMerge>
                    <feMergeNode in="monoBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                
                {/* Shimmer effect */}
                <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: 'white', stopOpacity: 0 }} />
                  <stop offset="50%" style={{ stopColor: 'white', stopOpacity: 0.3 }}>
                    <animate attributeName="offset" values="0; 1; 0" dur="2s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" style={{ stopColor: 'white', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              
              {/* Background circle with subtle pulse */}
              <circle
                className="opacity-5"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              
              {/* Primary flowing arc - thicker and more prominent */}
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="url(#flow-gradient-1)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="45 55"
                filter="url(#flow-glow)"
                className="dark:hidden"
                style={{ animation: 'flowDash 2.5s ease-in-out infinite' }}
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="url(#flow-gradient-dark)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="45 55"
                filter="url(#flow-glow)"
                className="hidden dark:block"
                style={{ animation: 'flowDash 2.5s ease-in-out infinite' }}
              />
              
              {/* Secondary arc for depth - counter-rotating */}
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="url(#flow-gradient-1)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="25 75"
                opacity="0.5"
                className="dark:hidden"
                style={{ animation: 'flowDash 3s ease-in-out infinite reverse' }}
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="url(#flow-gradient-dark)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="25 75"
                opacity="0.5"
                className="hidden dark:block"
                style={{ animation: 'flowDash 3s ease-in-out infinite reverse' }}
              />
              
              {/* Shimmer overlay */}
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="url(#shimmer)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="60 40"
                opacity="0.6"
              />
            </svg>
            
            {/* Multi-layered ambient glow */}
            <div className={`${sizeClasses[size]} absolute inset-0 rounded-full bg-gradient-to-br from-primary/15 via-accent/15 to-primary-dark/15 blur-xl`} style={{ animation: 'pulse 3s ease-in-out infinite' }} />
            <div className={`${sizeClasses[size]} absolute inset-0 rounded-full bg-gradient-to-tr from-accent/10 via-primary/10 to-accent-dark/10 blur-2xl`} style={{ animation: 'pulse 3s ease-in-out infinite 0.5s' }} />
          </div>
        );

      case 'ripple':
        return (
          <div className={`${sizeClasses[size]} relative`}>
            {/* Enhanced ripple effect with expanding circles and color fade */}
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full border-2"
                style={{
                  animation: `ripple 3s cubic-bezier(0, 0.2, 0.8, 1) infinite`,
                  animationDelay: `${i * 0.5}s`,
                  opacity: 0,
                  borderImage: 'linear-gradient(135deg, #10b981, #14b8a6, #059669) 1',
                }}
              />
            ))}
            {/* Center dot with pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`${dotSizeClasses[size]} rounded-full bg-gradient-to-br from-primary via-accent to-primary-dark shadow-2xl shadow-primary/60 dark:shadow-primary-light/60 animate-pulse`} style={{ animationDuration: '2s' }} />
            </div>
            {/* Inner glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`${dotSizeClasses[size]} rounded-full bg-gradient-to-br from-primary/50 via-accent/50 to-primary-dark/50 blur-sm animate-pulse`} style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
            </div>
          </div>
        );

      case 'wave':
        return (
          <div className="relative">
            <svg
              className={`${sizeClasses[size]} relative`}
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <defs>
                {/* Enhanced wave gradient with more color stops */}
                <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#10b981' }}>
                    <animate attributeName="offset" values="-0.5; 1.5; -0.5" dur="3s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="25%" style={{ stopColor: '#14b8a6' }}>
                    <animate attributeName="offset" values="0; 1.75; 0" dur="3s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="50%" style={{ stopColor: '#2dd4bf' }}>
                    <animate attributeName="offset" values="0.5; 2; 0.5" dur="3s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="75%" style={{ stopColor: '#059669' }}>
                    <animate attributeName="offset" values="1; 2.25; 1" dur="3s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" style={{ stopColor: '#10b981' }}>
                    <animate attributeName="offset" values="1.5; 2.5; 1.5" dur="3s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
                <linearGradient id="wave-gradient-dark" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#34d399' }}>
                    <animate attributeName="offset" values="-0.5; 1.5; -0.5" dur="3s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="25%" style={{ stopColor: '#2dd4bf' }}>
                    <animate attributeName="offset" values="0; 1.75; 0" dur="3s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="50%" style={{ stopColor: '#5eead4' }}>
                    <animate attributeName="offset" values="0.5; 2; 0.5" dur="3s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="75%" style={{ stopColor: '#10b981' }}>
                    <animate attributeName="offset" values="1; 2.25; 1" dur="3s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" style={{ stopColor: '#34d399' }}>
                    <animate attributeName="offset" values="1.5; 2.5; 1.5" dur="3s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
                <filter id="wave-glow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Rotating wave circle with glow */}
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="url(#wave-gradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="63"
                filter="url(#wave-glow)"
                className="dark:hidden"
                style={{ animation: 'spin 2s linear infinite' }}
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="url(#wave-gradient-dark)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="63"
                filter="url(#wave-glow)"
                className="hidden dark:block"
                style={{ animation: 'spin 2s linear infinite' }}
              />
              
              {/* Background circle */}
              <circle
                className="opacity-10"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            {/* Ambient glow */}
            <div className={`${sizeClasses[size]} absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 via-accent/10 to-primary-dark/10 blur-lg animate-pulse`} style={{ animationDuration: '3s' }} />
          </div>
        );

      case 'gradient':
        return (
          <div className="relative">
            {/* Outer glow ring */}
            <div className={`${sizeClasses[size]} absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary-dark/20 blur-md animate-pulse`} />
            
            {/* Main spinner */}
            <svg
              className={`${sizeClasses[size]} relative`}
              style={{ animation: 'spin 1s linear infinite' }}
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#10b981' }} />
                  <stop offset="50%" style={{ stopColor: '#14b8a6' }} />
                  <stop offset="100%" style={{ stopColor: '#059669' }} />
                </linearGradient>
                <linearGradient id="spinner-gradient-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#34d399' }} />
                  <stop offset="50%" style={{ stopColor: '#2dd4bf' }} />
                  <stop offset="100%" style={{ stopColor: '#10b981' }} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Background circle */}
              <circle
                className="opacity-10"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              
              {/* Animated gradient arc */}
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="url(#spinner-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="60 40"
                filter="url(#glow)"
                className="dark:hidden"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="url(#spinner-gradient-dark)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="60 40"
                filter="url(#glow)"
                className="hidden dark:block"
              />
            </svg>
          </div>
        );

      default:
        return (
          <div className="relative">
            <svg
              className={`${sizeClasses[size]} animate-spin`}
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-20"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {renderSpinner()}
      {message && (
        <p className={`${messageSizeClasses[size]} text-text-secondary dark:text-gray-300 font-medium text-center`}>
          {message}
          <span className="inline-flex ml-0.5">
            <span className="animate-pulse" style={{ animationDelay: '0ms', animationDuration: '1.4s' }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: '200ms', animationDuration: '1.4s' }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: '400ms', animationDuration: '1.4s' }}>.</span>
          </span>
        </p>
      )}
    </div>
  );
};
