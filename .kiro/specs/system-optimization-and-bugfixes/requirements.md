# System Optimization and Bug Fixes - Requirements

## 1. Overview
This spec addresses critical bugs, test failures, and optimization opportunities identified in the Circld trading application. The goal is to make the system flawless by fixing all failing tests, resolving runtime errors, and implementing performance optimizations.

## 2. Problem Statement
The system currently has:
- 21 failing tests across SwipeCard and SwipeInterface components
- Runtime errors in swipeHistoryService related to Timestamp handling
- Missing test providers causing context errors
- Incorrect test assertions that don't match actual UI text
- Performance optimization opportunities in build configuration

## 3. User Stories

### 3.1 As a developer
I want all tests to pass so that I can confidently deploy code changes without introducing regressions.

### 3.2 As a developer
I want proper error handling for Timestamp operations so that the application doesn't crash when caching session state.

### 3.3 As a user
I want the application to load quickly and perform smoothly so that I have a great trading experience.

### 3.4 As a developer
I want consistent test setup so that components can be tested in isolation without context errors.

## 4. Acceptance Criteria

### 4.1 Test Fixes
- All 15 SwipeCard tests must pass
- All 6 failing SwipeInterface tests must pass
- Tests must properly mock required contexts (ProfileProvider, AuthProvider)
- Test assertions must match actual UI text and behavior

### 4.2 Runtime Error Fixes
- swipeHistoryService must handle undefined Timestamp objects gracefully
- cacheSessionState must validate session data before calling toMillis()
- No "Cannot read properties of undefined (reading 'toMillis')" errors

### 4.3 UI Text Consistency
- Empty state text must match between component and tests
- "No Matches Found" instead of "No More Items"
- Consistent messaging across all states

### 4.4 Button Interaction Fixes
- Pass and Like buttons must trigger onSwipe callbacks correctly
- Animation state must not permanently disable buttons
- SwipeCard swipe events must propagate to parent handlers

### 4.5 Performance Optimizations
- Build configuration must use code splitting effectively
- Source maps should be disabled in production builds
- Bundle size should be minimized through proper chunking

## 5. Technical Requirements

### 5.1 Test Infrastructure
- Create reusable test wrapper with ProfileProvider and AuthProvider
- Mock Firebase auth and firestore in test setup
- Provide default profile data for tests

### 5.2 Error Handling
- Add null checks before accessing Timestamp methods
- Validate session object structure before caching
- Log errors with context for debugging

### 5.3 Component Behavior
- SwipeInterface buttons must call handleSwipe which triggers onSwipe
- Animation timing must allow buttons to re-enable after 450ms
- SwipeCard must properly forward swipe events to parent

### 5.4 Build Configuration
- Vite config should split vendor code appropriately
- React, Firebase, and Leaflet should be in separate chunks
- Tree shaking should be enabled for optimal bundle size

## 6. Out of Scope
- Adding new features or functionality
- Changing core business logic
- Modifying UI design or styling (except for text corrections)
- Database schema changes
- Authentication flow changes

## 7. Dependencies
- Existing test infrastructure (Vitest, Testing Library)
- Firebase SDK
- React 19
- Vite build system

## 8. Success Metrics
- 100% test pass rate (220/220 tests passing)
- Zero runtime errors in console during normal operation
- Build time under 30 seconds
- Bundle size reduction of at least 10%
- No TypeScript errors or warnings
