# Implementation Plan: Swipe Trading

## Overview

This implementation plan breaks down the swipe trading feature into incremental coding tasks. The approach follows a bottom-up strategy: first establishing data models and services, then building UI components, and finally integrating everything into the complete user flow.

The implementation uses TypeScript with React for the frontend and Firebase Firestore for data persistence, following the existing patterns in the codebase.

## Tasks

- [x] 1. Set up data models and types
  - Create TypeScript interfaces for SwipeSession, TradeOffer, Notification, and related types
  - Add swipeInterestCount field to Item type
  - Define service interfaces for trade offer, swipe history, and notification management
  - _Requirements: 4.2, 5.2, 6.1, 10.1_

- [ ] 2. Implement Trade Offer Service
  - [x] 2.1 Create trade offer service with Firestore integration
    - Implement createTradeOffer function with idempotency check
    - Implement getTradeOffersForUser query
    - Implement markOfferAsRead function
    - _Requirements: 4.1, 4.2, 4.5, 4.6, 5.3, 5.4_
  
  - [ ]* 2.2 Write property test for trade offer idempotence
    - **Property 17: Trade offer idempotence**
    - **Validates: Requirements 4.5, 4.6**
  
  - [ ]* 2.3 Write property test for trade offer data completeness
    - **Property 14: Trade offer data completeness**
    - **Validates: Requirements 4.2**
  
  - [ ]* 2.4 Write unit tests for trade offer service
    - Test error handling for invalid IDs
    - Test permission errors
    - _Requirements: 4.1, 4.2_

- [ ] 3. Implement Notification Service
  - [x] 3.1 Create notification service with Firestore integration
    - Implement createTradeOfferNotification function
    - Implement getUserNotifications query
    - Implement markAsRead function
    - _Requirements: 4.3, 5.1, 5.3, 5.4_
  
  - [ ]* 3.2 Write property test for notification creation
    - **Property 15: Notification creation on trade offer**
    - **Validates: Requirements 4.3**
  
  - [ ]* 3.3 Write property test for notification data completeness
    - **Property 16: Notification data completeness**
    - **Validates: Requirements 4.4**
  
  - [ ]* 3.4 Write property test for notification read status
    - **Property 19: Notification read status update**
    - **Validates: Requirements 5.4**

- [ ] 4. Implement Swipe History Service
  - [x] 4.1 Create swipe history service with Firestore integration
    - Implement recordSwipe function
    - Implement getSwipeHistory query
    - Implement clearHistory function
    - Create new session on anchor change
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 4.2 Write property test for swipe history recording
    - **Property 21: Swipe history recording**
    - **Validates: Requirements 6.1**
  
  - [ ]* 4.3 Write property test for swipe history persistence
    - **Property 23: Swipe history persistence**
    - **Validates: Requirements 6.3**
  
  - [ ]* 4.4 Write property test for new session on anchor change
    - **Property 24: New session on anchor change**
    - **Validates: Requirements 6.4**

- [x] 5. Checkpoint - Ensure all service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Item Pool Query Service
  - [x] 6.1 Create item pool query function
    - Implement buildItemPool with filtering logic
    - Filter by status="available"
    - Exclude current user's items
    - Exclude items in swipe history
    - Order by createdAt descending
    - Support batch loading with limit/offset
    - _Requirements: 2.3, 2.4, 6.2, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 6.2 Write property test for owner exclusion
    - **Property 7: Owner exclusion in item pool**
    - **Validates: Requirements 2.3**
  
  - [ ]* 6.3 Write property test for status filtering
    - **Property 8: Available status filtering**
    - **Validates: Requirements 2.4**
  
  - [ ]* 6.4 Write property test for swipe history exclusion
    - **Property 22: Swipe history exclusion**
    - **Validates: Requirements 6.2**
  
  - [ ]* 6.5 Write property test for item pool ordering
    - **Property 26: Item pool ordering**
    - **Validates: Requirements 7.4**
  
  - [ ]* 6.6 Write property test for batch loading
    - **Property 27: Batch loading**
    - **Validates: Requirements 7.5**

- [ ] 7. Implement TradeAnchorSelector Component
  - [x] 7.1 Create TradeAnchorSelector component
    - Display user's available listings in grid
    - Highlight selected item
    - Handle item selection
    - Show empty state when no available items
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ]* 7.2 Write property test for available listings filter
    - **Property 1: User's available listings filter**
    - **Validates: Requirements 1.1**
  
  - [ ]* 7.3 Write property test for trade anchor state management
    - **Property 2: Trade anchor state management**
    - **Validates: Requirements 1.2**
  
  - [ ]* 7.4 Write unit tests for TradeAnchorSelector
    - Test empty state display
    - Test item selection interaction
    - _Requirements: 1.1, 1.4_

- [ ] 8. Implement SwipeCard Component
  - [x] 8.1 Create SwipeCard component with gesture handling
    - Implement touch event handlers (touchstart, touchmove, touchend)
    - Implement mouse event handlers (mousedown, mousemove, mouseup)
    - Implement keyboard handlers for accessibility
    - Add swipe animation with rotation and opacity
    - Display item details (title, description, category, condition, images, owner)
    - Show visual feedback (green/red overlay) during drag
    - _Requirements: 2.2, 3.1, 3.2, 3.3, 3.5, 3.6_
  
  - [ ]* 8.2 Write property test for item display completeness
    - **Property 6: Item display completeness**
    - **Validates: Requirements 2.2**
  
  - [ ]* 8.3 Write property test for swipe interpretation
    - **Property 10: Right swipe interpretation**
    - **Property 11: Left swipe interpretation**
    - **Validates: Requirements 3.1, 3.2**
  
  - [ ]* 8.4 Write property test for input method equivalence
    - **Property 13: Input method equivalence**
    - **Validates: Requirements 3.6**

