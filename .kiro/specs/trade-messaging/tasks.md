# Implementation Plan: Trade Messaging

## Overview

This implementation plan breaks down the trade messaging feature into incremental coding tasks. The approach follows a bottom-up strategy: first implementing the core data models and service layer, then adding property-based tests to validate correctness, followed by UI components, and finally integration with the existing navigation and notification systems.

Each task builds on previous work, ensuring no orphaned code and enabling early validation through tests.

## Tasks

- [x] 1. Set up data models and types
  - Create TypeScript interfaces for Conversation, Message, ConversationSummary, and MessageNotificationData
  - Add these types to `src/types/swipe-trading.ts`
  - Ensure types align with Firestore document structure
  - _Requirements: 1.1, 1.2, 2.1, 3.4_

- [ ] 2. Implement core messaging service functions
  - [x] 2.1 Create `src/services/messagingService.ts` with conversation management
    - Implement `createConversation(tradeOfferId)` with idempotency check
    - Implement `getConversationByTradeOffer(tradeOfferId)`
    - Implement `getUserConversations(userId)` with sorting by lastMessageAt
    - Use `retryWithBackoff` for all Firestore operations
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2_
  
  - [ ]* 2.2 Write property tests for conversation management
    - **Property 1: Conversation creation for accepted trades**
    - **Validates: Requirements 1.1, 1.2**
    - **Property 2: Conversation creation idempotency**
    - **Validates: Requirements 1.3**
    - **Property 3: New conversation initialization**
    - **Validates: Requirements 1.4**
    - **Property 17: User conversation filtering**
    - **Validates: Requirements 7.1**
    - **Property 18: Conversation list ordering**
    - **Validates: Requirements 7.2**
  
  - [x] 2.3 Implement message sending and retrieval functions
    - Implement `sendMessage(conversationId, senderId, text)` with validation
    - Implement `getMessages(conversationId, userId)` with access control
    - Implement `markConversationAsRead(conversationId, userId)`
    - Add input validation (whitespace check, length limit, HTML sanitization)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 5.3, 10.1, 10.2, 10.3_
  
  - [ ]* 2.4 Write property tests for message operations
    - **Property 4: Message storage completeness**
    - **Validates: Requirements 2.1**
    - **Property 5: Participant-only message sending**
    - **Validates: Requirements 2.2**
    - **Property 6: Non-participant message rejection**
    - **Validates: Requirements 2.3**
    - **Property 7: Whitespace message rejection**
    - **Validates: Requirements 2.4**
    - **Property 8: Message chronological ordering**
    - **Validates: Requirements 3.1**
    - **Property 9: Participant-only message retrieval**
    - **Validates: Requirements 3.2**
    - **Property 10: Non-participant retrieval rejection**
    - **Validates: Requirements 3.3**
    - **Property 11: Retrieved message completeness**
    - **Validates: Requirements 3.4**
    - **Property 20: Message persistence round-trip**
    - **Validates: Requirements 8.1, 8.4**
    - **Property 21: HTML sanitization**
    - **Validates: Requirements 10.1**
    - **Property 22: URL preservation**
    - **Validates: Requirements 10.2**
    - **Property 23: Line break preservation**
    - **Validates: Requirements 10.3**

- [ ] 3. Implement real-time message subscription
  - [x] 3.1 Add `subscribeToMessages` function to messaging service
    - Implement Firestore `onSnapshot` listener for messages subcollection
    - Return unsubscribe function for cleanup
    - Add access control validation before subscribing
    - Handle listener errors with reconnection logic
    - _Requirements: 4.1, 4.2_
  
  - [ ]* 3.2 Write unit tests for real-time subscription
    - Test subscription establishes correctly for participants
    - Test subscription rejected for non-participants
    - Test unsubscribe function cleans up listener
    - Test error handling and reconnection
    - _Requirements: 4.1_

