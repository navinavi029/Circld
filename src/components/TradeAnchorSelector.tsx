import React, { useState, useMemo } from 'react';
import { Item } from '../types/item';
import { SwipeFilterPreferences } from '../types/swipe-trading';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/Input';
import { Dropdown } from './ui/Dropdown';
import { Button } from './ui/Button';

type ViewMode = 'grid' | 'list';

function getConditionBadgeClass(condition: string): string {
  switch (condition) {
    case 'new': return 'bg-emerald-500 text-white';
    case 'like-new': return 'bg-sky-500 text-white';
    case 'good': return 'bg-amber-500 text-white';
    case 'fair': return 'bg-orange-500 text-white';
    case 'poor': return 'bg-red-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Books',
  'Clothing',
  'Sports & Outdoors',
  'Home & Garden',
  'Toys & Games',
  'Tools',
  'Kitchen',
];

const DISTANCE_OPTIONS = [
  { value: 'null', label: 'Any distance' },
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
  { value: '25', label: 'Within 25 km' },
  { value: '50', label: 'Within 50 km' },
  { value: '100', label: 'Within 100 km' },
];

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like-new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

interface TradeAnchorSelectorProps {
  userItems: Item[];
  onSelect: (item: Item, filters: SwipeFilterPreferences) => void;
  isLoading?: boolean;
}

export const TradeAnchorSelector: React.FC<TradeAnchorSelectorProps> = ({
  userItems,
  onSelect,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  // Swipe filter preferences
  const [swipeMaxDistance, setSwipeMaxDistance] = useState<string>('null');
  const [swipeCategories, setSwipeCategories] = useState<string[]>([]);
  const [swipeConditions, setSwipeConditions] = useState<string[]>([]);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Filter to show only available items
  const availableItems = userItems.filter(item => item.status === 'available');

  // Get unique categories from available items
  const categories = useMemo(() => 
    Array.from(new Set(availableItems.map(item => item.category))),
    [availableItems]
  );

  // Apply filters
  const filteredItems = useMemo(() => {
    let filtered = availableItems;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedCondition !== 'all') {
      filtered = filtered.filter(item => item.condition === selectedCondition);
    }

    return filtered;
  }, [availableItems, searchTerm, selectedCategory, selectedCondition]);

  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || selectedCondition !== 'all';

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedCondition('all');
  };

  const handleItemClick = (item: Item, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isLoading && !loadingItemId) {
      console.log('[TradeAnchorSelector] Item clicked, opening modal:', item.id);
      setSelectedItem(item);
      setShowFilterModal(true);
    }
  };

  const handleSwipeCategoryToggle = (category: string) => {
    setSwipeCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSwipeConditionToggle = (condition: string) => {
    setSwipeConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleStartSwiping = () => {
    if (!selectedItem) return;
    
    console.log('[TradeAnchorSelector] Starting swipe session with filters:', {
      itemId: selectedItem.id,
      maxDistance: swipeMaxDistance,
      categories: swipeCategories,
      conditions: swipeConditions,
    });
    
    setLoadingItemId(selectedItem.id);
    setShowFilterModal(false);
    
    const filters: SwipeFilterPreferences = {
      maxDistance: swipeMaxDistance === 'null' ? null : parseInt(swipeMaxDistance),
      categories: swipeCategories,
      conditions: swipeConditions,
    };
    
    onSelect(selectedItem, filters);
  };

  const handleResetSwipeFilters = () => {
    setSwipeMaxDistance('null');
    setSwipeCategories([]);
    setSwipeConditions([]);
  };

  // Empty state when no available items
  if (availableItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
        {/* Header with back button */}
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <button
            onClick={() => navigate('/listings')}
            className="inline-flex items-center gap-2 text-text-secondary dark:text-gray-400 hover:text-accent dark:hover:text-primary-light transition-colors group mb-6"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Listings
          </button>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-accent via-accent-dark to-primary bg-clip-text text-transparent dark:from-primary-light dark:via-primary dark:to-accent-dark leading-tight pb-0.5">
              Start Swipe Trading
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary dark:text-gray-400 mt-1">
              Select an item to trade
            </p>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <div className="text-center max-w-md">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent/10 to-primary/10 dark:from-primary-light/10 dark:to-accent/10 border-2 border-dashed border-accent/30 dark:border-primary-light/30 flex items-center justify-center animate-pulse mx-auto">
                <svg className="w-12 h-12 text-accent/60 dark:text-primary-light/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-bold text-text dark:text-gray-100 mb-2">
              No Available Items
            </h3>
            <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">
              You need to create a listing first before you can start swipe trading. Add an item with status "available" to get started.
            </p>
            <button
              onClick={() => navigate('/listings')}
              className="px-6 py-3 bg-gradient-to-r from-accent to-accent-dark dark:from-primary-light dark:to-primary text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-accent/30 dark:hover:shadow-primary/30 transition-all hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Listing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with back button */}
        <button
          onClick={() => navigate('/listings')}
          className="inline-flex items-center gap-2 text-text-secondary dark:text-gray-400 hover:text-accent dark:hover:text-primary-light transition-colors group mb-6"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Listings
        </button>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-accent via-accent-dark to-primary bg-clip-text text-transparent dark:from-primary-light dark:via-primary dark:to-accent-dark leading-tight pb-0.5 mb-2">
                Select Your Trade Anchor
              </h1>
              <p className="text-sm text-text-secondary dark:text-gray-400">
                Choose which item you want to trade away
              </p>
            </div>

            {/* View mode toggle */}
            {availableItems.length > 0 && (
              <div className="hidden sm:flex items-center bg-white/70 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-1 gap-1 self-start sm:self-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-accent dark:bg-primary-light text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  title="List view"
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-accent dark:bg-primary-light text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* How it works hint button */}
          <div className="mb-4 relative">
            <button
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="w-9 h-9 bg-gradient-to-br from-accent to-accent-dark dark:from-primary-light dark:to-primary rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-accent/30 dark:hover:shadow-primary/30 transition-all hover:scale-110 active:scale-95 group"
              title="How it works"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {showHowItWorks && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-accent/20 dark:border-primary-light/20 rounded-xl p-4 shadow-xl z-10 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-accent/20 to-primary/20 dark:from-primary-light/20 dark:to-accent/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-accent dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-text dark:text-gray-100 mb-1">How it works</h4>
                    <p className="text-xs text-text-secondary dark:text-gray-400 leading-relaxed">
                      Select one of your items below. You'll then swipe through other users' items to find potential trades. When you like an item, we'll send them a trade offer!
                    </p>
                  </div>
                  <button
                    onClick={() => setShowHowItWorks(false)}
                    className="flex-shrink-0 text-text-secondary dark:text-gray-400 hover:text-text dark:hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mb-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-sm border border-white/20 dark:border-gray-700/50 p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              {/* Search */}
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  type="text"
                  placeholder="Search your items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Category and Condition */}
              <div className="flex gap-3 flex-shrink-0">
                <div className="w-40">
                  <Dropdown
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={[
                      { value: 'all', label: 'All Categories' },
                      ...categories.map(c => ({ value: c, label: c }))
                    ]}
                  />
                </div>

                <div className="w-36">
                  <Dropdown
                    value={selectedCondition}
                    onChange={setSelectedCondition}
                    options={[
                      { value: 'all', label: 'All Conditions' },
                      { value: 'new', label: 'New' },
                      { value: 'like-new', label: 'Like New' },
                      { value: 'good', label: 'Good' },
                      { value: 'fair', label: 'Fair' },
                      { value: 'poor', label: 'Poor' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Filter status */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary dark:text-gray-400">
                  {filteredItems.length} of {availableItems.length} items
                </span>
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-accent dark:text-primary-light hover:underline font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* Empty filtered state */}
          {filteredItems.length === 0 && availableItems.length > 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 dark:from-primary-light/10 dark:to-accent/10 border-2 border-dashed border-accent/30 dark:border-primary-light/30 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-accent/60 dark:text-primary-light/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text dark:text-gray-100 mb-2">
                No items match your filters
              </h3>
              <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">
                Try adjusting your search or filters to find what you're looking for
              </p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-accent dark:bg-primary-light text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}

        {/* Items Grid/List */}
        {filteredItems.length > 0 && (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-8'
            : 'flex flex-col gap-4 pb-8'
          }>
          {filteredItems.map((item) => {
            const isItemLoading = loadingItemId === item.id;
            const isHovered = item.id === hoveredItemId;

            return (
              <div
                key={item.id}
                onClick={(e) => handleItemClick(item, e)}
                onMouseEnter={() => !isLoading && setHoveredItemId(item.id)}
                onMouseLeave={() => setHoveredItemId(null)}
                className={`
                  group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 overflow-hidden 
                  transition-all duration-300 relative
                  ${viewMode === 'list' ? 'flex flex-row' : 'flex flex-col'}
                  ${isItemLoading || isLoading
                    ? 'border-accent dark:border-primary-light opacity-60 cursor-wait'
                    : 'border-gray-200/50 dark:border-gray-700/50 hover:border-accent/60 dark:hover:border-primary-light/60 hover:shadow-2xl hover:-translate-y-1 hover:shadow-accent/10 dark:hover:shadow-primary/10 cursor-pointer'
                  }
                `}
                role="button"
                tabIndex={isLoading ? -1 : 0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isLoading && !isItemLoading) {
                    e.preventDefault();
                    handleItemClick(item);
                  }
                }}
                aria-label={`Start swiping with ${item.title}`}
                aria-busy={isItemLoading}
              >
                {/* Loading indicator */}
                {isItemLoading && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-20 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-10 h-10 text-accent dark:text-primary-light animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-sm font-semibold text-accent dark:text-primary-light">Starting session...</span>
                    </div>
                  </div>
                )}

                {/* Hover overlay */}
                {isHovered && !isItemLoading && !isLoading && (
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 dark:from-primary-light/5 dark:to-accent/5 pointer-events-none z-[1]" />
                )}

                {/* Image */}
                <div className={`relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex-shrink-0 ${
                  viewMode === 'list' ? 'w-48 h-full min-h-[180px]' : 'aspect-[4/3]'
                }`}>
                  {item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      loading="lazy"
                      className={`w-full h-full object-cover transition-transform duration-500 ${isHovered && !isItemLoading && !isLoading ? 'scale-110' : 'scale-100'}`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />

                  {/* Image count indicator */}
                  {item.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-lg">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {item.images.length}
                    </div>
                  )}

                  {/* Condition badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize shadow-md ${getConditionBadgeClass(item.condition)}`}>
                      {item.condition.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-1 bg-accent/10 dark:bg-primary-light/20 text-accent dark:text-primary-light rounded-lg text-xs font-bold truncate border border-accent/20 dark:border-primary-light/30">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold mb-2 line-clamp-2 transition-colors leading-tight text-text dark:text-gray-100 group-hover:text-accent dark:group-hover:text-primary-light">
                    {item.title}
                  </h3>

                  <p className="text-text-secondary dark:text-gray-400 text-xs line-clamp-2 flex-grow leading-relaxed mb-3">
                    {item.description}
                  </p>

                  {/* Action hint */}
                  {!isItemLoading && !isLoading && (
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700 transition-all opacity-0 group-hover:opacity-100">
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold">
                        <svg className="w-4 h-4 text-accent dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <span className="text-accent dark:text-primary-light">Click to start swiping</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Filter Modal */}
        {showFilterModal && selectedItem && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
            onClick={(e) => {
              // Close modal only if clicking the backdrop
              if (e.target === e.currentTarget) {
                setShowFilterModal(false);
                setSelectedItem(null);
              }
            }}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-accent via-accent-dark to-primary dark:from-primary-light dark:via-primary dark:to-accent px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Set Your Preferences</h2>
                    <p className="text-xs text-white/80">Filter items you'll see while swiping</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowFilterModal(false);
                    setSelectedItem(null);
                  }}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Selected Item Preview */}
                <div className="bg-gradient-to-br from-accent/10 to-primary/10 dark:from-primary-light/10 dark:to-accent/10 border border-accent/20 dark:border-primary-light/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-text-secondary dark:text-gray-400 mb-2">Trading with:</p>
                  <div className="flex items-center gap-3">
                    {selectedItem.images.length > 0 ? (
                      <img src={selectedItem.images[0]} alt={selectedItem.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text dark:text-gray-100 truncate">{selectedItem.title}</h3>
                      <p className="text-sm text-text-secondary dark:text-gray-400 capitalize">{selectedItem.category} • {selectedItem.condition.replace('-', ' ')}</p>
                    </div>
                  </div>
                </div>

                {/* Distance Filter */}
                <div>
                  <label className="block text-sm font-semibold text-text dark:text-gray-200 mb-2.5">
                    <svg className="w-4 h-4 inline-block mr-1.5 text-accent dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Maximum Distance
                  </label>
                  <div className="w-full">
                    <Dropdown
                      value={swipeMaxDistance}
                      onChange={setSwipeMaxDistance}
                      options={DISTANCE_OPTIONS}
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-semibold text-text dark:text-gray-200 mb-2.5">
                    <svg className="w-4 h-4 inline-block mr-1.5 text-accent dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Categories {swipeCategories.length > 0 && <span className="text-accent dark:text-primary-light">({swipeCategories.length} selected)</span>}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map(category => (
                      <button
                        key={category}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSwipeCategoryToggle(category);
                        }}
                        className={`px-3 py-2 text-sm rounded-lg border transition-all font-medium ${swipeCategories.includes(category)
                            ? 'bg-gradient-to-r from-accent to-accent-dark dark:from-primary-light dark:to-primary text-white border-transparent shadow-sm'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-accent dark:hover:border-primary-light'
                          }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  {swipeCategories.length === 0 && (
                    <p className="mt-2 text-xs text-text-secondary dark:text-gray-400">
                      No categories selected - you'll see items from all categories
                    </p>
                  )}
                </div>

                {/* Condition Filter */}
                <div>
                  <label className="block text-sm font-semibold text-text dark:text-gray-200 mb-2.5">
                    <svg className="w-4 h-4 inline-block mr-1.5 text-accent dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Condition {swipeConditions.length > 0 && <span className="text-accent dark:text-primary-light">({swipeConditions.length} selected)</span>}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CONDITIONS.map(condition => (
                      <button
                        key={condition.value}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSwipeConditionToggle(condition.value);
                        }}
                        className={`px-3 py-2 text-sm rounded-lg border transition-all font-medium ${swipeConditions.includes(condition.value)
                            ? 'bg-gradient-to-r from-accent to-accent-dark dark:from-primary-light dark:to-primary text-white border-transparent shadow-sm'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-accent dark:hover:border-primary-light'
                          }`}
                      >
                        {condition.label}
                      </button>
                    ))}
                  </div>
                  {swipeConditions.length === 0 && (
                    <p className="mt-2 text-xs text-text-secondary dark:text-gray-400">
                      No conditions selected - you'll see items in any condition
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3 flex-shrink-0">
                <Button 
                  onClick={handleResetSwipeFilters} 
                  variant="outline" 
                  className="flex-1"
                >
                  Reset Filters
                </Button>
                <Button 
                  onClick={handleStartSwiping}
                  className="flex-1 !bg-gradient-to-r !from-accent !to-accent-dark dark:!from-primary-light dark:!to-primary hover:shadow-lg hover:shadow-accent/30 dark:hover:shadow-primary/30 transition-shadow"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Start Swiping
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
