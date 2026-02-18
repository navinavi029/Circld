# Design Document: Multi-Card Swipe Interface

## Overview

This design transforms the existing single-card swipe interface into a multi-card layout that displays multiple items simultaneously. The current implementation shows one card at a time in the center of the screen, requiring users to swipe through items sequentially. The new design will display 3-5 cards in a grid or stacked layout, allowing users to see multiple options at once and swipe individual cards independently.

The multi-card interface maintains the core swipe mechanics (left to pass, right to like) while improving browsing efficiency. Users can compare multiple items side-by-side and make faster decisions. The design preserves all existing functionality including trade offer creation, swipe history tracking, and session management.

### Key Design Goals

1. Display multiple cards simultaneously without overwhelming the user
2. Maintain intuitive swipe gestures for individual cards
3. Ensure smooth animations and responsive performance
4. Support both desktop and mobile viewports
5. Preserve existing trade offer and notification workflows
6. Maintain accessibility for keyboard and screen reader users

## Architecture

### Component Hierarchy

The multi-card interface introduces a new component structure while maintaining compatibility with existing services:

```
SwipeTradingPage (existing)
├── TradeAnchorSelector (existing)
└── MultiCardSwipeInterface (new)
    ├── TradeAnchorDisplay (existing)
    ├── CardGrid (new)
    │   ├── SwipeCard (modified)
    │   ├── SwipeCard (modified)
    │   └── SwipeCard (modified)
    └── TipsPanel (existing)
```

### Component Responsibilities

**MultiCardSwipeInterface** (new component)
- Manages the display of multiple cards simultaneously
- Coordinates card loading and replacement
- Handles layout responsiveness based on viewport size
- Maintains the trade anchor display and tips panel
- Delegates individual card swipe events to parent

**CardGrid** (new component)
- Arranges cards in a responsive grid layout
- Manages card positioning and spacing
- Handles card entrance/exit animations
- Determines optimal number of visible cards based on screen size
- Provides loading placeholders for cards being fetched

**SwipeCard** (modified component)
- Retains all existing swipe gesture handling
- Adapts to smaller size in grid layout
- Maintains visual feedback during drag
- Triggers callbacks on swipe completion
- Supports keyboard navigation

### Data Flow

1. **Initial Load**: SwipeTradingPage loads item pool (20 items) and passes to MultiCardSwipeInterface
2. **Card Display**: MultiCardSwipeInterface determines visible card count (3-5) and passes items to CardGrid
3. **Swipe Action**: User swipes a card → SwipeCard handles gesture → Callback to MultiCardSwipeInterface → Callback to SwipeTradingPage
4. **Card Replacement**: SwipeTradingPage removes swiped item from pool, loads replacement if needed, passes updated pool to MultiCardSwipeInterface
5. **Pool Refresh**: When pool drops below threshold (5 items), SwipeTradingPage preloads more items

## Components and Interfaces

### MultiCardSwipeInterface Component

```typescript
interface MultiCardSwipeInterfaceProps {
  tradeAnchor: Item;
  itemPool: Item[];
  ownerProfiles: Map<string, UserProfile>;
  onSwipe: (itemId: string, direction: 'left' | 'right') => void;
  onChangeAnchor: () => void;
  loading: boolean;
  syncStatus: string | null;
}

interface MultiCardSwipeInterfaceState {
  visibleCardCount: number;
  showTips: boolean;
  animatingCards: Set<string>;
}
```

**Responsibilities:**
- Determines how many cards to show based on viewport size
- Manages the visible subset of the item pool
- Coordinates animations for card entrance/exit
- Provides loading states for individual card positions
- Maintains tips panel and trade anchor display

**Layout Logic:**
- Desktop (>1280px): 5 cards in 2 rows (3 top, 2 bottom)
- Tablet (768-1280px): 4 cards in 2x2 grid
- Mobile landscape (640-768px): 3 cards in row
- Mobile portrait (<640px): 2 cards in column

### CardGrid Component

```typescript
interface CardGridProps {
  items: Item[];
  ownerProfiles: Map<string, UserProfile>;
  onSwipe: (itemId: string, direction: 'left' | 'right') => void;
  animatingCards: Set<string>;
  loadingSlots: number;
}

interface CardPosition {
  itemId: string;
  gridPosition: number;
  isAnimating: boolean;
}
```

**Responsibilities:**
- Renders cards in responsive grid layout
- Manages card positioning with CSS Grid
- Handles card entrance animations (fade + scale)
- Handles card exit animations (slide + fade)
- Shows loading placeholders for empty slots

