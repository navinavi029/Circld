import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
}

// Selector for all focusable elements
const FOCUSABLE_SELECTOR = 
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the modal content (excluding overlay)
  const getFocusableElements = (): HTMLElement[] => {
    if (!modalRef.current) return [];
    return Array.from(modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
  };

  // Focus trap effect - Requirement 21.1, 21.2, 21.3, 21.4, 21.5, 21.7
  useEffect(() => {
    if (isOpen) {
      // Store the element that triggered the modal (Requirement 21.4)
      triggerElementRef.current = document.activeElement as HTMLElement;
      
      document.body.style.overflow = 'hidden';
      
      // Move focus to first focusable element (Requirement 21.1)
      // Prioritize content area over header buttons
      setTimeout(() => {
        // First try to focus elements in the content area
        if (contentRef.current) {
          const contentFocusable = Array.from(
            contentRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
          ) as HTMLElement[];
          if (contentFocusable.length > 0) {
            contentFocusable[0].focus();
            return;
          }
        }
        
        // Fall back to any focusable element in modal
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current?.focus();
        }
      }, 10);
    } else {
      document.body.style.overflow = 'unset';
      
      // Return focus to trigger element (Requirement 21.4)
      if (triggerElementRef.current) {
        triggerElementRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle Tab key for focus trap - Requirement 21.2, 21.3, 21.5
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Handle Escape key (Requirement 21.6)
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Handle Tab key for focus trap
      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement;

        // Shift+Tab on first element - cycle to last (Requirement 21.3)
        if (e.shiftKey && activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
        // Tab on last element - cycle to first (Requirement 21.2)
        else if (!e.shiftKey && activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle dynamically added focusable elements (Requirement 21.7)
  // MutationObserver to watch for DOM changes
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const observer = new MutationObserver(() => {
      // When DOM changes, ensure focus is still within modal
      const focusableElements = getFocusableElements();
      const activeElement = document.activeElement as HTMLElement;
      
      // If focus is outside modal or on body, move to first focusable element
      if (!modalRef.current?.contains(activeElement) || activeElement === document.body) {
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    });

    observer.observe(modalRef.current, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl',
    full: 'max-w-7xl w-[95vw]',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md animate-fadeIn"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`${sizeClasses[size]} w-full max-h-[80vh] bg-gradient-to-br from-white via-white to-gray-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transform transition-all animate-scaleIn overflow-hidden flex flex-col`}
        style={{
          // Use safe-area-inset for notched devices (Requirement 13.6)
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 dark:from-primary-light/10 dark:via-primary/10 dark:to-accent/10 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2
              id="modal-title"
              className="text-xl font-bold bg-gradient-to-r from-text via-text to-text-secondary dark:from-gray-100 dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="min-w-[48px] min-h-[48px] p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 touch-action-manipulation"
              aria-label="Close modal"
            >
              <svg
                className="w-5 h-5 text-text-secondary dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable with max-height (Requirement 13.1, 13.2) */}
        <div ref={contentRef} className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer - Sticky at bottom (Requirement 13.4) */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200/50 dark:border-gray-700/50 flex-shrink-0 sticky bottom-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
