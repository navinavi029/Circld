import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Item } from '../types/item';
import { getResponsiveImageUrl } from '../utils/cloudinary';

interface TradeAnchorDisplayProps {
  item: Item | null;
  onChangeClick: () => void;
}

/**
 * TradeAnchorDisplay component shows the user's selected trade anchor
 * as a collapsible floating button beside the tips button.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
export const TradeAnchorDisplay: React.FC<TradeAnchorDisplayProps> = ({
  item,
  onChangeClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle change button click with pulse animation (Requirement 7.6)
  const handleChangeClick = () => {
    setIsExpanded(false);
    onChangeClick();
  };

  // Don't show anything when no anchor is selected (Requirement 9.6)
  if (!item) {
    return null;
  }

  return (
    <>
      {/* Backdrop - only visible when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-10 transition-opacity duration-300"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="fixed top-6 right-20 z-20 min-w-[48px] min-h-[48px] p-3 bg-gradient-to-br from-accent/95 to-accent-dark/95 dark:from-primary-light/95 dark:to-primary/95 backdrop-blur-xl rounded-full shadow-xl border-2 border-white/40 dark:border-gray-700/60 hover:shadow-2xl transition-all duration-300 touch-action-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary-light focus-visible:ring-offset-2"
        aria-label={isExpanded ? "Hide trading item" : "Show trading item"}
        aria-expanded={isExpanded}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </motion.button>

      {/* Expanded Card Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
              mass: 0.8
            }}
            className="fixed top-20 right-6 z-20 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden"
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-accent to-accent-dark dark:from-primary-light dark:to-primary px-4 py-3 flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                Trading Away
              </h3>
              <motion.button
                onClick={() => setIsExpanded(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                aria-label="Close trading item panel"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Item preview */}
            <div className="p-4">
              {/* Item Image */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 mb-3 shadow-md">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={getResponsiveImageUrl(item.images[0], { width: 300, height: 300, crop: 'fill' })}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg 
                      className="w-12 h-12 text-gray-400 dark:text-gray-500" 
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
              <div className="mb-3">
                <h3 className="text-gray-900 dark:text-white font-bold text-sm leading-tight mb-1">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  {item.category}
                </p>
              </div>

              {/* Change Button - Full width */}
              <motion.button
                onClick={handleChangeClick}
                className="w-full min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-accent to-accent-dark dark:from-primary-light dark:to-primary hover:from-accent-dark hover:to-accent dark:hover:from-primary dark:hover:to-primary-light text-white rounded-xl transition-all shadow-md hover:shadow-lg font-semibold text-sm flex items-center justify-center gap-2"
                aria-label="Change trade anchor"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <svg 
                  className="w-5 h-5" 
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
                <span>Change Item</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
