import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className = '', disabled, ...props }, ref) => {
    const baseStyles = 'font-semibold rounded-xl transition-all duration-300 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background dark:focus:ring-offset-gray-900 active:scale-[0.98] shadow-sm';

    const variants = {
      primary: 'bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 focus:ring-primary dark:from-primary-light dark:to-primary dark:hover:from-primary dark:hover:to-primary-dark',
      secondary: 'bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-0.5 focus:ring-accent dark:from-accent-light dark:to-accent',
      outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white dark:border-primary-light dark:text-primary-light dark:hover:bg-primary-light dark:hover:text-gray-900 focus:ring-primary hover:-translate-y-0.5 shadow-sm hover:shadow-md bg-transparent',
      ghost: 'text-primary hover:bg-primary/10 dark:text-primary-light dark:hover:bg-primary-light/10 focus:ring-primary transition-colors bg-transparent shadow-none',
      danger: 'bg-gradient-to-r from-error to-error-dark hover:from-error-dark hover:to-error text-white shadow-lg shadow-error/25 hover:shadow-xl hover:shadow-error/40 hover:-translate-y-0.5 focus:ring-error',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs sm:text-sm gap-1.5',
      md: 'px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base gap-2',
      lg: 'px-5 sm:px-7 py-2.5 sm:py-3 text-base sm:text-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        type="button"
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
