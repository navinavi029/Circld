# System Optimization and Bug Fixes - Design

## 1. Architecture Overview

This design addresses three main categories of issues:
1. Test infrastructure and failures
2. Runtime errors in caching logic
3. Build and performance optimizations

## 2. Component Design

### 2.1 Test Infrastructure

#### 2.1.1 Test Wrapper Utility
Create a reusable test wrapper that provides all necessary context providers:

```typescript
// src/test/test-utils.tsx
export function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider mockUser={mockUser}>
      <ProfileProvider mockProfile={mockProfile}>
        {children}
      </ProfileProvider>
    </AuthProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: TestWrapper, ...options });
}
```

#### 2.1.2 Context Mocking Strategy
- Mock Firebase auth to return a test user
- Mock ProfileContext to provide test profile data
- Use vi.mock() to replace Firebase imports in tests

### 2.2 SwipeCard Test Fixes

#### 2.2.1 Provider Wrapping
All SwipeCard tests must wrap the component with ProfileProvider:

```typescript
render(
  <ProfileProvider>
    <SwipeCard {...props} />
  </ProfileProvider>
);
```

#### 2.2.2 Mock Profile Data
Provide consistent mock profile in test setup to avoid undefined errors.

### 2.3 SwipeInterface Test Fixes

#### 2.3.1 Empty State Text Correction
Update SwipeInterface component to use "No Matches Found" consistently:
- Current: "No More Items" 
- Fixed: "No Matches Found"
- Update description text to match test expectations

#### 2.3.2 Button Handler Fix
The issue is that buttons are calling handleSwipe but tests expect onSwipe to be called directly:

**Current Flow:**
```
Button Click → handleSwipe → setTimeout → onSwipe (after 450ms)
```

**Problem:** Tests don't wait for the timeout, so onSwipe is never called.

**Solution:** Tests should use `waitFor` or `act` with timer advancement:

```typescript
fireEvent.click(passButton);
await waitFor(() => {
  expect(mockOnSwipe).toHaveBeenCalledWith('left');
}, { timeout: 500 });
```

#### 2.3.3 Animation State Management
The animation state prevents buttons from working during the 450ms animation period. Tests need to account for this:

```typescript
// For animation tests
vi.useFakeTimers();
fireEvent.click(passButton);
expect(passButton).toBeDisabled();

act(() => {
  vi.advanceTimersByTime(450);
});

expect(passButton).not.toBeDisabled();
vi.useRealTimers();
```

### 2.4 Runtime Error Fixes

#### 2.4.1 Timestamp Validation in cacheSessionState

**Problem:** 
```typescript
createdAt: session.createdAt.toMillis(), // Crashes if createdAt is undefined
```

**Solution:**
```typescript
export function cacheSessionState(session: SwipeSession): void {
  try {
    // Validate session has required Timestamp fields
    if (!session.createdAt || !session.lastActivityAt) {
      console.warn('Session missing required timestamp fields, skipping cache');
      return;
    }

    // Validate timestamps have toMillis method
    if (typeof session.createdAt.toMillis !== 'function' ||
        typeof session.lastActivityAt.toMillis !== 'function') {
      console.warn('Session timestamps are not valid Firestore Timestamps');
      return;
    }

    const cached: CachedSessionState = {
      sessionId: session.id,
      userId: session.userId,
      tradeAnchorId: session.tradeAnchorId,
      createdAt: session.createdAt.toMillis(),
      lastActivityAt: session.lastActivityAt.toMillis(),
      swipes: session.swipes.map(s => ({
        itemId: s.itemId,
        direction: s.direction,
        timestamp: s.timestamp?.toMillis() || Date.now(),
      })),
    };
    localStorage.setItem(CACHE_KEYS.SESSION_STATE, JSON.stringify(cached));
  } catch (error) {
    console.error('Failed to cache session state:', error);
  }
}
```

#### 2.4.2 Swipe Timestamp Validation
Add validation for individual swipe timestamps in the swipes array:

```typescript
swipes: session.swipes.map(s => ({
  itemId: s.itemId,
  direction: s.direction,
  timestamp: s.timestamp?.toMillis?.() || Date.now(),
}))
```

