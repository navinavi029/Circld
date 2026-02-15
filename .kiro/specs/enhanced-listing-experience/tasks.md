# Implementation Plan: Enhanced Listing Experience

## Overview

This implementation plan breaks down the enhanced listing experience feature into discrete, incremental coding tasks. The approach follows a bottom-up strategy: first extending data models and utilities, then building new components, and finally integrating everything into the existing pages. Each task builds on previous work to ensure continuous functionality.

## Tasks

- [x] 1. Extend data models and types
  - Create new TypeScript interfaces for ItemMetadata, UserFavorite, ItemView, EnhancedItem
  - Add StatusChange interface for item history tracking
  - Update existing Item type to include new optional fields (viewCount, favoriteCount, statusHistory, updatedAt)
  - _Requirements: 2.2, 2.3, 4.3, 4.4, 6.3, 14.3, 14.4_

- [x] 2. Implement metadata management utilities
  - [x] 2.1 Create src/utils/metadata.ts with functions for view tracking and favorites
    - Implement incrementViewCount function with 24-hour deduplication logic
    - Implement toggleFavorite function for adding/removing favorites
    - Implement getFavoriteStatus function for checking if user has favorited an item
    - Implement getItemMetadata function for fetching view/favorite counts
    - _Requirements: 4.2, 4.3, 4.4, 4.8, 4.9, 14.1, 14.2_
  
  - [x] 2.2 Write property test for view deduplication
    - **Property 12: View deduplication**
    - **Validates: Requirements 4.9**
  
  - [x] 2.3 Write property test for favorite toggle
    - **Property 8: Favorite toggle behavior**
    - **Validates: Requirements 4.2**
  
  - [x] 2.4 Write property test for favorite count consistency
    - **Property 9: Favorite count consistency**
    - **Validates: Requirements 4.3, 4.4**

- [x] 3. Implement related items algorithm
  - [x] 3.1 Create src/utils/relatedItems.ts with scoring and filtering logic
    - Implement findRelatedItems function with category/condition/owner scoring
    - Implement scoring algorithm: same category (+10), same condition (+5), same owner (+3), recent (+2)
    - Sort by score descending, then by createdAt descending
    - Limit results to 8 items maximum
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  
  - [x] 3.2 Write property test for category prioritization
    - **Property 13: Related items category prioritization**
    - **Validates: Requirements 5.2**
  
  - [x] 3.3 Write property test for condition consideration
    - **Property 14: Related items condition consideration**
    - **Validates: Requirements 5.3**
  
  - [x] 3.4 Write property test for same owner inclusion
    - **Property 15: Related items same owner inclusion**
    - **Validates: Requirements 5.4**
  
  - [x] 3.5 Write property test for count limit
    - **Property 16: Related items count limit**
    - **Validates: Requirements 5.5**

- [x] 4. Extend location utilities
  - [x] 4.1 Add distance calculation and formatting functions to src/utils/location.ts
    - Implement calculateDistanceForItem function that handles null coordinates
    - Implement formatDistanceDisplay function with meters/km/100+ logic
    - Ensure haversine formula is used correctly
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7_
  
  - [x] 4.2 Write property test for distance calculation
    - **Property 25: Distance calculation**
    - **Validates: Requirements 9.7**
  
  - [x] 4.3 Write unit tests for distance formatting edge cases
    - Test distance < 1 km displays in meters
    - Test distance > 100 km displays "100+ km away"
    - _Requirements: 9.3, 9.4_

- [x] 5. Create time formatting utilities
  - [x] 5.1 Create src/utils/timeFormat.ts with time display functions
    - Implement formatTimeAgo function (e.g., "2 hours ago", "3 days ago")
    - Implement formatMemberSince function (e.g., "Member since Jan 2024")
    - Handle edge cases for very recent times (< 1 minute)
    - _Requirements: 2.5, 3.3_
  
  - [x] 5.2 Write unit tests for time formatting
    - Test various time ranges (minutes, hours, days, months, years)
    - Test edge cases (0 seconds, very old dates)
    - _Requirements: 2.5, 3.3_

