import { HTMLAttributes } from 'react';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

export function Alert({ variant = 'info', title, children, className = '', ...props }: AlertProps) {
  const variants = {
    info: {
      container: 'bg-info-light/20 dark:bg-info-dark/20 border-info',
      icon: 'text-info',
      title: 'text-info-dark dark:text-info-light',
      text: 'text-info-dark dark:text-info-light',
    },
    success: {
      container: 'bg-success/10 dark:bg-success/20 border-success',
      icon: 'text-success',
      title: 'text-success-dark dark:text-success-light',
      text: 'text-success-dark dark:text-success-light',
    },
    warning: {
      container: 'bg-warning/10 dark:bg-warning/20 border-warning',
      icon: 'text-warning',
      title: 'text-warning-dark dark:text-warning-light',
      text: 'text-warning-dark dark:text-warning-light',
    },
    error: {
      container: 'bg-error/10 dark:bg-error/20 border-error',
      icon: 'text-error',
      title: 'text-error-dark dark:text-error-light',
      text: 'text-error-dark dark:text-error-light',
    },
  };

  const icons = {
    info: (
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    ),
    success: (
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    ),
    warning: (
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    ),
    error: (
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    ),
  };

  const style = variants[variant];

  return (
    <div
      className={`border-l-4 rounded-lg p-4 ${style.container} ${className}`}
      {...props}
    >
      <div className="flex items-start">
        <svg className={`w-5 h-5 ${style.icon} mr-3 mt-0.5 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
          {icons[variant]}
        </svg>
        <div className="flex-1">
          {title && (
            <h4 className={`text-sm font-semibold mb-1 ${style.title}`}>{title}</h4>
          )}
          <div className={`text-sm ${style.text}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
