# Implementation Plan: Multi-Card Swipe Interface

## Overview

This implementation transforms the single-card swipe interface into a multi-card layout that displays 2-5 cards simultaneously based on viewport size. The implementation maintains all existing functionality (trade offers, notifications, session management) while introducing new components for grid layout and responsive card display.

## Tasks

- [x] 1. Create CardGrid component with responsive layout
  - Create `src/components/CardGrid.tsx` with grid layout logic
  - Implement CSS Grid with responsive breakpoints (2-5 cards)
  - Add card entrance animations (fade + scale)
  - Add card exit animations (slide + fade)
  - Implement loading placeholder slots
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 1.1 Write property test for CardGrid layout
  - **Property 17: Layout consistency**
  - **Validates: Requirements 2.4**

- [ ]* 1.2 Write property test for viewport containment
  - **Property 18: Viewport containment**
  - **Validates: Requirements 2.2**

- [x] 2. Modify SwipeCard component for compact mode
  - Add `compact` prop to SwipeCard component
  - Reduce padding, font sizes, and avatar size in compact mode
  - Maintain all existing swipe gesture logic
  - Ensure visual feedback works in compact mode
  - Test keyboard navigation in compact mode
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 4.1, 4.2, 4.3, 4.4_

- [ ]* 2.1 Write property test for swipe gesture recognition
  - **Property 3: Swipe gesture recognition**
  - **Validates: Requirements 3.1, 3.2**

- [ ]* 2.2 Write property test for gesture cancellation
  - **Property 5: Gesture cancellation**
  - **Validates: Requirements 3.5**

- [ ]* 2.3 Write property test for visual feedback lifecycle
  - **Property 6: Visual feedback lifecycle**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 3. Create MultiCardSwipeInterface component
  - Create `src/components/MultiCardSwipeInterface.tsx`
  - Implement viewport size detection and card count logic
  - Manage visible subset of item pool (first N items)
  - Handle card swipe callbacks and pass to parent
  - Integrate TradeAnchorDisplay and TipsPanel
  - Manage animating cards state
  - _Requirements: 2.1, 2.5, 3.4, 9.2_

- [ ]* 3.1 Write property test for multi-card display minimum
  - **Property 1: Multi-card display minimum**
  - **Validates: Requirements 2.1**

- [ ]* 3.2 Write property test for responsive card count
  - **Property 15: Responsive card count**
  - **Validates: Requirements 12.1, 12.2**

- [x] 4. Implement batch owner profile loading
  - Add `loadOwnerProfiles` function to SwipeTradingPage
  - Load profiles for multiple items in parallel
  - Create Map<string, UserProfile> for efficient lookup
  - Handle errors gracefully with default profiles
  - _Requirements: 5.6_

- [ ]* 4.1 Write unit tests for batch profile loading
  - Test successful batch loading
  - Test error handling with default profiles
  - Test deduplication of owner IDs
  - _Requirements: 5.6_

- [x] 5. Update SwipeTradingPage to use MultiCardSwipeInterface
  - Replace SwipeInterface with MultiCardSwipeInterface
  - Modify handleSwipe to accept itemId parameter
  - Update item pool management to remove swiped items
  - Adjust preload threshold from 3 to 5 items
  - Pass owner profiles map to MultiCardSwipeInterface
  - _Requirements: 3.4, 6.1, 7.1, 7.2_

- [ ]* 5.1 Write property test for card replacement
  - **Property 4: Card replacement after swipe**
  - **Validates: Requirements 3.4**

- [ ]* 5.2 Write property test for swipe history filtering
  - **Property 9: Swipe history filtering**
  - **Validates: Requirements 7.2**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Add error handling for multi-card scenarios
  - Handle interrupted gestures (touchcancel, mouseleave)
  - Handle multiple simultaneous drags
  - Handle animation timeouts (600ms max)
  - Handle viewport resize during animation
  - Handle session expiration during swiping
  - _Requirements: 3.1, 3.2, 3.3, 7.3_

- [ ]* 7.1 Write unit tests for error scenarios
  - Test interrupted gesture handling
  - Test animation timeout handling
  - Test viewport resize during animation
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Implement accessibility features
  - Add keyboard navigation to CardGrid (arrow keys to focus cards)
  - Ensure all cards have proper ARIA labels
  - Add screen reader announcements for swipe actions
  - Test with keyboard-only navigation
  - Test with screen reader
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 8.1 Write property test for keyboard navigation
  - **Property 11: Keyboard navigation support**
  - **Validates: Requirements 10.1, 10.2, 10.3**