- [x] 6. Checkpoint - Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create ImageGallery component
  - [x] 7.1 Create src/components/ImageGallery.tsx with main image view and thumbnails
    - Implement main image viewport with aspect ratio control
    - Implement thumbnail strip with click handlers
    - Implement image selection state management
    - Add image counter display
    - Handle empty image array with placeholder
    - _Requirements: 1.1, 1.2, 1.3, 1.7_
  
  - [x] 7.2 Write property test for thumbnail synchronization
    - **Property 1: Image gallery thumbnail synchronization**
    - **Validates: Requirements 1.2, 1.3**
  
  - [x] 7.3 Write unit test for empty image array
    - Test placeholder displays when images array is empty
    - _Requirements: 1.7_

- [x] 8. Add lightbox functionality to ImageGallery
  - [x] 8.1 Implement fullscreen lightbox modal in ImageGallery component
    - Add lightbox state management (open/close)
    - Implement fullscreen overlay with backdrop
    - Add navigation arrows for previous/next
    - Implement keyboard navigation (arrow keys, escape)
    - Add close button
    - _Requirements: 1.4, 1.5, 1.6_
  
  - [x] 8.2 Write property test for lightbox keyboard navigation
    - **Property 2: Lightbox keyboard navigation**
    - **Validates: Requirements 1.4, 1.5**

- [x] 9. Create QuickActions component
  - [x] 9.1 Create src/components/QuickActions.tsx for favorite and share buttons
    - Implement favorite button with toggle functionality
    - Implement share button with menu trigger
    - Add hover effects and positioning
    - Prevent click propagation to parent card
    - Add loading states for async operations
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [x] 9.2 Write property test for quick action non-navigation
    - **Property 22: Quick action non-navigation**
    - **Validates: Requirements 8.5**
  
  - [x] 9.3 Write unit test for share menu display
    - Test share menu opens with correct options
    - _Requirements: 8.7_

- [x] 10. Create ShareMenu component
  - [x] 10.1 Create src/components/ShareMenu.tsx with sharing options
    - Implement copy link functionality with clipboard API
    - Add email share option with mailto link
    - Add social media share options (Twitter, Facebook)
    - Display confirmation message after copy
    - Handle clipboard API errors gracefully
    - _Requirements: 4.5, 4.6, 4.7_
  
  - [x] 10.2 Write property test for clipboard copy operation
    - **Property 10: Clipboard copy operation**
    - **Validates: Requirements 4.7**

- [x] 11. Create ItemHistory component
  - [x] 11.1 Create src/components/ItemHistory.tsx for displaying item timeline
    - Fetch and display status history from item document
    - Display creation event with timestamp
    - Display status changes with timestamps
    - Display last update timestamp if available
    - Sort events in reverse chronological order
    - Handle items with no status history (show only creation)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [x] 11.2 Write property test for history chronological ordering
    - **Property 19: Item history chronological ordering**
    - **Validates: Requirements 6.5**
  
  - [x] 11.3 Write unit test for no status changes edge case
    - Test only creation event displays when no status changes exist
    - _Requirements: 6.6_

- [x] 12. Create RelatedItems component
  - [x] 12.1 Create src/components/RelatedItems.tsx for displaying similar items
    - Use findRelatedItems utility to fetch related items
    - Display items in horizontal scrollable grid
    - Limit display to 8 items maximum
    - Hide section when no related items exist
    - Implement click handlers for navigation
    - Add loading state while fetching
    - _Requirements: 5.1, 5.5, 5.6, 5.7_
  
  - [x] 12.2 Write property test for related item navigation
    - **Property 17: Related item navigation**
    - **Validates: Requirements 5.7**
  
  - [x] 12.3 Write unit test for no related items edge case
    - Test section is hidden when no related items exist
    - _Requirements: 5.6_

- [x] 13. Checkpoint - Ensure all component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 14. Enhance ListingCard component
  - [x] 14.1 Update src/pages/Listings.tsx to enhance listing cards
    - Add hover effects (shadow, image scale)
    - Integrate QuickActions component
    - Display owner name or initials
    - Display distance information using location utilities
    - Display conditional metadata (view count, favorite count, image count)
    - Ensure 4:3 aspect ratio for images
    - Add proper click handling (card vs quick actions)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.8, 9.2, 9.6, 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 14.2 Write property test for listing card complete rendering
    - **Property 20: Listing card complete rendering**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**
  
  - [ ] 14.3 Write property test for listing card hover effects
    - **Property 21: Listing card hover effects**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
  
  - [ ] 14.4 Write property test for card click navigation
    - **Property 24: Card click navigation**
    - **Validates: Requirements 8.8**
  
  - [ ] 14.5 Write property test for conditional metadata display
    - **Property 29: Conditional metadata display**
    - **Validates: Requirements 10.2, 10.3, 10.4**