- [ ] 9. Implement TradeAnchorDisplay Component
  - [x] 9.1 Create TradeAnchorDisplay component
    - Display trade anchor in fixed position
    - Show item's primary image and title
    - Provide change anchor button
    - _Requirements: 2.5, 9.1, 9.2, 9.4_
  
  - [ ]* 9.2 Write property test for trade anchor display
    - **Property 9: Trade anchor persistent display**
    - **Property 29: Trade anchor display content**
    - **Validates: Requirements 2.5, 9.2**
  
  - [ ]* 9.3 Write property test for trade anchor update
    - **Property 30: Trade anchor display update**
    - **Validates: Requirements 9.5**

- [x] 10. Checkpoint - Ensure component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement SwipeInterface Component
  - [x] 11.1 Create SwipeInterface component
    - Integrate SwipeCard and TradeAnchorDisplay
    - Manage current item state
    - Handle swipe completion (load next item)
    - Show empty state when pool exhausted
    - Provide button alternatives for swipe actions
    - _Requirements: 2.1, 2.6, 3.4, 3.7_
  
  - [ ]* 11.2 Write property test for single item display
    - **Property 5: Single item display**
    - **Validates: Requirements 2.1**
  
  - [ ]* 11.3 Write property test for item progression
    - **Property 12: Item progression after swipe**
    - **Validates: Requirements 3.4**
  
  - [ ]* 11.4 Write unit tests for SwipeInterface
    - Test empty state display
    - Test button alternatives work
    - _Requirements: 2.6, 3.7_

- [ ] 12. Implement SwipeTradingPage Component
  - [x] 12.1 Create main SwipeTradingPage component
    - Manage swipe session state
    - Coordinate TradeAnchorSelector and SwipeInterface
    - Handle trade anchor selection and changes
    - Fetch item pool using query service
    - Call trade offer service on right swipe
    - Call swipe history service on each swipe
    - Handle errors and loading states
    - _Requirements: 1.2, 1.3, 1.5, 4.1, 6.1_
  
  - [ ]* 12.2 Write property test for interface transition
    - **Property 3: Interface transition on anchor selection**
    - **Validates: Requirements 1.3**
  
  - [ ]* 12.3 Write property test for trade anchor mutability
    - **Property 4: Trade anchor mutability**
    - **Validates: Requirements 1.5**
  
  - [ ]* 12.4 Write integration tests for SwipeTradingPage
    - Test complete flow: select anchor → swipe → create offer
    - Test anchor change flow
    - _Requirements: 1.2, 1.3, 4.1_

- [ ] 13. Implement Notification Display Component
  - [x] 13.1 Create NotificationList component
    - Display trade offer notifications
    - Show offering user info and both items
    - Provide view item action
    - Provide start conversation action (placeholder for now)
    - Mark notifications as read on view
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 8.1_
  
  - [ ]* 13.2 Write property test for pending trade offers retrieval
    - **Property 18: Pending trade offers retrieval**
    - **Validates: Requirements 5.3**
  
  - [ ]* 13.3 Write property test for notification action data
    - **Property 20: Notification action data availability**
    - **Validates: Requirements 5.5, 5.6**

- [ ] 14. Implement Swipe Interest Counter
  - [x] 14.1 Update item metadata on trade offer creation
    - Increment swipeInterestCount when trade offer created
    - Update Listings page to display swipe interest count
    - Add filter/view for items with trade offers
    - _Requirements: 10.1, 10.2, 10.5_
  
  - [ ]* 14.2 Write property test for counter increment
    - **Property 31: Swipe interest counter increment**
    - **Validates: Requirements 10.1**
  
  - [ ]* 14.3 Write property test for counter independence
    - **Property 33: Counter independence**
    - **Validates: Requirements 10.3**
  
  - [ ]* 14.4 Write property test for trade offers query
    - **Property 34: Trade offers query by item**
    - **Validates: Requirements 10.5**

- [ ] 15. Add routing and navigation
  - [x] 15.1 Add swipe trading route to App.tsx
    - Add /swipe-trading route with ProtectedRoute
    - Add navigation link in Navigation component
    - Add notification badge showing unread count
    - _Requirements: All_
  
  - [ ]* 15.2 Write unit tests for routing
    - Test route protection
    - Test navigation links
    - _Requirements: All_

- [x] 16. Checkpoint - Ensure all integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Add error handling and edge cases
  - [x] 17.1 Implement error handling throughout
    - Add network error handling with retry logic
    - Add validation for invalid states
    - Add user-friendly error messages
    - Handle item becoming unavailable during session
    - _Requirements: All_
  
  - [ ]* 17.2 Write unit tests for error conditions
    - Test network failures
    - Test invalid data
    - Test permission errors
    - _Requirements: All_

- [ ] 18. Implement local caching for offline support
  - [x] 18.1 Add local storage for swipe actions
    - Cache swipe actions when offline
    - Sync cached actions when connection restored
    - Persist session state across page refreshes
    - _Requirements: 6.3_
  
  - [ ]* 18.2 Write unit tests for offline support
    - Test caching behavior
    - Test sync on reconnection
    - _Requirements: 6.3_

- [x] 19. Final checkpoint - Complete end-to-end testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests ensure components work together correctly
- The implementation follows existing codebase patterns for Firebase, React, and TypeScript