- [ ]* 8.2 Write property test for accessibility markup
  - **Property 12: Accessibility markup completeness**
  - **Validates: Requirements 10.5**

- [x] 9. Add responsive layout styles
  - Create CSS for grid layouts at different breakpoints
  - Desktop (>1280px): 3-column grid, 5 cards max
  - Tablet (768-1280px): 2-column grid, 4 cards max
  - Mobile landscape (640-768px): 3-column grid, 3 cards max
  - Mobile portrait (<640px): 2-column grid, 2 cards min
  - Add debounced resize handler
  - _Requirements: 2.5, 12.1, 12.2, 12.4_

- [ ]* 9.1 Write property test for responsive behavior
  - **Property 15: Responsive card count**
  - **Validates: Requirements 12.1, 12.2**

- [x] 10. Implement touch gesture support
  - Ensure touch events work on all cards
  - Add touch-action: none to prevent browser gestures
  - Test on mobile devices
  - Verify no conflicts with browser gestures
  - _Requirements: 12.3_

- [ ]* 10.1 Write property test for touch gestures
  - **Property 16: Touch gesture support**
  - **Validates: Requirements 12.3**

- [x] 11. Add performance optimizations
  - Use transform and opacity for animations (GPU acceleration)
  - Add loading="lazy" to card images
  - Memoize CardGrid and SwipeCard components
  - Debounce resize events (300ms)
  - _Requirements: 11.1, 11.3_

- [ ]* 11.1 Write property test for animation performance
  - **Property 13: Animation performance**
  - **Validates: Requirements 11.1**

- [ ]* 11.2 Write property test for image preloading
  - **Property 14: Image preloading**
  - **Validates: Requirements 11.3**

- [x] 12. Implement loading states for card positions
  - Show loading placeholder when card slot is empty
  - Display loading indicator while fetching replacement card
  - Remove loading indicator when card loads
  - Handle loading errors gracefully
  - _Requirements: 9.1, 9.2, 9.3_

- [ ]* 12.1 Write property test for loading state cleanup
  - **Property 20: Loading state cleanup**
  - **Validates: Requirements 9.3**

- [ ]* 12.2 Write unit tests for loading states
  - Test initial loading state display
  - Test loading placeholders for empty slots
  - Test loading indicator removal
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 13. Add integration tests for complete swipe flow
  - Test selecting trade anchor and loading multiple cards
  - Test swiping card right and verifying trade offer creation
  - Test swiping card left and verifying no trade offer
  - Test card replacement after swipe
  - Test swipe history filtering
  - _Requirements: 1.2, 3.1, 3.2, 3.4, 6.1, 7.1, 7.2_

- [ ]* 13.1 Write property test for trade offer creation
  - **Property 7: Trade offer creation completeness**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [ ]* 13.2 Write property test for swipe history tracking
  - **Property 8: Swipe history tracking**
  - **Validates: Requirements 7.1**

- [x] 14. Test session persistence with multi-card interface
  - Verify session restoration shows multiple cards
  - Verify swipe history persists across refresh
  - Verify swiped items don't reappear
  - Test changing trade anchor creates new session
  - _Requirements: 7.3, 7.4_

- [ ]* 14.1 Write property test for session persistence
  - **Property 10: Session persistence**
  - **Validates: Requirements 7.4**

- [ ]* 14.2 Write unit tests for session management
  - Test session restoration with multiple cards
  - Test new session creation on anchor change
  - _Requirements: 7.3, 7.4_

- [x] 15. Add empty state handling for multi-card interface
  - Display empty state when all cards are swiped
  - Show "Change Trade Anchor" button in empty state
  - Provide explanatory message
  - Test empty state rendering
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 15.1 Write unit tests for empty state
  - Test empty state display when pool exhausted
  - Test change anchor button presence
  - Test explanatory message content
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 16. Verify card content completeness
  - Ensure all cards display image, title, description
  - Ensure all cards display condition and category badges
  - Ensure all cards display owner name and location
  - Test multi-image navigation on cards with multiple images
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ]* 16.1 Write property test for card content completeness
  - **Property 2: Card content completeness**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

- [ ]* 16.2 Write property test for multi-image navigation
  - **Property 19: Multi-image navigation**
  - **Validates: Requirements 5.7**

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation maintains backward compatibility with existing services (itemPoolService, tradeOfferService, swipeHistoryService)
- Focus on responsive design from the start to avoid rework
- Test on real mobile devices for touch gesture accuracy
