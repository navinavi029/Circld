import React from 'react';
import { Item } from '../types/item';

interface TradeAnchorSelectorProps {
  userItems: Item[];
  onSelect: (item: Item) => void;
  selectedItemId: string | null;
}

export const TradeAnchorSelector: React.FC<TradeAnchorSelectorProps> = ({
  userItems,
  onSelect,
  selectedItemId,
}) => {
  // Filter to show only available items
  const availableItems = userItems.filter(item => item.status === 'available');

  // Empty state when no available items
  if (availableItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Available Items</h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          You need to create a listing first before you can start swipe trading. Add an item with status "available" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Select Your Trade Item
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose which item you want to trade away
        </p>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {availableItems.map((item) => {
          const isSelected = item.id === selectedItemId;

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={`
                group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border overflow-hidden 
                hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col relative
                ${isSelected
                  ? 'border-accent dark:border-primary-light ring-2 ring-accent dark:ring-primary-light shadow-lg scale-[1.02]'
                  : 'border-gray-200/50 dark:border-gray-700/50 hover:border-accent/50 dark:hover:border-primary-light/50'
                }
              `}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(item);
                }
              }}
              aria-label={`Select ${item.title} as trade anchor`}
              aria-pressed={isSelected}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 z-10 bg-accent dark:bg-primary-light text-white rounded-full p-1.5 shadow-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                {item.images.length > 0 ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Image count indicator */}
                {item.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-md flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {item.images.length}
                  </div>
                )}

                <div className="absolute top-2 left-2">
                  <span className="px-2 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs font-medium text-gray-900 dark:text-gray-100 rounded-md shadow capitalize">
                    {item.condition.replace('-', ' ')}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-grow">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="inline-flex items-center px-2 py-0.5 bg-accent/10 dark:bg-primary-light/20 text-accent dark:text-primary-light rounded text-xs font-medium flex-shrink-0">
                    {item.category}
                  </span>
                </div>

                <h3 className={`
                  text-base font-semibold mb-2 line-clamp-1 transition-colors
                  ${isSelected
                    ? 'text-accent dark:text-primary-light'
                    : 'text-gray-900 dark:text-gray-100 group-hover:text-accent dark:group-hover:text-primary-light'
                  }
                `}>
                  {item.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 flex-grow">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
