import { InputHTMLAttributes, forwardRef } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className: _className = '', ...props }, ref) => {
    return (
      <label className="flex items-center cursor-pointer group">
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only peer"
            {...props}
          />
          <div className="w-5 h-5 border-2 border-border dark:border-gray-600 rounded bg-background-light dark:bg-gray-700 peer-checked:bg-primary peer-checked:border-primary dark:peer-checked:bg-primary-light dark:peer-checked:border-primary-light transition-all duration-200 peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2 group-hover:border-primary dark:group-hover:border-primary-light" />
          <svg
            className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        {label && (
          <span className="ml-3 text-sm font-medium text-text dark:text-gray-200 group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
