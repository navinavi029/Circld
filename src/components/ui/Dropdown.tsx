import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Dropdown({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  helperText,
  required,
  disabled,
  className = ''
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Generate unique IDs for accessibility
  const dropdownId = `dropdown-${Math.random().toString(36).substr(2, 9)}`;
  const labelId = label ? `${dropdownId}-label` : undefined;
  const errorId = error ? `${dropdownId}-error` : undefined;
  const helperId = helperText && !error ? `${dropdownId}-helper` : undefined;

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside both the dropdown container and the portal content
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        // Check if the click is on an option button (which is in the portal)
        const clickedElement = event.target as HTMLElement;
        const isOptionClick = clickedElement.closest('[role="option"]');
        
        if (!isOptionClick) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
      }
    };

    if (isOpen) {
      // Use a slight delay to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev < options.length - 1 ? prev + 1 : 0;
            optionsRef.current[nextIndex]?.scrollIntoView({ block: 'nearest' });
            return nextIndex;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev > 0 ? prev - 1 : options.length - 1;
            optionsRef.current[nextIndex]?.scrollIntoView({ block: 'nearest' });
            return nextIndex;
          });
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0 && !options[focusedIndex].disabled) {
            handleSelect(options[focusedIndex].value);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, options]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // Set focus to selected item when opening
        const selectedIndex = options.findIndex(opt => opt.value === value);
        setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }
    }
  };

  const baseStyles = `
    w-full px-4 py-2.5 pr-10
    border-2 rounded-xl
    bg-white/80 dark:bg-gray-700/80
    backdrop-blur-sm
    text-gray-900 dark:text-gray-100
    text-sm font-medium
    transition-all duration-300
    cursor-pointer
    focus:outline-none focus:ring-2
    shadow-sm
    hover:shadow-md
    min-h-[42px]
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  const stateStyles = error
    ? 'border-error dark:border-error-light focus:ring-error/20 dark:focus:ring-error-light/20 focus:border-error dark:focus:border-error-light'
    : isOpen
      ? 'border-accent dark:border-primary-light ring-2 ring-accent/20 dark:ring-primary-light/20'
      : 'border-gray-200/60 dark:border-gray-600/60 hover:border-accent/60 dark:hover:border-primary-light/60';

  return (
    <div className={`flex-shrink-0 ${className}`} ref={dropdownRef}>
      {label && (
        <label id={labelId} className="block text-sm font-semibold mb-2 text-text dark:text-gray-200">
          {label}
          {required && <span className="text-error dark:text-error-light ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`${baseStyles} ${stateStyles} flex items-center justify-between gap-2`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={labelId}
          aria-describedby={errorId || helperId}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required}
        >
          <span className={`truncate ${selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
            {displayText}
          </span>
          <svg
            className={`w-5 h-5 flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu - Rendered via Portal */}
        {isOpen && createPortal(
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: -10, filter: 'blur(4px)' }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
              mass: 0.8
            }}
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top + 8}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
            }}
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/60 dark:border-gray-700/60 z-[101] overflow-hidden max-h-64 overflow-y-auto origin-top hide-scrollbar"
            role="listbox"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isDisabled = option.disabled;
              const isFocused = index === focusedIndex;

              return (
                <motion.button
                  key={option.value}
                  ref={el => { optionsRef.current[index] = el; }}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDisabled) {
                      handleSelect(option.value);
                    }
                  }}
                  disabled={isDisabled}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm font-medium
                    transition-all duration-200
                    flex items-center justify-between gap-2
                    min-h-[42px]
                    ${isSelected
                      ? 'bg-gradient-to-r from-accent/10 to-accent-dark/10 dark:from-primary-light/10 dark:to-primary/10 text-accent dark:text-primary-light'
                      : isDisabled
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : isFocused
                          ? 'bg-gray-100/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-700/80'
                    }
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {isSelected && (
                    <motion.svg
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="w-5 h-5 text-accent dark:text-primary-light flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </motion.svg>
                  )}
                </motion.button>
              );
            })}
          </motion.div>,
          document.body
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-error dark:text-error-light flex items-center gap-1.5 animate-fadeInFast" role="alert">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p id={helperId} className="mt-1.5 text-xs text-text-secondary dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
