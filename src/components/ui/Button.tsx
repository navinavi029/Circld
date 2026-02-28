import { ButtonHTMLAttributes, forwardRef, isValidElement, Children } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  iconPosition?: 'leading' | 'trailing';
  'aria-label'?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, iconPosition = 'leading', children, className = '', disabled, ...props }, ref) => {
    // Detect if button contains only an icon (single React element child)
    const childArray = Children.toArray(children);
    const isIconOnly = childArray.length === 1 && isValidElement(childArray[0]) && typeof childArray[0].type !== 'string';
    
    // Warn in development if icon-only button lacks aria-label (Requirement 13.3)
    if (process.env.NODE_ENV === 'development' && isIconOnly && !props['aria-label']) {
      console.warn('Button: Icon-only buttons require an aria-label for accessibility');
    }
    
    // Base styles with focus-visible, transitions, and disabled states (Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 3.5, 11.1, 11.2, 11.3, 11.4, 15.1, 15.2, 15.3, 15.4, 15.5)
    const baseStyles = 'font-semibold rounded-xl transition-[background-color,color,border-color,transform,box-shadow] duration-200 ease-in-out inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent dark:focus-visible:ring-accent-light focus-visible:ring-offset-background dark:focus-visible:ring-offset-gray-900 active:scale-[0.98] shadow-sm touch-action-manipulation';

    const variants = {
      primary: 'bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 dark:from-primary-light dark:to-primary dark:hover:from-primary dark:hover:to-primary-dark',
      secondary: 'bg-gradient-to-r from-accent to-accent-dark hover:from-accent-light hover:to-accent text-white shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-0.5 dark:from-accent-light dark:to-accent dark:hover:from-accent dark:hover:to-accent-dark',
      outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white dark:border-primary-light dark:text-primary-light dark:hover:bg-primary-light dark:hover:text-gray-900 hover:-translate-y-0.5 shadow-sm hover:shadow-md bg-transparent',
      ghost: 'text-primary hover:bg-primary/10 dark:text-primary-light dark:hover:bg-primary-light/10 transition-colors bg-transparent shadow-none',
      danger: 'bg-gradient-to-r from-error to-error-dark hover:from-error-light hover:to-error text-white shadow-lg shadow-error/25 hover:shadow-xl hover:shadow-error/40 hover:-translate-y-0.5',
    };

    // Ensure minimum 48x48px hit target (Requirement 12.1, 12.2)
    // Icon-only buttons use square proportions (Requirement 13.1)
    const sizes = {
      sm: `min-w-[48px] min-h-[48px] ${isIconOnly ? 'w-[48px] h-[48px] p-2' : 'px-3 py-1.5'} text-xs sm:text-sm gap-1.5`,
      md: `min-w-[48px] min-h-[48px] ${isIconOnly ? 'w-[52px] h-[52px] p-2.5' : 'px-4 sm:px-5 py-2 sm:py-2.5'} text-sm sm:text-base gap-2`,
      lg: `min-w-[48px] min-h-[48px] ${isIconOnly ? 'w-[56px] h-[56px] p-3' : 'px-5 sm:px-7 py-2.5 sm:py-3'} text-base sm:text-lg gap-2.5`,
    };

    // Determine content order based on iconPosition (Requirement 13.5)
    const renderContent = () => {
      if (isLoading) {
        return (
          <>
            <LoadingSpinner size={size} />
            {children}
          </>
        );
      }
      
      // For icon-only buttons, just render the icon
      if (isIconOnly) {
        return children;
      }
      
      // For buttons with both icon and text, respect iconPosition
      // Assume first child is icon if it's a valid element, rest is text
      const hasIcon = childArray.some(child => isValidElement(child) && typeof child.type !== 'string');
      
      if (!hasIcon || iconPosition === 'leading') {
        return children;
      }
      
      // Trailing position: reverse the order
      return childArray.reverse();
    };

    return (
      <button
        ref={ref}
        type="button"
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);

Button.displayName = 'Button';