### 2.5 Build Optimizations

#### 2.5.1 Vite Configuration Improvements

**Current Issues:**
- Manual chunks may not be optimal
- No minification settings specified
- Missing compression plugins

**Optimizations:**

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Already correct
    minify: 'terser', // Use terser for better compression
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'map-vendor': ['leaflet', 'react-leaflet'], // Separate map libraries
          'cloudinary': ['@cloudinary/react', '@cloudinary/url-gen'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit for vendor chunks
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

## 3. Data Flow

### 3.1 Test Execution Flow
```
Test File → TestWrapper → ProfileProvider → AuthProvider → Component → Assertions
```

### 3.2 Swipe Action Flow
```
User Action → SwipeCard → handleSwipe → Animation (450ms) → onSwipe callback → Parent handler
```

### 3.3 Cache Flow with Validation
```
Session Data → Validate Timestamps → Convert to milliseconds → JSON.stringify → localStorage
```

## 4. Error Handling Strategy

### 4.1 Graceful Degradation
- If caching fails, log error but don't crash
- If timestamps are invalid, skip caching
- If profile is missing in tests, provide default mock

### 4.2 Logging Strategy
- Use console.warn for validation failures
- Use console.error for unexpected errors
- Include context in error messages

## 5. Testing Strategy

### 5.1 Unit Tests
- Test each component in isolation with proper providers
- Mock external dependencies (Firebase, contexts)
- Use fake timers for animation tests

### 5.2 Integration Tests
- Test swipe flow end-to-end
- Verify cache operations with real localStorage
- Test offline scenarios

### 5.3 Test Coverage Goals
- 100% of critical paths covered
- All error handlers tested
- All user interactions tested

## 6. Performance Considerations

### 6.1 Bundle Size
- Target: < 500KB initial bundle (gzipped)
- Vendor chunks should be cached separately
- Lazy load non-critical routes

### 6.2 Runtime Performance
- Minimize re-renders with proper memoization
- Use React.memo for expensive components
- Debounce expensive operations

### 6.3 Build Time
- Parallel processing where possible
- Incremental builds in development
- Production build < 30 seconds

## 7. Correctness Properties

### Property 1: Test Reliability
**Statement:** All tests must pass consistently without flakiness.
**Validation:** Run test suite 10 times, all runs must pass 100%.

### Property 2: No Runtime Errors
**Statement:** Normal user flows must not produce console errors.
**Validation:** Manual testing of all major flows produces zero errors.

### Property 3: Cache Integrity
**Statement:** Cached data must be valid and retrievable.
**Validation:** Cache and retrieve session data, verify all fields match.

### Property 4: Button Responsiveness
**Statement:** UI buttons must respond within 500ms.
**Validation:** Click events trigger callbacks within timeout period.

### Property 5: Build Reproducibility
**Statement:** Production builds must be deterministic.
**Validation:** Two consecutive builds produce identical output.

## 8. Migration Strategy

### 8.1 Phase 1: Test Infrastructure
1. Create test utilities
2. Update test setup
3. Fix SwipeCard tests

### 8.2 Phase 2: Component Fixes
1. Fix SwipeInterface text
2. Update test assertions
3. Fix button handlers

### 8.3 Phase 3: Runtime Fixes
1. Add timestamp validation
2. Update cache functions
3. Test offline scenarios

### 8.4 Phase 4: Build Optimization
1. Update Vite config
2. Test build output
3. Measure improvements

## 9. Rollback Plan

If issues arise:
1. Revert to previous commit
2. Isolate failing change
3. Fix and re-deploy incrementally

## 10. Monitoring and Validation

### 10.1 Success Criteria
- ✅ All 220 tests passing
- ✅ Zero console errors in production
- ✅ Build time < 30 seconds
- ✅ Bundle size reduced by 10%

### 10.2 Validation Steps
1. Run full test suite: `npm test`
2. Build production: `npm run build`
3. Check bundle size: analyze dist folder
4. Manual testing: verify all flows work
5. Performance testing: measure load times