**Grid Layout:**
```css
.card-grid {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  
  /* Desktop: 3 columns */
  @media (min-width: 1280px) {
    grid-template-columns: repeat(3, 1fr);
    max-width: 1400px;
  }
  
  /* Tablet: 2 columns */
  @media (min-width: 768px) and (max-width: 1279px) {
    grid-template-columns: repeat(2, 1fr);
    max-width: 900px;
  }
  
  /* Mobile landscape: 3 columns (smaller cards) */
  @media (min-width: 640px) and (max-width: 767px) {
    grid-template-columns: repeat(3, 1fr);
    max-width: 700px;
  }
  
  /* Mobile portrait: 2 columns */
  @media (max-width: 639px) {
    grid-template-columns: repeat(2, 1fr);
    max-width: 500px;
  }
}
```

### Modified SwipeCard Component

The existing SwipeCard component will be modified to work in a grid context:

**Changes:**
1. Accept optional `compact` prop for smaller display in grid
2. Reduce padding and font sizes in compact mode
3. Limit description to 2 lines (already implemented)
4. Maintain all existing swipe gesture logic
5. Adjust drag threshold for smaller card size

```typescript
interface SwipeCardProps {
  item: Item;
  ownerProfile: UserProfile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  compact?: boolean; // New prop
}
```

**Compact Mode Adjustments:**
- Reduce card padding from 6 to 4
- Reduce title font size from 2xl to xl
- Reduce description font size from base to sm
- Reduce owner avatar from 14 to 10
- Maintain swipe threshold at 100px
- Keep all visual feedback (overlays, animations)

### SwipeTradingPage Modifications

The existing SwipeTradingPage component needs minimal changes:

**Changes:**
1. Replace `SwipeInterface` with `MultiCardSwipeInterface`
2. Modify `handleSwipe` to accept `itemId` parameter
3. Load owner profiles for multiple items (batch loading)
4. Adjust preload threshold from 3 to 5 items

```typescript
// Modified handleSwipe signature
const handleSwipe = async (itemId: string, direction: 'left' | 'right') => {
  const item = itemPool.find(i => i.id === itemId);
  if (!item) return;
  
  // Existing logic remains the same
  await recordSwipe(session.id, user.uid, itemId, direction);
  
  if (direction === 'right') {
    await handleRightSwipe(item);
  }
  
  // Remove item from pool
  setItemPool(prev => prev.filter(i => i.id !== itemId));
  
  // Preload if running low
  if (itemPool.length <= 5) {
    preloadMoreItems();
  }
};
```

**Owner Profile Loading:**
```typescript
// New function to batch load owner profiles
const loadOwnerProfiles = async (items: Item[]): Promise<Map<string, UserProfile>> => {
  const profiles = new Map<string, UserProfile>();
  const uniqueOwnerIds = [...new Set(items.map(item => item.ownerId))];
  
  await Promise.all(
    uniqueOwnerIds.map(async (ownerId) => {
      try {
        const profileDoc = await getDoc(doc(db, 'users', ownerId));
        if (profileDoc.exists()) {
          profiles.set(ownerId, profileDoc.data() as UserProfile);
        } else {
          profiles.set(ownerId, createDefaultProfile(ownerId));
        }
      } catch (err) {
        console.error('Error loading profile:', ownerId, err);
        profiles.set(ownerId, createDefaultProfile(ownerId));
      }
    })
  );
  
  return profiles;
};
```

## Data Models

### Existing Models (No Changes)

The feature uses existing data models without modification:

- `Item`: Represents a tradeable item
- `UserProfile`: Represents item owner information
- `SwipeSession`: Tracks swipe session state
- `SwipeRecord`: Records individual swipe actions
- `TradeOffer`: Created on right swipe

### New State Models

**CardAnimationState**
```typescript
interface CardAnimationState {
  itemId: string;
  state: 'entering' | 'visible' | 'exiting';
  direction?: 'left' | 'right';
  timestamp: number;
}
```

**ViewportConfig**
```typescript
interface ViewportConfig {
  width: number;
  height: number;
  cardCount: number;
  layout: 'grid-2x2' | 'grid-3x2' | 'grid-2x1' | 'grid-3x1';
  compact: boolean;
}
```

## Correctness Properties


A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Multi-card display minimum

*For any* item pool with at least 3 items, the interface should display at least 3 cards simultaneously when loaded.

**Validates: Requirements 2.1**

### Property 2: Card content completeness

*For any* rendered card, it should display all required information: item image, title, description, condition, category, and owner name and location.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 3: Swipe gesture recognition

*For any* card, when dragged beyond the threshold distance (100px), the system should register the correct action based on direction (left = pass, right = like).

**Validates: Requirements 3.1, 3.2**

### Property 4: Card replacement after swipe

*For any* card that is swiped away, if more items are available in the pool, a new card should appear to replace it.

**Validates: Requirements 3.4**

### Property 5: Gesture cancellation

*For any* card dragged less than the threshold distance, releasing the drag should return the card to its original position without registering an action.

**Validates: Requirements 3.5**

### Property 6: Visual feedback lifecycle

