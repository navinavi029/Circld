# Swipe Trading Filters

This document describes the filtering system for the swipe trading feature.

## Overview

Users can now filter items before starting a swipe session based on:
- **Distance**: Maximum distance from the user's location (5km, 10km, 25km, 50km, 100km, or any distance)
- **Categories**: Filter by one or more item categories (Electronics, Furniture, Books, Clothing, Sports & Outdoors, Home & Garden, Toys & Games, Tools, Kitchen)
- **Condition**: Filter by item condition (New, Like New, Good, Fair, Poor)

## User Experience

1. On the trade anchor selection page, users see a "Filters" button
2. Clicking the button expands a filter panel with three sections
3. Users can select their preferences and click "Apply Filters"
4. Filter preferences are saved to localStorage and persist across sessions
5. An active filter count badge shows how many filters are applied
6. Users can reset all filters at once

## Technical Implementation

### Components

**SwipeFilters.tsx**
- Collapsible filter UI component
- Manages filter state and user interactions
- Shows active filter count badge
- Provides reset functionality

### Services

**itemPoolService.ts**
- Updated `buildItemPool()` to accept filter preferences
- Applies filters client-side after fetching from Firestore
- Category filter: Matches item.category against selected categories
- Condition filter: Matches item.condition against selected conditions
- Distance filter: Fetches owner coordinates and calculates distance

### Data Flow

1. User sets filters in SwipeFilters component
2. Filters saved to localStorage as `swipeFilterPreferences`
3. When building item pool, filters passed to `buildItemPool()`
4. Service fetches items from Firestore (3x limit to account for filtering)
5. Client-side filtering applied:
   - Remove already-swiped items
   - Filter by categories (if specified)
   - Filter by conditions (if specified)
   - Filter by distance (if specified and user has coordinates)
6. Return filtered items up to requested limit

### Filter Persistence

Filters are stored in localStorage with the key `swipeFilterPreferences`:

```typescript
{
  maxDistance: number | null,
  categories: string[],
  conditions: string[]
}
```

## Performance Considerations

- Firestore queries fetch 3x the requested limit to account for filtering
- Distance filtering requires fetching owner profiles (parallel requests)
- Items without owner coordinates are excluded when distance filter is active
- Category and condition filters are applied in-memory (fast)

## Future Enhancements

- Add filter presets (e.g., "Nearby Electronics in Good Condition")
- Show filter result count before applying
- Add more granular distance options
- Support custom distance input
- Cache owner coordinates to reduce profile fetches
- Add price range filter
- Add "posted date" filter
