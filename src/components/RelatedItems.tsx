import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Item, EnhancedItem } from '../types/item';
import { findRelatedItems } from '../utils/relatedItems';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface RelatedItemsProps {
  currentItem: Item;
  maxItems?: number;
}

export const RelatedItems: React.FC<RelatedItemsProps> = ({ currentItem, maxItems = 8 }) => {
  const [items, setItems] = useState<EnhancedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRelatedItems = async () => {
      setLoading(true);
      try {
        const related = await findRelatedItems(currentItem, maxItems);
        setItems(related);
      } catch (error) {
        console.error('Error fetching related items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedItems();
  }, [currentItem.id, maxItems]);

  // Hide section when no related items exist
  if (!loading && items.length === 0) {
    return null;
  }

  const handleItemClick = (itemId: string) => {
    navigate(`/items/${itemId}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Related Items</h3>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" message="Loading related items..." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-2">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className="flex-shrink-0 w-48 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleItemClick(item.id);
                  }
                }}
                aria-label={`View ${item.title}`}
              >
                {/* Image */}
                <div className="relative w-full h-36 bg-gray-200 dark:bg-gray-600">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 bg-primary/10 dark:bg-primary-light/20 text-primary dark:text-primary-light rounded">
                      {item.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                      {item.condition}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
