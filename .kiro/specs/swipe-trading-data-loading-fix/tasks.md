# Implementation Plan: Swipe Trading Data Loading Fix

## Overview

This implementation plan addresses data loading bugs in the swipe trading feature by refactoring the loading flow to be sequential, adding comprehensive error handling with retry logic, implementing proper loading state management, and adding diagnostic logging throughout the pipeline.

The implementation follows a test-driven approach where property tests are written alongside core functionality to catch errors early.

## Tasks

- [x] 1. Enhance retry utility with logging and callbacks
  - Modify `src/utils/retryWithBackoff.ts` to add `onRetry` callback option
  - Add console logging for retry attempts, delays, and exhaustion
  - Add logging to distinguish retryable vs non-retryable errors
  - _Requirements: 2.1, 4.4_

- [x] 1.1 Write property test for retry with exponential backoff
  - **Property 3: Retry with Exponential Backoff**
  - **Validates: Requirements 2.1, 4.4, 5.2**

- [x] 1.2 Write property test for error propagation after retry exhaustion
  - **Property 4: Error Propagation After Retry Exhaustion**
  - **Validates: Requirements 2.2, 5.5**

- [x] 2. Add comprehensive logging to itemPoolService
  - Add logging at service entry with query parameters (user ID, swipe history count, limit)
  - Add logging before and after Firestore query execution with timing
  - Add logging for filtering statistics (pre-filter count, post-filter count, filtered out count)
  - Add logging to distinguish empty results (no items vs all filtered)
  - _Requirements: 4.2, 4.3, 4.5, 2.5_

- [x] 2.1 Write property test for query metrics logging
  - **Property 7: Query Metrics Logging**
  - **Validates: Requirements 4.2, 4.3**

- [x] 2.2 Write property test for filtering statistics logging
  - **Property 8: Filtering Statistics Logging**
  - **Validates: Requirements 4.5**

- [x] 2.3 Write property test for empty pool state distinction
  - **Property 2: Empty Pool State Distinction**
  - **Validates: Requirements 1.4, 2.5**

- [x] 3. Refactor SwipeTradingPage for sequential loading
  - Add `LoadingPhase` type: 'idle' | 'creating-session' | 'loading-items' | 'complete' | 'error'
  - Add `loadingPhase` state to track current phase
  - Refactor `handleTradeAnchorSelect` to execute session creation and item pool loading sequentially
  - Remove reliance on useEffect for item pool loading to avoid race conditions
  - Add logging at each phase transition with context (user ID, anchor ID, session ID)
  - _Requirements: 1.1, 1.5, 4.1_

- [x] 3.1 Write property test for sequential session and item pool loading
  - **Property 1: Sequential Session and Item Pool Loading**
  - **Validates: Requirements 1.1, 1.5**

- [x] 3.2 Write property test for loading state lifecycle
  - **Property 6: Loading State Lifecycle**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.5**

- [x] 4. Implement enhanced error handling in SwipeTradingPage
  - Create `handleLoadingError` function to classify and handle errors
  - Add specific error messages for different error types (session creation, network, item pool)
  - Add comprehensive error logging with session ID, user ID, loading phase, and error details
  - Ensure loading state resets properly on error to allow retry
  - Add retry button to error UI
  - _Requirements: 1.3, 2.3, 2.4, 3.5_

- [x] 4.1 Write unit test for session creation failure error handling
  - Test that session creation failure shows specific error message
  - Test that retry button appears and resets state
  - _Requirements: 1.3_

- [x] 4.2 Write unit test for network error handling
  - Test that network errors show user-friendly message with retry button
  - _Requirements: 2.3_

- [x] 4.3 Write property test for comprehensive error logging
  - **Property 5: Comprehensive Error Logging**
  - **Validates: Requirements 2.4, 4.1**

- [x] 5. Add extended loading message for slow loads
  - Add timer that triggers after 5 seconds of loading
  - Display extended loading message: "This is taking longer than usual. Please wait..."
  - Clear timer on loading completion or error
  - _Requirements: 3.4_

- [x] 5.1 Write unit test for extended loading message
  - Test that message appears after 5 seconds
  - Test that message clears on completion
  - _Requirements: 3.4_

- [x] 6. Implement sequential query execution in itemPoolService
  - Ensure multiple queries execute sequentially, not in parallel
  - Add logging to track query execution order
  - _Requirements: 5.3_

- [x] 6.1 Write property test for sequential query execution
  - **Property 9: Sequential Query Execution**
  - **Validates: Requirements 5.3**

- [x] 7. Enhance session restoration with validation
  - Add trade anchor existence check before loading item pool
  - Clear cache if trade anchor no longer exists
  - Add logging for restoration events (success and failure)
  - Ensure restored sessions use same error handling as new sessions
  - Add UI option to create new session if restoration fails
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7.1 Write property test for session restoration validation
  - **Property 10: Session Restoration Validation**
  - **Validates: Requirements 6.1, 6.2**

- [x] 7.2 Write property test for restoration error handling consistency
  - **Property 11: Restoration Error Handling Consistency**
  - **Validates: Requirements 6.3**

- [x] 7.3 Write property test for successful restoration logging
  - **Property 12: Successful Restoration Logging**
  - **Validates: Requirements 6.5**

- [x] 7.4 Write unit test for restoration failure recovery
  - Test that failed restoration offers to create new session
  - _Requirements: 6.4_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify all 12 correctness properties pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Integration testing and verification
  - Test complete flow: anchor selection → session creation → item pool loading → swipe interface
  - Test error scenarios: network failure, session creation failure, empty pool
  - Test session restoration: valid cache, invalid cache, deleted anchor
  - Verify logging output in browser console
  - Test retry functionality for all error types
  - _Requirements: All_

- [ ] 9.1 Write integration tests for end-to-end flow
  - Test successful flow from anchor selection to swipe interface
  - Test error recovery flows
  - Test session restoration flows
  - _Requirements: All_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Run full test suite including unit, property, and integration tests
  - Verify no console errors or warnings
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
- Checkpoints ensure incremental validation
- All logging uses consistent format: `[ComponentName] Message: { context }`
- Error messages are user-friendly and actionable
