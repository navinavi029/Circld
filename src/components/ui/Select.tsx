import { SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, helperText, children, ...props }, ref) => {
    const baseStyles = `
      w-full px-4 py-2.5 pr-10
      border-2 rounded-lg
      bg-white dark:bg-gray-700
      text-gray-900 dark:text-gray-100
      transition-all duration-200
      appearance-none
      cursor-pointer
      focus:outline-none focus:ring-2
      disabled:opacity-50 disabled:cursor-not-allowed
      bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3cpath%20d%3D%22M7%207l3%203%203-3%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3c%2Fsvg%3E')]
      bg-[length:1.5em_1.5em]
      bg-[right_0.5rem_center]
      bg-no-repeat
    `;

    const stateStyles = error
      ? 'border-error dark:border-error-light focus:ring-error/20 dark:focus:ring-error-light/20 focus:border-error dark:focus:border-error-light'
      : 'border-gray-300 dark:border-gray-600 hover:border-accent dark:hover:border-primary-light focus:ring-accent/20 dark:focus:ring-primary-light/20 focus:border-accent dark:focus:border-primary-light';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 text-text dark:text-gray-200">
            {label}
            {props.required && <span className="text-error dark:text-error-light ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`${baseStyles} ${stateStyles} ${className}`}
            {...props}
          >
            {children}
          </select>
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-error dark:text-error-light flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-text-secondary dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
