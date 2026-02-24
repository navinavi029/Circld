import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { SwipeFilterPreferences } from '../types/swipe-trading';

interface SwipeFiltersProps {
  onApply: (filters: SwipeFilterPreferences) => void;
  initialFilters?: SwipeFilterPreferences;
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

export function SwipeFilters({ onApply, initialFilters }: SwipeFiltersProps) {
  const [maxDistance, setMaxDistance] = useState<string>(
    initialFilters?.maxDistance?.toString() || 'null'
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters?.categories || []
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    initialFilters?.conditions || []
  );
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (initialFilters) {
      setMaxDistance(initialFilters.maxDistance?.toString() || 'null');
      setSelectedCategories(initialFilters.categories || []);
      setSelectedConditions(initialFilters.conditions || []);
    }
  }, [initialFilters]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleConditionToggle = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleApply = () => {
    const filters: SwipeFilterPreferences = {
      maxDistance: maxDistance === 'null' ? null : parseInt(maxDistance),
      categories: selectedCategories,
      conditions: selectedConditions,
    };
    onApply(filters);
    setShowFilters(false);
  };

  const handleReset = () => {
    setMaxDistance('null');
    setSelectedCategories([]);
    setSelectedConditions([]);
  };

  const activeFilterCount = [
    maxDistance !== 'null',
    selectedCategories.length > 0,
    selectedConditions.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="mb-5">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 rounded-xl shadow-sm hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all text-text dark:text-gray-100 font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-accent to-accent-dark dark:from-primary-light dark:to-primary text-white rounded-full font-semibold">
            {activeFilterCount}
          </span>
        )}
      </button>

      {showFilters && (
        <div className="mt-4 p-5 md:p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-sm border border-white/20 dark:border-gray-700/50 space-y-6 animate-slideDown">
          {/* Distance Filter */}
          <div>
            <label className="block text-sm font-semibold text-text dark:text-gray-200 mb-2.5">
              Maximum Distance
            </label>
            <Select
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              className="w-full"
            >
              {DISTANCE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-text dark:text-gray-200 mb-2.5">
              Categories
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all font-medium ${selectedCategories.includes(category)
                      ? 'bg-gradient-to-r from-accent to-accent-dark dark:from-primary-light dark:to-primary text-white border-transparent shadow-sm'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-accent dark:hover:border-primary-light'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <p className="mt-2.5 text-xs text-text-secondary dark:text-gray-400 font-medium">
                {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
              </p>
            )}
          </div>

          {/* Condition Filter */}
          <div>
            <label className="block text-sm font-semibold text-text dark:text-gray-200 mb-2.5">
              Condition
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CONDITIONS.map(condition => (
                <button
                  key={condition.value}
                  onClick={() => handleConditionToggle(condition.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all font-medium ${selectedConditions.includes(condition.value)
                      ? 'bg-gradient-to-r from-accent to-accent-dark dark:from-primary-light dark:to-primary text-white border-transparent shadow-sm'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-accent dark:hover:border-primary-light'
                    }`}
                >
                  {condition.label}
                </button>
              ))}
            </div>
            {selectedConditions.length > 0 && (
              <p className="mt-2.5 text-xs text-text-secondary dark:text-gray-400 font-medium">
                {selectedConditions.length} {selectedConditions.length === 1 ? 'condition' : 'conditions'} selected
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200/60 dark:border-gray-700/60">
            <Button 
              onClick={handleApply} 
              className="flex-1 !bg-gradient-to-r !from-accent !to-accent-dark dark:!from-primary-light dark:!to-primary hover:shadow-lg hover:shadow-accent/30 dark:hover:shadow-primary/30 transition-shadow"
            >
              Apply Filters
            </Button>
            <Button onClick={handleReset} variant="outline" className="flex-1">
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
