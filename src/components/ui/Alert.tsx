import { HTMLAttributes } from 'react';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

export function Alert({ variant = 'info', title, children, className = '', ...props }: AlertProps) {
  const variants = {
    info: {
      container: 'bg-gradient-to-r from-info/10 to-info-light/10 dark:from-info-dark/20 dark:to-info/20 border-info dark:border-info-light',
      icon: 'text-info dark:text-info-light',
      title: 'text-info-dark dark:text-info-light',
      text: 'text-info-dark/90 dark:text-info-light/90',
    },
    success: {
      container: 'bg-gradient-to-r from-success/10 to-success-light/10 dark:from-success/20 dark:to-success-light/20 border-success dark:border-success-light',
      icon: 'text-success dark:text-success-light',
      title: 'text-success-dark dark:text-success-light',
      text: 'text-success-dark/90 dark:text-success-light/90',
    },
    warning: {
      container: 'bg-gradient-to-r from-warning/10 to-warning-light/10 dark:from-warning/20 dark:to-warning-light/20 border-warning dark:border-warning-light',
      icon: 'text-warning dark:text-warning-light',
      title: 'text-warning-dark dark:text-warning-light',
      text: 'text-warning-dark/90 dark:text-warning-light/90',
    },
    error: {
      container: 'bg-gradient-to-r from-error/10 to-error-light/10 dark:from-error/20 dark:to-error-light/20 border-error dark:border-error-light',
      icon: 'text-error dark:text-error-light',
      title: 'text-error-dark dark:text-error-light',
      text: 'text-error-dark/90 dark:text-error-light/90',
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
      className={`border-l-4 rounded-xl p-4 shadow-sm backdrop-blur-sm ${style.container} ${className}`}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${style.icon} bg-current/10`}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            {icons[variant]}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-bold mb-1 ${style.title}`}>{title}</h4>
          )}
          <div className={`text-sm leading-relaxed ${style.text}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