*For any* card being dragged, visual indicators should appear showing the intended action (like/pass), intensify when threshold is exceeded, and disappear if the drag is cancelled.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 7: Trade offer creation completeness

*For any* right swipe action, the created trade offer should contain all required data: offering user ID, trade anchor ID, trade anchor owner ID, target item ID, target item owner ID, status set to "pending", and a notification created for the target item owner.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 8: Swipe history tracking

*For any* swipe action (left or right), the system should record the swipe in the session history with the correct item ID and direction.

**Validates: Requirements 7.1**

### Property 9: Swipe history filtering

*For any* item that has been swiped in the current session, it should not appear again when loading new cards.

**Validates: Requirements 7.2**

### Property 10: Session persistence

*For any* swipe session, the swipe history should persist across page refreshes until the user changes their trade anchor.

**Validates: Requirements 7.4**

### Property 11: Keyboard navigation support

*For any* focused card, pressing the left arrow key should trigger a pass action and pressing the right arrow key should trigger a like action.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 12: Accessibility markup completeness

*For any* interactive element (card, button, control), it should have an appropriate ARIA label or role attribute.

**Validates: Requirements 10.5**

### Property 13: Animation performance

*For any* card swipe animation, it should complete within 500ms from gesture release to card removal.

**Validates: Requirements 11.1**

### Property 14: Image preloading

*For any* visible card, its images should be preloaded before the card is displayed to the user.

**Validates: Requirements 11.3**

### Property 15: Responsive card count

*For any* viewport size, the system should display the appropriate number of cards: 5 for desktop (>1280px), 4 for tablet (768-1280px), 3 for mobile landscape (640-768px), and 2 for mobile portrait (<640px).

**Validates: Requirements 12.1, 12.2**

### Property 16: Touch gesture support

*For any* card on a touch device, touch drag gestures should trigger the same swipe actions as mouse drag gestures.

**Validates: Requirements 12.3**

### Property 17: Layout consistency

*For any* set of displayed cards, they should have uniform dimensions and spacing between them.

**Validates: Requirements 2.4**

### Property 18: Viewport containment

*For any* viewport size, all displayed cards should fit within the viewport without requiring horizontal scrolling.

**Validates: Requirements 2.2**

### Property 19: Multi-image navigation

*For any* card displaying an item with multiple images, navigation controls (prev/next buttons and dot indicators) should be present and functional.

**Validates: Requirements 5.7**

### Property 20: Loading state cleanup

*For any* loading operation that completes, all loading indicators should be removed from the interface.

**Validates: Requirements 9.3**

## Error Handling

### Swipe Gesture Errors

**Problem**: User drags card but gesture is interrupted (e.g., touch cancelled, mouse leaves window)

**Solution**: 
- Add event listeners for `touchcancel` and `mouseleave` events
- Reset card position and clear drag state on interruption
- Log interrupted gestures for debugging
- Ensure no partial state remains

**Problem**: Multiple cards are being dragged simultaneously (multi-touch)

**Solution**:
- Track active drag by card ID
- Ignore new drag starts while a drag is in progress
- On touch devices, use `touch-action: none` to prevent browser gestures
- Clear drag state on touch end

### Card Loading Errors

**Problem**: Owner profile fails to load for a card

**Solution**:
- Display default profile with "Unknown User" name
- Log error with item ID and owner ID
- Continue displaying card with available information
- Retry profile load in background

**Problem**: Item pool exhausted but cards still visible

**Solution**:
- Show empty state overlay when pool is empty
- Disable swipe gestures on remaining cards
- Provide "Change Trade Anchor" button
- Clear any loading indicators

**Problem**: Network error while preloading more items

**Solution**:
- Continue showing existing cards
- Display subtle error notification
- Retry preload with exponential backoff
- Allow user to manually trigger reload

### Animation Errors

**Problem**: Card animation doesn't complete (stuck in animating state)

**Solution**:
- Set maximum animation duration timeout (600ms)
- Force complete animation after timeout
- Remove card from animating set
- Log animation timeout for debugging

**Problem**: Multiple animations conflict (rapid swiping)

**Solution**:
- Queue swipe actions during animation
- Process queue after animation completes
- Limit queue size to prevent memory issues
- Disable swipe gestures during animation

### Responsive Layout Errors

**Problem**: Viewport resize during card animation

**Solution**:
- Complete current animations before recalculating layout
- Debounce resize events (300ms)
- Maintain card positions during resize
- Recalculate grid after animations complete

**Problem**: Card dimensions don't fit calculated grid

**Solution**:
- Use CSS Grid with `minmax()` for flexible sizing
- Set maximum card width to prevent overflow
- Use `aspect-ratio` for consistent card shapes
- Add overflow handling for edge cases

### Session State Errors

**Problem**: Session expires while user is swiping