- [ ] 15. Implement distance calculation for listing cards
  - [x] 15.1 Add distance calculation logic to Listings page
    - Fetch current user's location from UserProfile
    - Calculate distance for each item using owner coordinates
    - Format distance for display
    - Handle missing coordinates gracefully (show city/region only)
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [ ] 15.2 Write property test for distance display with location data
    - **Property 26: Distance display with location data**
    - **Validates: Requirements 9.1, 9.2**
  
  - [ ] 15.3 Write property test for location fallback display
    - **Property 27: Location fallback display**
    - **Validates: Requirements 9.5**

- [ ] 16. Enhance ItemDetail page with new components
  - [ ] 16.1 Update src/pages/ItemDetail.tsx to integrate new components
    - Replace basic image display with ImageGallery component
    - Add favorite button with toggle functionality
    - Add share button with ShareMenu component
    - Display view count and favorite count
    - Integrate ItemHistory component
    - Integrate RelatedItems component at bottom
    - Track view on page load with deduplication
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.2, 2.3, 4.1, 4.5, 4.8, 5.1, 6.1_
  
  - [ ] 16.2 Write property test for complete item information display
    - **Property 3: Complete item information display**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5**
  
  - [ ] 16.3 Write property test for view count increment
    - **Property 11: View count increment**
    - **Validates: Requirements 4.8**

- [ ] 17. Enhance owner information section
  - [ ] 17.1 Update owner card in ItemDetail page with enhanced information
    - Display owner's active listings count
    - Display member since date using formatMemberSince
    - Add button to view owner's profile
    - Add button to view all owner's listings
    - Display "Your Item" indicator when user is owner
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [ ] 17.2 Write property test for complete owner information display
    - **Property 6: Complete owner information display**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [ ] 17.3 Write property test for ownership indicator
    - **Property 7: Ownership indicator**
    - **Validates: Requirements 3.6**

- [ ] 18. Implement responsive image handling
  - [ ] 18.1 Add responsive image features to ImageGallery and ListingCard
    - Add responsive CSS classes for different viewport sizes
    - Implement lazy loading with loading="lazy" attribute
    - Add loading skeletons for images
    - Add error placeholders with retry buttons
    - Handle portrait vs landscape orientation based on device
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  
  - [ ] 18.2 Write property test for responsive image gallery sizing
    - **Property 30: Responsive image gallery sizing**
    - **Validates: Requirements 11.1**
  
  - [ ] 18.3 Write property test for image lazy loading
    - **Property 31: Image lazy loading**
    - **Validates: Requirements 11.5**
  
  - [ ] 18.4 Write unit tests for image loading and error states
    - Test loading skeleton displays while loading
    - Test error placeholder displays on load failure
    - _Requirements: 11.6, 11.7_

- [ ] 19. Checkpoint - Ensure all integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Implement accessibility features
  - [ ] 20.1 Add accessibility attributes to all components
    - Add ARIA labels to all interactive elements
    - Add alt text to all images using item titles
    - Implement ARIA live regions for state changes
    - Add visible focus indicators to all focusable elements
    - Ensure logical tab order with proper tabindex values
    - Add keyboard navigation support to all interactive components
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [ ] 20.2 Write property test for keyboard accessibility
    - **Property 34: Keyboard accessibility**
    - **Validates: Requirements 12.2**
  
  - [ ] 20.3 Write property test for ARIA labels presence
    - **Property 35: ARIA labels presence**
    - **Validates: Requirements 12.3**
  
  - [ ] 20.4 Write property test for image alt text
    - **Property 36: Image alt text**
    - **Validates: Requirements 12.4**
  
  - [ ] 20.5 Write property test for logical tab order
    - **Property 38: Logical tab order**
    - **Validates: Requirements 12.6**

- [ ] 21. Implement color contrast compliance
  - [ ] 21.1 Audit and update colors for WCAG AA compliance
    - Check all text/background color combinations
    - Ensure 4.5:1 contrast ratio for normal text
    - Ensure 3:1 contrast ratio for large text
    - Update colors that don't meet standards
    - Test with contrast checking tools
    - _Requirements: 12.7_
  
  - [ ] 21.2 Write property test for color contrast compliance
    - **Property 39: Color contrast compliance**
    - **Validates: Requirements 12.7**

