# Swipe Trading Loading States

## Overview
The swipe trading interface now has sophisticated loading states that provide smooth transitions and prevent jarring empty states.

## Loading State Flow

### 1. Initial Load
```
User selects trade anchor
    ↓
[Creating Session Phase]
- Progress indicator (Step 1/3)
- "Creating your swipe session"
- Animated spinner with subtitle
    ↓
[Loading Items Phase]
- Progress indicator (Step 2/3)
- "Finding perfect matches"
- Animated spinner with subtitle
    ↓
[Complete Phase]
- Progress indicator (Step 3/3)
- Transition to swipe interface
```

### 2. First Card Display
```
Items loaded
    ↓
[Skeleton Card] → [Actual Card with entrance animation]
- Shimmer effect on skeleton
- Smooth fade-in of real card
- Scale-in animation
```

### 3. During Swiping - Next Card Loading

#### Scenario A: Next card ready
```
User swipes current card
    ↓
Card animates out (400ms)
    ↓
Next card immediately appears
- No loading state needed
- Smooth transition
```

#### Scenario B: Next card not ready yet
```
User swipes current card
    ↓
Card animates out (400ms)
    ↓
[Temporary Loading Overlay]
- Previous card stays visible (blurred)
- Loading spinner overlay appears
- "Loading next card..." message
- Animated dots
    ↓
Next card loads
    ↓
Overlay fades out
New card appears with entrance animation
```

### 4. Background Preloading
```
While user is swiping
    ↓
[Subtle indicator at bottom]
- Small badge: "Preparing next cards"
- Pulsing dot animation
- Doesn't interrupt user flow
```

### 5. Empty State
```
No more items available
    ↓
[Empty State Screen]
- Friendly icon
- "No Matches Found" message
- "Change Trade Anchor" button
```

## Component Responsibilities

### SwipeInterface
- Manages display item state
- Shows loading overlay when next item not ready
- Keeps previous card visible during loading
- Disables buttons during loading

### SwipeCardSkeleton
- Provides placeholder during initial load
- Shimmer animation for visual feedback
- Matches actual card dimensions

### LoadingProgress
- Shows multi-step progress during session creation
- Visual feedback for each phase
- Smooth progress bar animation

### LoadingSpinner
- Enhanced with gradient conic effect
- Supports subtitle for context
- Animated dots for "loading..." text

## Key Features

### Prevents Empty States
- Previous card stays visible while loading next
- Loading overlay provides feedback
- User never sees blank screen

### Smooth Transitions
- Entrance animations for new cards
- Exit animations for swiped cards
- Fade transitions for loading states

### Visual Feedback
- Progress indicators show what's happening
- Loading messages provide context
- Animated elements show activity

### User Experience
- Buttons disabled during loading
- Clear visual states
- No jarring transitions
- Informative messages

## Technical Implementation

### State Management
```typescript
const [displayItem, setDisplayItem] = useState<Item | null>(currentItem);
const [isAnimating, setIsAnimating] = useState(false);

// Keep previous item visible while loading next
useEffect(() => {
  if (!isAnimating) {
    if (currentItem) {
      setDisplayItem(currentItem);
    } else if (hasMoreItems) {
      // Keep showing previous item
    } else {
      setDisplayItem(null);
    }
  }
}, [currentItem, isAnimating, hasMoreItems]);
```

### Loading Overlay
```tsx
{!currentItem && hasMoreItems && displayItem && (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-md">
    <LoadingSpinner message="Loading next card..." />
  </div>
)}
```

### Button States
```tsx
<button
  disabled={isAnimating || (!currentItem && hasMoreItems)}
  // Disabled when animating OR when loading next item
>
```

## Animation Timings

- Card swipe animation: 400ms
- Loading overlay fade-in: 300ms
- Card entrance animation: 400ms
- Skeleton shimmer: 2s loop
- Progress bar transition: 300ms

## Accessibility

- Loading states announced to screen readers
- Buttons properly disabled during loading
- Clear visual indicators
- Keyboard navigation maintained
- ARIA labels on all interactive elements

## Performance

- Hardware-accelerated animations (transform, opacity)
- Efficient state updates
- Minimal re-renders
- Smooth 60fps animations
- Optimized with React.memo where appropriate
