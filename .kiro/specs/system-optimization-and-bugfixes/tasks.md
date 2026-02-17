# System Optimization and Bug Fixes - Tasks

## 1. Test Infrastructure Setup

### 1.1 Create test utilities with context providers
- [x] Create `src/test/test-utils.tsx` with TestWrapper component
- [x] Add ProfileProvider mock with default test data
- [x] Add AuthProvider mock with test user
- [x] Export `renderWithProviders` helper function
- [x] Update test setup to include new utilities

### 1.2 Update test setup file
- [x] Add Firebase mocks to `src/test/setup.ts`
- [x] Mock Firestore Timestamp class
- [x] Mock auth methods
- [x] Configure localStorage mock for tests

## 2. Fix SwipeCard Tests

### 2.1 Add ProfileProvider wrapper to all SwipeCard tests
- [-] Wrap all render calls with ProfileProvider
- [ ] Provide mock profile data in beforeEach
- [ ] Update test to use renderWithProviders helper
- [ ] Verify all 15 tests pass

### 2.2 Fix timing-dependent tests
- [ ] Add waitFor to keyboard swipe tests
- [ ] Add waitFor to mouse drag tests
- [ ] Add waitFor to touch swipe tests
- [ ] Increase timeout to 500ms for animation completion

## 3. Fix SwipeInterface Tests

### 3.1 Fix empty state text mismatch
- [ ] Verify actual empty state text in SwipeInterface component
- [ ] Update test assertions to match actual text
- [ ] Test shows "No Matches Found" not "No More Items"

### 3.2 Fix button interaction tests
- [ ] Add waitFor to pass button test with 500ms timeout
- [ ] Add waitFor to like button test with 500ms timeout
- [ ] Add waitFor to swipe forwarding test
- [ ] Verify callbacks are called after animation delay

### 3.3 Fix animation state tests
- [ ] Use vi.useFakeTimers() in animation tests
- [ ] Advance timers by 450ms using act()
- [ ] Verify buttons re-enable after animation
- [ ] Clean up with vi.useRealTimers()

## 4. Fix Runtime Errors

### 4.1 Add timestamp validation to localStorageCache
- [ ] Add null check for session.createdAt before toMillis()
- [ ] Add null check for session.lastActivityAt before toMillis()
- [ ] Add function check for toMillis method existence
- [ ] Add early return with warning if validation fails
- [ ] Add fallback to Date.now() for swipe timestamps

### 4.2 Update swipeHistoryService error handling
- [ ] Wrap cacheSessionState calls in try-catch
- [ ] Add validation before calling cache functions
- [ ] Log errors with context information
- [ ] Test offline scenarios with invalid data

## 5. Build Optimizations

### 5.1 Update Vite configuration
- [ ] Add minify: 'terser' option
- [ ] Configure terserOptions to drop console.logs
- [ ] Add map-vendor chunk for Leaflet
- [ ] Add cloudinary chunk for image handling
- [ ] Increase chunkSizeWarningLimit to 1000

### 5.2 Verify build improvements
- [ ] Run production build
- [ ] Measure bundle sizes before and after
- [ ] Verify code splitting is working
- [ ] Check that vendor chunks are properly separated
- [ ] Confirm build time is under 30 seconds

## 6. Testing and Validation

### 6.1 Run full test suite
- [ ] Execute `npm test` and verify all 220 tests pass
- [ ] Check for any console warnings or errors
- [ ] Verify test execution time is reasonable
- [ ] Run tests multiple times to check for flakiness

### 6.2 Manual testing
- [ ] Test swipe functionality in browser
- [ ] Verify no console errors during normal use
- [ ] Test offline scenarios
- [ ] Verify cache operations work correctly
- [ ] Test on different browsers (Chrome, Firefox, Safari)

### 6.3 Performance validation
- [ ] Measure initial page load time
- [ ] Check bundle size reduction
- [ ] Verify lazy loading works
- [ ] Test on slow network connection
- [ ] Verify animations are smooth

## 7. Documentation

### 7.1 Update test documentation
- [ ] Document test utilities usage
- [ ] Add examples of proper test setup
- [ ] Document common testing patterns
- [ ] Add troubleshooting guide for test failures

### 7.2 Update error handling documentation
- [ ] Document timestamp validation approach
- [ ] Add examples of proper error handling
- [ ] Document offline support patterns
- [ ] Add debugging tips for cache issues

## 8. Cleanup

### 8.1 Remove debug code
- [ ] Remove console.log statements from ProfileContext
- [ ] Remove debug output from swipeHistoryService
- [ ] Clean up commented code
- [ ] Remove unused imports

### 8.2 Code quality
- [ ] Run TypeScript compiler to check for errors
- [ ] Verify no linting warnings
- [ ] Check for unused variables
- [ ] Ensure consistent code formatting