- [ ] 22. Implement data persistence layer
  - [ ] 22.1 Create Firestore operations for favorites and views
    - Implement createFavorite function to add favorite documents
    - Implement deleteFavorite function to remove favorite documents
    - Implement createItemView function to track views
    - Implement updateItemMetadata function to update counts
    - Use Firestore transactions for count updates to handle concurrency
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.6_
  
  - [ ] 22.2 Write property test for favorite persistence
    - **Property 42: Favorite persistence**
    - **Validates: Requirements 14.1**
  
  - [ ] 22.3 Write property test for view count persistence
    - **Property 43: View count persistence**
    - **Validates: Requirements 14.2**
  
  - [ ] 22.4 Write property test for favorite document structure
    - **Property 44: Favorite document structure**
    - **Validates: Requirements 14.3**
  
  - [ ] 22.5 Write property test for item metadata structure
    - **Property 45: Item metadata structure**
    - **Validates: Requirements 14.4**
  
  - [ ] 22.6 Write property test for concurrent update handling
    - **Property 47: Concurrent update handling**
    - **Validates: Requirements 14.6**

- [ ] 23. Implement favorite status loading
  - [ ] 23.1 Add favorite status fetching to Listings page
    - Fetch all user favorites on page load
    - Apply favorited state to matching items
    - Update UI to reflect favorite status
    - Handle unauthenticated users gracefully
    - _Requirements: 14.5_
  
  - [ ] 23.2 Write property test for favorite status loading
    - **Property 46: Favorite status loading**
    - **Validates: Requirements 14.5**

- [ ] 24. Implement cascade deletion
  - [ ] 24.1 Add cascade deletion logic for item removal
    - When item is deleted, query favorites collection for matching itemId
    - Delete all favorite documents with matching itemId
    - Delete all view documents with matching itemId
    - Use batch operations for efficiency
    - _Requirements: 14.7_
  
  - [ ] 24.2 Write property test for cascade deletion
    - **Property 48: Cascade deletion**
    - **Validates: Requirements 14.7**

- [ ] 25. Update Firestore security rules
  - [ ] 25.1 Add security rules for new collections
    - Add rules for favorites collection (read: authenticated, create/delete: owner only)
    - Add rules for item_views collection (read: authenticated, create: anyone)
    - Update items collection rules to allow metadata updates
    - Test rules with Firestore emulator
    - _Requirements: 14.1, 14.2_

- [ ] 26. Implement error handling and loading states
  - [ ] 26.1 Add comprehensive error handling to all components
    - Wrap Firestore operations in try-catch blocks
    - Display user-friendly error messages
    - Add retry buttons for failed operations
    - Implement loading states for async operations
    - Handle network failures gracefully
    - _Requirements: 13.7_
  
  - [ ] 26.2 Write property test for network error handling
    - **Property 41: Network error handling**
    - **Validates: Requirements 13.7**

- [ ] 27. Implement pagination for listings
  - [ ] 27.1 Add pagination to Listings page
    - Implement page state management
    - Add pagination controls (previous, next, page numbers)
    - Limit items per page to 20
    - Update URL with page parameter
    - Scroll to top on page change
    - _Requirements: 13.6_
  
  - [ ] 27.2 Write property test for pagination functionality
    - **Property 40: Pagination functionality**
    - **Validates: Requirements 13.6**

- [ ] 28. Final checkpoint - Comprehensive testing
  - Run all unit tests and property tests
  - Test all user flows manually
  - Test on different screen sizes (mobile, tablet, desktop)
  - Test with keyboard navigation
  - Test with screen reader (VoiceOver or NVDA)
  - Verify all Firestore operations work correctly
  - Check performance with large datasets
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 29. Performance optimization
  - [ ] 29.1 Optimize component rendering and data fetching
    - Implement React.memo for expensive components
    - Add useMemo for expensive calculations (distance, related items scoring)
    - Implement useCallback for event handlers
    - Optimize Firestore queries with proper indexing
    - Add caching for frequently accessed data
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 30. Documentation and cleanup
  - [ ] 30.1 Add code documentation and clean up
    - Add JSDoc comments to all utility functions
    - Add component prop documentation
    - Update README with new features
    - Remove any console.log statements
    - Clean up unused imports
    - Format code consistently

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: utilities → components → integration
- All Firestore operations use transactions to ensure data consistency
- Accessibility is built in from the start, not added as an afterthought
