import { useNavigate } from 'react-router-dom';
import { ReactElement } from 'react';

export type EmptyStateReason = 
  | 'no-filters-match'
  | 'no-location-match'
  | 'all-swiped'
  | 'no-anchor'
  | 'network-error'
  | 'default';

interface EmptyStateProps {
  reason: EmptyStateReason;
  onAdjustFilters?: () => void;
  onChangeAnchor?: () => void;
  onRetry?: () => void;
}

interface EmptyStateConfig {
  icon: ReactElement;
  title: string;
  message: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary';
  }>;
}

/**
 * EmptyState component displays contextual messages and actions
 * when no items are available in the swipe interface.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export function EmptyState({ 
  reason, 
  onAdjustFilters, 
  onChangeAnchor, 
  onRetry 
}: EmptyStateProps) {
  const navigate = useNavigate();

  const getConfig = (): EmptyStateConfig => {
    switch (reason) {
      case 'no-filters-match':
        return {
          icon: (
            <svg
              className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          ),
          title: 'No Matches Found',
          message: 'No items match your current filters. Try adjusting your search criteria.',
          actions: [
            {
              label: 'Adjust Filters',
              onClick: () => onAdjustFilters?.(),
              variant: 'primary' as const,
            },
            {
              label: 'Change Trade Anchor',
              onClick: () => onChangeAnchor?.(),
              variant: 'secondary' as const,
            },
          ],
        };

      case 'no-location-match':
        return {
          icon: (
            <svg
              className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ),
          title: 'No Items Nearby',
          message: 'No items found in your area. Try expanding your distance range.',
          actions: [
            {
              label: 'Adjust Filters',
              onClick: () => onAdjustFilters?.(),
              variant: 'primary' as const,
            },
            {
              label: 'Change Trade Anchor',
              onClick: () => onChangeAnchor?.(),
              variant: 'secondary' as const,
            },
          ],
        };

      case 'all-swiped':
        return {
          icon: (
            <svg
              className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          title: 'All Caught Up!',
          message: "You've seen all available items. Check back later for new listings.",
          actions: [
            {
              label: 'Change Trade Anchor',
              onClick: () => onChangeAnchor?.(),
              variant: 'primary' as const,
            },
            {
              label: 'View My Listings',
              onClick: () => navigate('/listings'),
              variant: 'secondary' as const,
            },
          ],
        };

      case 'no-anchor':
        return {
          icon: (
            <svg
              className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          ),
          title: 'Select an Item to Trade',
          message: 'Select an item you want to trade to start swiping.',
          actions: [
            {
              label: 'Select Trade Anchor',
              onClick: () => onChangeAnchor?.(),
              variant: 'primary' as const,
            },
            {
              label: 'View My Listings',
              onClick: () => navigate('/listings'),
              variant: 'secondary' as const,
            },
          ],
        };

      case 'network-error':
        return {
          icon: (
            <svg
              className="w-24 h-24 mx-auto text-red-300 dark:text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          title: 'Connection Error',
          message: 'Unable to load items. Check your connection and try again.',
          actions: [
            {
              label: 'Try Again',
              onClick: () => onRetry?.(),
              variant: 'primary' as const,
            },
            {
              label: 'Go Back',
              onClick: () => navigate('/listings'),
              variant: 'secondary' as const,
            },
          ],
        };

      default:
        return {
          icon: (
            <svg
              className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
          title: 'No Matches Found',
          message: 'There are no available items to trade right now. Check back later for new listings, or try changing your trade anchor.',
          actions: [
            {
              label: 'Change Trade Anchor',
              onClick: () => onChangeAnchor?.(),
              variant: 'primary' as const,
            },
            {
              label: 'View My Listings',
              onClick: () => navigate('/listings'),
              variant: 'secondary' as const,
            },
          ],
        };
    }
  };

  const config = getConfig();

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="text-center max-w-md">
        <div className="mb-6">
          {config.icon}
        </div>
        <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-3">
          {config.title}
        </h2>
        <p className="text-text-secondary dark:text-gray-300 mb-6">
          {config.message}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {config.actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={
                action.variant === 'primary'
                  ? 'px-6 py-3 bg-gradient-to-r from-accent to-accent-dark dark:from-primary-light dark:to-primary text-white rounded-lg font-medium hover:shadow-lg hover:shadow-accent/30 dark:hover:shadow-primary/30 transition-all'
                  : 'px-6 py-3 bg-white dark:bg-gray-800 text-text dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all'
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
