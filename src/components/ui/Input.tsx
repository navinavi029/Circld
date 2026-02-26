import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-text dark:text-gray-200 mb-2">
            {label}
            {props.required && <span className="text-error dark:text-error-light ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 sm:py-3 rounded-xl border-2 bg-white dark:bg-gray-800 text-text dark:text-gray-100 placeholder-text-disabled dark:placeholder-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background dark:focus:ring-offset-gray-900 focus:border-transparent shadow-sm hover:shadow-md ${error
              ? 'border-error focus:ring-error dark:border-error-light dark:focus:ring-error-light'
              : 'border-gray-200 dark:border-gray-600 hover:border-primary dark:hover:border-primary-light focus:ring-primary dark:focus:ring-primary-light'
            } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-error dark:text-error-light flex items-center gap-1.5">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-text-secondary dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
