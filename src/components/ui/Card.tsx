import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    const variants = {
      default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md',
      elevated: 'bg-white dark:bg-gray-800 shadow-xl shadow-black/5 dark:shadow-black/20 hover:shadow-2xl hover:shadow-primary/10 dark:hover:shadow-primary/20 border border-gray-200/60 dark:border-gray-700/60 transition-all duration-300 hover:-translate-y-0.5',
      outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary-light transition-colors duration-300',
      glass: 'backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/60 dark:border-gray-700/50 shadow-xl shadow-black/10 dark:shadow-black/30',
    };

    return (
      <div
        ref={ref}
        className={`rounded-2xl p-4 sm:p-6 transition-all duration-300 ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-xl sm:text-2xl font-bold text-text dark:text-gray-100 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className = '', children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm sm:text-base text-text-secondary dark:text-gray-400 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...props}>
    {children}
  </div>
);
