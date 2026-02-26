/**
 * SwipeCardSkeleton - Loading placeholder for swipe cards
 * Provides visual feedback while cards are being loaded
 */
export function SwipeCardSkeleton() {
  return (
    <div className="w-full max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="relative h-80 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-shimmer" />
      
      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 animate-shimmer" />
        
        {/* Description lines */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-shimmer" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-shimmer" />
        </div>
        
        {/* Metadata */}
        <div className="flex items-center gap-4 pt-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-shimmer" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

/**
 * MultiCardSkeleton - Loading placeholder for multi-card grid
 */
interface MultiCardSkeletonProps {
  count?: number;
}

export function MultiCardSkeleton({ count = 3 }: MultiCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl mx-auto px-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {/* Image skeleton */}
          <div className="relative h-64 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-shimmer" />
          
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-shimmer" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-shimmer" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5 animate-shimmer" />
            </div>
            <div className="flex gap-3 pt-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-shimmer" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