- [ ] 4. Extend notification service for messages
  - [x] 4.1 Add message notification creation to notification service
    - Implement `createMessageNotification` function in `src/services/notificationService.ts`
    - Include sender name, message preview (first 50 chars), and trade item details
    - Create notification for recipient (non-sender participant)
    - _Requirements: 5.1, 5.4_
  
  - [ ]* 4.2 Write property tests for message notifications
    - **Property 12: Message notification creation**
    - **Validates: Requirements 5.1**
    - **Property 15: Notification data completeness**
    - **Validates: Requirements 5.4**
  
  - [x] 4.3 Integrate notification creation into sendMessage
    - Call `createMessageNotification` after successfully storing message
    - Fetch sender name and trade item details from Firestore
    - Handle notification errors gracefully (log but don't fail message send)
    - _Requirements: 5.1_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create MessagesPage component
  - [x] 6.1 Implement conversation list UI
    - Create `src/pages/MessagesPage.tsx` component
    - Fetch user conversations using `getUserConversations`
    - Display conversation list with trade item images, partner names, last message preview
    - Show unread count badge for each conversation
    - Handle loading and error states
    - _Requirements: 7.1, 7.2, 7.3, 9.1_
  
  - [ ]* 6.2 Write unit tests for MessagesPage
    - Test conversation list renders correctly
    - Test loading state displays spinner
    - Test error state displays error message
    - Test empty state when no conversations
    - Test unread badges display correctly
    - _Requirements: 7.1, 7.3_
  
  - [x] 6.3 Add unread count calculation
    - Implement function to calculate total unread messages across conversations
    - Display total unread count in page header or navigation badge
    - _Requirements: 5.2_
  
  - [ ]* 6.4 Write property test for unread count
    - **Property 13: Unread count accuracy**
    - **Validates: Requirements 5.2**

- [ ] 7. Create ConversationView component
  - [x] 7.1 Implement message display UI
    - Create `src/components/ConversationView.tsx` component
    - Fetch messages using `getMessages`
    - Display messages in chronological order with sender distinction
    - Show trade item details in header
    - Subscribe to real-time updates using `subscribeToMessages`
    - Mark conversation as read when component mounts
    - Handle loading and error states
    - _Requirements: 3.1, 3.4, 4.1, 5.3, 9.4_
  
  - [ ]* 7.2 Write unit tests for ConversationView
    - Test messages render in correct order
    - Test sent vs received message styling
    - Test real-time subscription establishes
    - Test mark as read called on mount
    - Test cleanup unsubscribes listener
    - _Requirements: 3.1, 5.3_
  
  - [x] 7.3 Implement MessageInput component
    - Create `src/components/MessageInput.tsx` component
    - Add text input with character count (max 2000)
    - Add send button with validation
    - Handle Enter key submission (Shift+Enter for new line)
    - Show validation errors for empty/too long messages
    - Disable input while sending
    - _Requirements: 2.4, 2.5_
  
  - [ ]* 7.4 Write unit tests for MessageInput
    - Test character count updates correctly
    - Test send button disabled for empty input
    - Test send button disabled for >2000 chars
    - Test Enter key submits message
    - Test Shift+Enter adds new line
    - _Requirements: 2.4, 2.5_

- [ ] 8. Integrate messaging into navigation
  - [x] 8.1 Add Messages link to Navigation component
    - Update `src/components/Navigation.tsx` to include Messages link
    - Add route for `/messages` page
    - Add route for `/messages/:conversationId` for individual conversations
    - _Requirements: 9.1_
  
  - [x] 8.2 Add unread message badge to navigation
    - Fetch total unread count for current user
    - Display badge with count on Messages navigation item
    - Subscribe to real-time updates for unread count
    - Hide badge when count is zero
    - _Requirements: 5.2, 9.2_
  
  - [ ]* 8.3 Write unit tests for navigation integration
    - Test Messages link renders
    - Test unread badge displays correct count
    - Test badge hidden when no unread messages
    - Test navigation to messages page
    - _Requirements: 9.1, 9.2_

- [ ] 9. Add conversation creation trigger
  - [x] 9.1 Create conversation when trade accepted
    - Update trade offer acceptance flow to call `createConversation`
    - Handle conversation creation errors gracefully
    - Navigate user to new conversation after creation
    - _Requirements: 1.1_
  
  - [ ]* 9.2 Write integration test for trade acceptance flow
    - Test accepting trade creates conversation
    - Test conversation includes both participants
    - Test navigation to conversation after creation
    - _Requirements: 1.1, 1.2_

- [ ] 10. Add Firebase security rules
  - [x] 10.1 Create Firestore security rules for conversations and messages
    - Add rules to Firebase console or `firestore.rules` file
    - Ensure only participants can read/write conversations
    - Ensure only participants can read messages
    - Ensure only sender can create messages with their senderId
    - Test rules with Firebase emulator
    - _Requirements: 6.1, 6.2_

- [ ] 11. Add access control validation
  - [ ]* 11.1 Write property tests for access control
    - **Property 16: Accepted trades only**
    - **Validates: Requirements 6.3, 6.4**
  
  - [x] 11.2 Add validation to prevent conversation creation for non-accepted trades
    - Update `createConversation` to check trade offer status
    - Return error if trade is not accepted
    - _Requirements: 6.3, 6.4_

- [ ] 12. Add conversation summary enrichment
  - [x] 12.1 Implement function to enrich conversations with item and user details
    - Fetch trade item details (titles, images) from Firestore
    - Fetch partner user details (name) from Firestore
    - Combine into ConversationSummary objects
    - Cache results to minimize Firestore reads
    - _Requirements: 7.3_
  
  - [ ]* 12.2 Write property test for conversation summary
    - **Property 19: Conversation summary completeness**
    - **Validates: Requirements 7.3**

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Add polish and accessibility
  - [ ] 14.1 Add loading states and error handling
    - Add loading spinners for all async operations
    - Add error messages with retry buttons
    - Add empty states for no conversations/messages
    - _Requirements: 7.4_
  
  - [ ] 14.2 Add accessibility features
    - Add ARIA labels for screen readers
    - Ensure keyboard navigation works (Tab, Enter, Escape)
    - Add focus management for message input
    - Test with screen reader
  
  - [ ]* 14.3 Write accessibility tests
    - Test keyboard navigation
    - Test ARIA labels present
    - Test focus management

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- Use `fast-check` library for property-based testing in TypeScript
- All Firestore operations should use the existing `retryWithBackoff` utility
- Real-time listeners should be cleaned up properly to avoid memory leaks