**Solution**:
- Cache swipes locally until session is restored
- Show sync status indicator
- Attempt to restore session on next action
- Provide "Create New Session" option if restoration fails

**Problem**: Trade anchor becomes unavailable during session

**Solution**:
- Detect anchor unavailability on next swipe
- Show error message explaining the situation
- Automatically return to anchor selection
- Clear cached session state

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Empty state rendering when pool is exhausted
- Loading state display during initial load
- Trade anchor selector display when no anchor selected
- Orientation change handling
- Error state display and recovery actions

**Property-Based Tests**: Verify universal properties across all inputs
- Card content completeness across random items
- Swipe gesture recognition across random drag distances
- Layout responsiveness across random viewport sizes
- History filtering across random swipe sequences
- Trade offer creation across random item pairs

### Property-Based Testing Configuration

- Use `@fast-check/jest` for TypeScript/React property-based testing
- Configure each property test to run minimum 100 iterations
- Tag each test with feature name and property number
- Example tag: `Feature: multi-card-swipe-interface, Property 2: Card content completeness`

### Component Testing

**MultiCardSwipeInterface Tests**:
- Renders correct number of cards for viewport size
- Updates card count on viewport resize
- Handles card swipe callbacks correctly
- Manages loading states for card positions
- Displays trade anchor and tips panel

**CardGrid Tests**:
- Arranges cards in correct grid layout
- Handles card entrance animations
- Handles card exit animations
- Shows loading placeholders for empty slots
- Maintains card positions during animations

**SwipeCard Tests** (modifications):
- Renders correctly in compact mode
- Maintains swipe gesture recognition in compact mode
- Adjusts visual feedback for smaller size
- Supports keyboard navigation
- Handles multi-image navigation

### Integration Testing

**End-to-End Swipe Flow**:
1. Select trade anchor
2. Verify multiple cards load
3. Swipe card right
4. Verify trade offer created
5. Verify notification sent
6. Verify card replaced
7. Verify swiped item not shown again

**Session Persistence Flow**:
1. Select trade anchor and swipe several cards
2. Refresh page
3. Verify session restored
4. Verify swipe history preserved
5. Verify swiped items not shown again

**Responsive Layout Flow**:
1. Load interface on desktop
2. Verify 5 cards displayed
3. Resize to tablet
4. Verify 4 cards displayed
5. Resize to mobile
6. Verify 2 cards displayed

### Performance Testing

**Animation Performance**:
- Measure swipe animation duration (target: <500ms)
- Measure frame rate during animations (target: 60fps)
- Test with multiple simultaneous animations
- Verify no jank or stuttering

**Load Performance**:
- Measure initial load time (target: <2s)
- Measure card replacement time (target: <500ms)
- Test with slow network conditions
- Verify progressive loading works correctly

**Memory Performance**:
- Monitor memory usage with large item pools
- Verify no memory leaks from animations
- Test rapid swiping for memory spikes
- Verify proper cleanup on unmount

### Accessibility Testing

**Keyboard Navigation**:
- Tab through all cards
- Use arrow keys to swipe
- Verify focus management
- Test with screen reader

**Screen Reader Testing**:
- Verify card content is announced
- Verify swipe actions are announced
- Test ARIA labels and roles
- Verify live region updates

**Visual Testing**:
- Test with high contrast mode
- Test with reduced motion preference
- Verify color contrast ratios
- Test with zoom levels up to 200%

## Implementation Notes

### Performance Optimizations

1. **Virtual Scrolling**: Not needed for 2-5 cards, but consider if expanding to more cards
2. **Image Lazy Loading**: Use `loading="lazy"` for images in non-visible cards
3. **Animation Optimization**: Use `transform` and `opacity` for GPU acceleration
4. **Debouncing**: Debounce resize events to prevent excessive recalculations
5. **Memoization**: Memoize card components to prevent unnecessary re-renders

### Browser Compatibility

- Target: Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid: Supported in all target browsers
- Touch Events: Use pointer events for better compatibility
- Animations: Use CSS transitions with fallbacks
- Flexbox: Use as fallback for older browsers

### Mobile Considerations

- Touch target size: Minimum 44x44px for interactive elements
- Swipe threshold: May need adjustment for smaller screens
- Gesture conflicts: Prevent browser pull-to-refresh during swipe
- Performance: Test on mid-range devices for smooth animations
- Network: Handle offline mode with cached swipes

### Future Enhancements

1. **Card Stacking**: Alternative layout with stacked cards (Tinder-style)
2. **Batch Actions**: Select multiple cards and swipe all at once
3. **Filters**: Filter visible cards by category, condition, distance
4. **Sorting**: Sort cards by date, distance, or relevance
5. **Preview Mode**: Hover to see larger preview without swiping
6. **Undo**: Allow users to undo recent swipes
7. **Favorites**: Mark cards for later review without swiping
