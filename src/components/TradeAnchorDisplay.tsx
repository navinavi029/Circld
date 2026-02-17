import React from 'react';
import { Item } from '../types/item';

interface TradeAnchorDisplayProps {
  item: Item;
  onChangeClick: () => void;
}

/**
 * TradeAnchorDisplay component shows the user's selected trade anchor
 * in a fixed position while they swipe through potential trade matches.
 * 
 * Requirements: 2.5, 9.1, 9.2, 9.4
 */
export const TradeAnchorDisplay: React.FC<TradeAnchorDisplayProps> = ({
  item,
  onChangeClick,
}) => {
  return (
    <div className="fixed bottom-6 left-4 z-10 max-w-xs">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border-2 border-accent dark:border-primary-light overflow-hidden backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
        <div className="flex items-center gap-2 p-2.5">
          {/* Item Image */}
          <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
            {item.images && item.images.length > 0 ? (
              <img
                src={item.images[0]}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg 
                  className="w-6 h-6 text-gray-300 dark:text-gray-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Item Info */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">
              Trading Away
            </p>
            <h3 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
              {item.title}
            </h3>
          </div>

          {/* Change Button */}
          <button
            onClick={onChangeClick}
            className="flex-shrink-0 p-1.5 bg-accent dark:bg-primary-light text-white rounded-lg hover:bg-accent-dark dark:hover:bg-primary transition-colors"
            aria-label="Change trade anchor"
            title="Change trade anchor"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
