import React, { useState } from 'react';
import { ShareMenu } from './ShareMenu';

interface QuickActionsProps {
  itemId: string;
  itemTitle: string;
  isFavorited: boolean;
  onFavoriteToggle: (itemId: string) => Promise<void>;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  itemId,
  itemTitle,
  isFavorited,
  onFavoriteToggle,
}) => {
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFavoriteLoading) return;
    
    setIsFavoriteLoading(true);
    try {
      await onFavoriteToggle(itemId);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsShareMenuOpen(true);
  };

  const handleCloseShareMenu = () => {
    setIsShareMenuOpen(false);
  };

  return (
    <>
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={isFavoriteLoading}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavoriteLoading ? (
            <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg
              className={`w-5 h-5 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-600 dark:text-gray-300'}`}
              fill={isFavorited ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
        </button>

        {/* Share Button */}
        <button
          onClick={handleShareClick}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Share item"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
      </div>

      {/* Share Menu Modal */}
      {isShareMenuOpen && (
        <ShareMenu
          itemId={itemId}
          itemTitle={itemTitle}
          onClose={handleCloseShareMenu}
        />
      )}
    </>
  );
};
