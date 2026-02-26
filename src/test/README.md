# Test Utilities Documentation

This guide covers the test infrastructure, utilities, and best practices for testing the Circld trading application.

## Table of Contents

1. [Test Setup](#test-setup)
2. [Test Utilities](#test-utilities)
3. [Common Testing Patterns](#common-testing-patterns)
4. [Troubleshooting Guide](#troubleshooting-guide)

---

## Test Setup

### Overview

The test infrastructure uses:
- **Vitest** as the test runner
- **React Testing Library** for component testing
- **Firebase mocks** for database and auth operations
- **Custom test utilities** for consistent test setup

### Configuration Files

#### `src/test/setup.ts`

Global test setup that runs before all tests. It includes:

- Firebase auth mocking (getAuth, onAuthStateChanged, signInWithEmailAndPassword, etc.)
- Firebase Firestore mocking (getFirestore, doc, collection, query, etc.)
- Firebase Storage mocking (getStorage, ref, uploadBytes, etc.)
- localStorage mocking for cache operations
- Timestamp utilities for date handling

**Key Features:**
- Auto-authenticates with a mock user (`test-user-id`)
- Provides mock profile data via onSnapshot
- Mocks Timestamp.now() and Timestamp.fromDate()

#### `src/test/test-utils.tsx`

Reusable test utilities for rendering components with required context providers.

**Exports:**
- `mockUser` - Default test user object
- `mockProfile` - Default test profile (UserProfile type)
- `mockOwnerProfile` - Default owner profile for item testing
- `TestWrapper` - Component wrapper with AuthProvider and ProfileProvider
- `renderWithProviders` - Enhanced render function with automatic provider wrapping

---

## Test Utilities

### Mock Data

#### `mockUser`

```typescript
{
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
}
```

Used for Firebase auth mocking.

#### `mockProfile`

```typescript
{
  id: 'test-user-id',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  location: 'Test City, TC',
  coordinates: { lat: 40.7128, lng: -74.0060 },
  photoUrl: 'https://example.com/photo.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

Used as the current user's profile in tests.

#### `mockOwnerProfile`

```typescript
{
  id: 'owner-user-id',
  firstName: 'Owner',
  lastName: 'User',
  email: 'owner@example.com',
  location: 'Owner City, OC',
  coordinates: { lat: 40.7580, lng: -73.9855 },
  photoUrl: 'https://example.com/owner-photo.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

Used as the owner of items being tested.

### Rendering Components

#### `renderWithProviders(ui, options?)`

Enhanced version of Testing Library's `render` that automatically wraps components with required providers.

**Parameters:**
- `ui` - React element to render
- `options` - Optional render options (same as Testing Library's render)
  - `profile` - Custom profile to use instead of mockProfile

**Returns:** Same as Testing Library's render (queries, container, etc.)

**Example:**

```typescript
import { renderWithProviders, mockProfile } from '../test/test-utils';

const { getByText } = renderWithProviders(
  <MyComponent />
);
```

#### `TestWrapper`

Component that wraps children with AuthProvider and ProfileProvider.

**Props:**
- `children` - React nodes to wrap
- `profile` - Optional custom profile (defaults to mockProfile)

**Example:**

```typescript
import { TestWrapper } from '../test/test-utils';

render(
  <TestWrapper>
    <MyComponent />
  </TestWrapper>
);
```

---

## Common Testing Patterns

### Pattern 1: Basic Component Test

Test a component that needs profile context:

```typescript
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../test/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = renderWithProviders(<MyComponent />);
    expect(getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Pattern 2: Testing with Mock Callbacks

Test components that accept callback props:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';

describe('MyComponent', () => {
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockCallback = vi.fn();
    vi.clearAllMocks();
  });

  it('should call callback when button is clicked', () => {
    const { getByRole } = renderWithProviders(
      <MyComponent onAction={mockCallback} />
    );

    fireEvent.click(getByRole('button'));
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
```

### Pattern 3: Testing Async Behavior with waitFor

Test components with animations or delayed callbacks:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';

describe('MyComponent', () => {
  it('should call callback after animation', async () => {
    const mockCallback = vi.fn();
    const { getByRole } = renderWithProviders(
      <MyComponent onComplete={mockCallback} />
    );

    fireEvent.click(getByRole('button'));

    // Wait for async operation to complete
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    }, { timeout: 500 });
  });
});
```

### Pattern 4: Testing with Fake Timers

Test components with precise timing requirements:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, act } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';

describe('MyComponent', () => {
  it('should handle animation state correctly', async () => {
    vi.useFakeTimers();

    const mockCallback = vi.fn();
    const { getByRole } = renderWithProviders(
      <MyComponent onComplete={mockCallback} />
    );

    const button = getByRole('button');
    
    // Button should be enabled initially
    expect(button).not.toBeDisabled();

    // Click to start animation
    fireEvent.click(button);

    // Button should be disabled during animation
    expect(button).toBeDisabled();

    // Advance timers and wait for state updates
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });

    // Callback should be called after animation
    expect(mockCallback).toHaveBeenCalled();

    // Button should be re-enabled
    expect(button).not.toBeDisabled();

    vi.useRealTimers();
  });
});
```

### Pattern 5: Testing Keyboard Interactions

Test components that respond to keyboard events:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';

describe('MyComponent', () => {
  it('should handle arrow key press', async () => {
    const mockCallback = vi.fn();
    const { container } = renderWithProviders(
      <MyComponent onKeyAction={mockCallback} />
    );

    const element = container.querySelector('[role="button"]');
    expect(element).toBeInTheDocument();

    if (element) {
      fireEvent.keyDown(element, { key: 'ArrowLeft' });
    }

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith('left');
    }, { timeout: 500 });
  });
});
```

### Pattern 6: Testing Mouse Drag Interactions

Test components with drag-and-drop or swipe functionality:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';

describe('MyComponent', () => {
  it('should handle drag beyond threshold', async () => {
    const mockCallback = vi.fn();
    const { container } = renderWithProviders(
      <MyComponent onDrag={mockCallback} />
    );

    const element = container.querySelector('[role="button"]');
    
    if (element) {
      // Start drag
      fireEvent.mouseDown(element, { clientX: 100, clientY: 100 });
      
      // Move beyond threshold (150px)
      fireEvent.mouseMove(window, { clientX: 250, clientY: 100 });
      
      // End drag
      fireEvent.mouseUp(window);
    }

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('should not trigger when drag is below threshold', async () => {
    const mockCallback = vi.fn();
    const { container } = renderWithProviders(
      <MyComponent onDrag={mockCallback} />
    );

    const element = container.querySelector('[role="button"]');
    
    if (element) {
      fireEvent.mouseDown(element, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(window, { clientX: 150, clientY: 100 }); // Only 50px
      fireEvent.mouseUp(window);
    }

    // Wait to ensure no callback is triggered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockCallback).not.toHaveBeenCalled();
  });
});
```

### Pattern 7: Testing Touch Interactions

Test components with touch/swipe support:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';

describe('MyComponent', () => {
  it('should handle touch swipe', async () => {
    const mockCallback = vi.fn();
    const { container } = renderWithProviders(
      <MyComponent onSwipe={mockCallback} />
    );

    const element = container.querySelector('[role="button"]');
    
    if (element) {
      fireEvent.touchStart(element, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      
      fireEvent.touchMove(element, {
        touches: [{ clientX: 250, clientY: 100 }],
      });
      
      fireEvent.touchEnd(element);
    }

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    }, { timeout: 500 });
  });
});
```

### Pattern 8: Testing with Router

Test components that use React Router:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test/test-utils';
import { BrowserRouter } from 'react-router-dom';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('MyComponent', () => {
  it('should navigate when button is clicked', () => {
    const { getByRole } = renderWithProviders(
      <BrowserRouter>
        <MyComponent />
      </BrowserRouter>
    );

    fireEvent.click(getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/expected-path');
  });
});
```

### Pattern 9: Testing Empty States

Test components with conditional rendering:

```typescript
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../test/test-utils';

describe('MyComponent', () => {
  it('should show empty state when no data', () => {
    const { getByText } = renderWithProviders(
      <MyComponent items={[]} />
    );

    expect(getByText('No Items Found')).toBeInTheDocument();
    expect(getByText(/description of empty state/i)).toBeInTheDocument();
  });

  it('should show content when data exists', () => {
    const { getByText, queryByText } = renderWithProviders(
      <MyComponent items={[{ id: '1', name: 'Item 1' }]} />
    );

    expect(getByText('Item 1')).toBeInTheDocument();
    expect(queryByText('No Items Found')).not.toBeInTheDocument();
  });
});
```

### Pattern 10: Testing with Custom Profile

Test components with specific profile requirements:

```typescript
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../test/test-utils';
import { UserProfile } from '../types/user';

describe('MyComponent', () => {
  it('should render with custom profile', () => {
    const customProfile: UserProfile = {
      id: 'custom-id',
      firstName: 'Custom',
      lastName: 'User',
      email: 'custom@example.com',
      location: 'Custom City',
      coordinates: { lat: 0, lng: 0 },
      photoUrl: 'https://example.com/custom.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { getByText } = renderWithProviders(
      <MyComponent />,
      { profile: customProfile }
    );

    expect(getByText('Custom User')).toBeInTheDocument();
  });
});
```

---

## Troubleshooting Guide

### Issue 1: "Cannot read properties of undefined (reading 'profile')"

**Cause:** Component requires ProfileContext but test doesn't provide it.

**Solution:** Use `renderWithProviders` instead of plain `render`:

```typescript
// ❌ Wrong
render(<MyComponent />);

// ✅ Correct
renderWithProviders(<MyComponent />);
```

### Issue 2: "Cannot read properties of undefined (reading 'currentUser')"

**Cause:** Component requires AuthContext but test doesn't provide it.

**Solution:** Use `renderWithProviders` which includes AuthProvider:

```typescript
renderWithProviders(<MyComponent />);
```

### Issue 3: Test expects callback but it's never called

**Cause:** Component has animation delay before calling callback.

**Solution:** Use `waitFor` with appropriate timeout:

```typescript
// ❌ Wrong - callback not called yet
fireEvent.click(button);
expect(mockCallback).toHaveBeenCalled();

// ✅ Correct - wait for animation
fireEvent.click(button);
await waitFor(() => {
  expect(mockCallback).toHaveBeenCalled();
}, { timeout: 500 });
```

### Issue 4: Test assertion text doesn't match component

**Cause:** Test expects different text than what component renders.

**Solution:** Check actual component text and update test:

```typescript
// Check what text is actually rendered
const { debug } = renderWithProviders(<MyComponent />);
debug(); // Prints actual DOM

// Update test to match actual text
expect(getByText('Actual Text From Component')).toBeInTheDocument();
```

### Issue 5: Buttons remain disabled in tests

**Cause:** Animation state not properly handled with timers.

**Solution:** Use fake timers and advance them:

```typescript
vi.useFakeTimers();

fireEvent.click(button);
expect(button).toBeDisabled();

await act(async () => {
  await vi.advanceTimersByTimeAsync(450);
});

expect(button).not.toBeDisabled();

vi.useRealTimers();
```

### Issue 6: "Cannot read properties of undefined (reading 'toMillis')"

**Cause:** Timestamp object is undefined or not properly mocked.

**Solution:** Ensure Firebase Timestamp is mocked in setup.ts:

```typescript
// Already configured in src/test/setup.ts
Timestamp: {
  now: vi.fn(() => ({
    toMillis: () => Date.now(),
    toDate: () => new Date(),
  })),
  fromDate: vi.fn((date: Date) => ({
    toMillis: () => date.getTime(),
    toDate: () => date,
  })),
}
```

### Issue 7: localStorage errors in tests

**Cause:** localStorage not mocked or cleared between tests.

**Solution:** localStorage is already mocked in setup.ts. Clear it in beforeEach:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
```

### Issue 8: Flaky tests that sometimes pass/fail

**Cause:** Race conditions or timing issues.

**Solution:** 
1. Use `waitFor` for async operations
2. Use fake timers for precise timing control
3. Avoid testing implementation details
4. Test user-visible behavior

```typescript
// ❌ Flaky - depends on timing
fireEvent.click(button);
setTimeout(() => {
  expect(mockCallback).toHaveBeenCalled();
}, 100);

// ✅ Reliable - waits for condition
fireEvent.click(button);
await waitFor(() => {
  expect(mockCallback).toHaveBeenCalled();
});
```

### Issue 9: "Warning: An update to Component inside a test was not wrapped in act(...)"

**Cause:** State updates happening outside of act() wrapper.

**Solution:** Wrap timer advances in act():

```typescript
// ❌ Wrong
vi.advanceTimersByTime(450);

// ✅ Correct
await act(async () => {
  await vi.advanceTimersByTimeAsync(450);
});
```

### Issue 10: Tests pass locally but fail in CI

**Cause:** Different timing, environment, or missing mocks.

**Solution:**
1. Increase timeouts for CI environment
2. Ensure all external dependencies are mocked
3. Use fake timers for consistent timing
4. Check for environment-specific code

```typescript
// Increase timeout for CI
await waitFor(() => {
  expect(mockCallback).toHaveBeenCalled();
}, { timeout: 1000 }); // Longer timeout for CI
```

---

## Best Practices

### 1. Always Clean Up

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

### 2. Test User Behavior, Not Implementation

```typescript
// ❌ Testing implementation
expect(component.state.isAnimating).toBe(true);

// ✅ Testing user-visible behavior
expect(button).toBeDisabled();
```

### 3. Use Descriptive Test Names

```typescript
// ❌ Vague
it('should work', () => { ... });

// ✅ Descriptive
it('should call onSwipe with left when pass button is clicked', () => { ... });
```

### 4. Group Related Tests

```typescript
describe('MyComponent', () => {
  describe('Rendering', () => {
    it('should render title', () => { ... });
    it('should render description', () => { ... });
  });

  describe('Interactions', () => {
    it('should handle click', () => { ... });
    it('should handle keyboard', () => { ... });
  });
});
```

### 5. Keep Tests Focused

Each test should verify one specific behavior:

```typescript
// ❌ Testing too much
it('should handle everything', () => {
  // Tests rendering, clicking, navigation, etc.
});

// ✅ Focused tests
it('should render correctly', () => { ... });
it('should handle click', () => { ... });
it('should navigate on action', () => { ... });
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- SwipeCard.test.tsx

# Run tests with coverage
npm test -- --coverage

# Run tests in UI mode
npm test -- --ui
```

---

## Error Handling and Offline Support

### Timestamp Validation

#### Overview

Firestore Timestamp objects must be validated before calling methods like `toMillis()` to prevent runtime errors. This is especially important when caching data to localStorage, as Timestamp objects may be undefined or invalid.

#### Validation Approach

The application uses a multi-layered validation strategy:

1. **Null/Undefined Check** - Verify the Timestamp object exists
2. **Method Check** - Verify the `toMillis` method is available
3. **Fallback Values** - Provide sensible defaults when validation fails
4. **Error Logging** - Log validation failures for debugging

#### Implementation Pattern

```typescript
// ✅ Correct - Full validation before using Timestamp
export function cacheSessionState(session: SwipeSession): void {
  try {
    // Step 1: Check if required timestamp fields exist
    if (!session.createdAt || !session.lastActivityAt) {
      console.warn('Session missing required timestamp fields, skipping cache');
      return;
    }

    // Step 2: Verify timestamps have toMillis method
    if (typeof session.createdAt.toMillis !== 'function' ||
        typeof session.lastActivityAt.toMillis !== 'function') {
      console.warn('Session timestamps are not valid Firestore Timestamps');
      return;
    }

    // Step 3: Safe to call toMillis()
    const cached: CachedSessionState = {
      sessionId: session.id,
      userId: session.userId,
      tradeAnchorId: session.tradeAnchorId,
      createdAt: session.createdAt.toMillis(),
      lastActivityAt: session.lastActivityAt.toMillis(),
      swipes: session.swipes.map(s => ({
        itemId: s.itemId,
        direction: s.direction,
        // Step 4: Use optional chaining and fallback
        timestamp: s.timestamp?.toMillis?.() || Date.now(),
      })),
    };
    
    localStorage.setItem(CACHE_KEYS.SESSION_STATE, JSON.stringify(cached));
  } catch (error) {
    console.error('Failed to cache session state:', error);
  }
}
```

#### Common Timestamp Validation Patterns

**Pattern 1: Optional Timestamp with Fallback**

```typescript
// Use optional chaining and provide fallback
const timestamp = record.timestamp?.toMillis?.() || Date.now();
```

**Pattern 2: Required Timestamp with Early Return**

```typescript
// Validate and return early if invalid
if (!data.createdAt || typeof data.createdAt.toMillis !== 'function') {
  console.warn('Invalid timestamp, skipping operation');
  return;
}

const milliseconds = data.createdAt.toMillis();
```

**Pattern 3: Array of Timestamps**

```typescript
// Map array with validation for each item
const timestamps = records.map(record => ({
  ...record,
  timestamp: record.timestamp?.toMillis?.() || Date.now(),
}));
```

**Pattern 4: Conditional Validation**

```typescript
// Only validate if field should exist
if (session.id && session.userId && session.createdAt && session.lastActivityAt) {
  cacheSessionState(session);
} else {
  console.warn('Session data incomplete, skipping cache:', {
    hasId: !!session.id,
    hasUserId: !!session.userId,
    hasCreatedAt: !!session.createdAt,
    hasLastActivityAt: !!session.lastActivityAt
  });
}
```

### Error Handling Patterns

#### Try-Catch with Context

Always wrap risky operations in try-catch and provide context:

```typescript
try {
  // Risky operation
  await updateDoc(sessionRef, { swipes: arrayUnion(swipeRecord) });
  
  // Update cache after success
  cacheSessionState(updatedSession);
} catch (error) {
  console.error('Failed to record swipe:', {
    sessionId,
    userId,
    itemId,
    error: error instanceof Error ? error.message : 'Unknown error'
  });
  
  // Fallback behavior
  cachePendingSwipe({ sessionId, userId, itemId, direction, timestamp: Date.now() });
}
```

#### Graceful Degradation

Operations should degrade gracefully when errors occur:

```typescript
// ✅ Correct - Cache failure doesn't crash the app
try {
  cacheSessionState(session);
} catch (cacheError) {
  console.error('Failed to cache session state:', {
    sessionId: session.id,
    error: cacheError instanceof Error ? cacheError.message : 'Unknown error'
  });
  // Continue execution - caching is optional
}
```

#### Validation Before Operations

Validate data structure before performing operations:

```typescript
// ✅ Correct - Validate before caching
if (session.id && session.userId && session.createdAt && session.lastActivityAt) {
  cacheSessionState(session);
} else {
  console.warn('Session data incomplete, skipping cache');
}

// ❌ Wrong - No validation
cacheSessionState(session); // May crash if data is incomplete
```

### Offline Support Patterns

#### Pattern 1: Cache-First with Fallback

Try to fetch from server, fall back to cache if offline:

```typescript
export async function getSwipeHistory(sessionId: string, userId: string): Promise<SwipeRecord[]> {
  try {
    // Try to fetch from Firestore
    const sessionDoc = await getDoc(doc(db, 'swipeSessions', sessionId));
    const sessionData = sessionDoc.data() as SwipeSession;
    
    // Update cache with fresh data
    cacheSessionState(sessionData);
    
    return sessionData.swipes || [];
  } catch (error) {
    // If offline, return cached data
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('network') || errorMessage.includes('offline')) {
      const cachedSession = getCachedSessionState();
      if (cachedSession && cachedSession.id === sessionId) {
        return cachedSession.swipes;
      }
    }
    throw error;
  }
}
```

#### Pattern 2: Optimistic Updates with Sync Queue

Update local cache immediately, sync to server when online:

```typescript
export async function recordSwipe(
  sessionId: string,
  userId: string,
  itemId: string,
  direction: 'left' | 'right'
): Promise<void> {
  try {
    // Try to update server
    await updateDoc(sessionRef, {
      swipes: arrayUnion(swipeRecord),
      lastActivityAt: serverTimestamp(),
    });
    
    // Update cache after success
    cacheSessionState(updatedSession);
  } catch (error) {
    // If offline, cache for later sync
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('network') || errorMessage.includes('offline')) {
      // Add to pending queue
      cachePendingSwipe({ sessionId, userId, itemId, direction, timestamp: Date.now() });
      
      // Update local cache optimistically
      const cachedSession = getCachedSessionState();
      if (cachedSession && cachedSession.id === sessionId) {
        cachedSession.swipes.push({
          itemId,
          direction,
          timestamp: Timestamp.fromMillis(Date.now()),
        });
        cacheSessionState(cachedSession);
      }
    } else {
      throw error;
    }
  }
}
```

#### Pattern 3: Sync Pending Operations

Sync cached operations when connection is restored:

```typescript
export async function syncPendingSwipes(): Promise<number> {
  const pendingSwipes = getPendingSwipes();
  if (pendingSwipes.length === 0) {
    return 0;
  }

  let syncedCount = 0;
  
  for (const cachedSwipe of pendingSwipes) {
    try {
      // Verify session still exists
      const sessionDoc = await getDoc(doc(db, 'swipeSessions', cachedSwipe.sessionId));
      if (!sessionDoc.exists()) {
        console.warn(`Session ${cachedSwipe.sessionId} no longer exists, skipping sync`);
        continue;
      }
      
      // Sync to server
      await updateDoc(sessionRef, {
        swipes: arrayUnion(swipeRecord),
        lastActivityAt: serverTimestamp(),
      });

      // Remove from cache after successful sync
      removePendingSwipe(cachedSwipe);
      syncedCount++;
    } catch (error) {
      console.error('Failed to sync swipe:', error);
      // Keep in cache for next sync attempt
    }
  }

  return syncedCount;
}
```

### Debugging Cache Issues

#### Issue 1: "Cannot read properties of undefined (reading 'toMillis')"

**Symptoms:**
- Runtime error when caching session state
- Error occurs in `localStorageCache.ts`
- Stack trace shows `toMillis()` call

**Diagnosis:**
```typescript
// Check if timestamp exists
console.log('Session data:', {
  hasCreatedAt: !!session.createdAt,
  hasLastActivityAt: !!session.lastActivityAt,
  createdAtType: typeof session.createdAt,
  hasToMillis: typeof session.createdAt?.toMillis === 'function'
});
```

**Solution:**
Add validation before calling `toMillis()`:

```typescript
if (!session.createdAt || typeof session.createdAt.toMillis !== 'function') {
  console.warn('Invalid timestamp, skipping cache');
  return;
}
```

#### Issue 2: Cached Data Not Persisting

**Symptoms:**
- Data cached but not available after page refresh
- `getCachedSessionState()` returns null
- localStorage appears empty

**Diagnosis:**
```typescript
// Check localStorage directly
console.log('Cache keys:', Object.keys(localStorage));
console.log('Cached session:', localStorage.getItem('swipe_trading_session_state'));

// Check if caching succeeded
try {
  cacheSessionState(session);
  console.log('Cache successful');
} catch (error) {
  console.error('Cache failed:', error);
}
```

**Common Causes:**
1. localStorage quota exceeded
2. Private browsing mode
3. Cache cleared by another process
4. JSON serialization error

**Solution:**
```typescript
export function cacheSessionState(session: SwipeSession): void {
  try {
    // Validate before caching
    if (!session.createdAt || !session.lastActivityAt) {
      console.warn('Session missing timestamps, skipping cache');
      return;
    }

    const cached = { /* ... */ };
    
    // Check localStorage availability
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage not available');
      return;
    }
    
    // Check quota
    const serialized = JSON.stringify(cached);
    if (serialized.length > 5000000) { // 5MB limit
      console.warn('Cache data too large:', serialized.length);
      return;
    }
    
    localStorage.setItem(CACHE_KEYS.SESSION_STATE, serialized);
  } catch (error) {
    console.error('Failed to cache session state:', error);
  }
}
```

#### Issue 3: Stale Cache Data

**Symptoms:**
- Old data shown after server update
- Cache not refreshing
- Inconsistent state between cache and server

**Diagnosis:**
```typescript
// Compare cache timestamp with server
const cached = getCachedSessionState();
const server = await getDoc(doc(db, 'swipeSessions', sessionId));

console.log('Cache age:', {
  cachedAt: cached?.lastActivityAt.toMillis(),
  serverAt: server.data()?.lastActivityAt.toMillis(),
  difference: (server.data()?.lastActivityAt.toMillis() || 0) - (cached?.lastActivityAt.toMillis() || 0)
});
```

**Solution:**
Always update cache after successful server fetch:

```typescript
export async function getSwipeHistory(sessionId: string, userId: string): Promise<SwipeRecord[]> {
  try {
    const sessionDoc = await getDoc(doc(db, 'swipeSessions', sessionId));
    const sessionData = sessionDoc.data() as SwipeSession;
    
    // Always update cache with fresh data
    cacheSessionState(sessionData);
    
    return sessionData.swipes || [];
  } catch (error) {
    // Only use cache if offline
    if (isOfflineError(error)) {
      return getCachedSessionState()?.swipes || [];
    }
    throw error;
  }
}
```

#### Issue 4: Pending Swipes Not Syncing

**Symptoms:**
- Swipes cached but never synced to server
- `getPendingSwipes()` shows items
- No sync errors in console

**Diagnosis:**
```typescript
// Check pending swipes
const pending = getPendingSwipes();
console.log('Pending swipes:', pending.length);
console.log('Pending details:', pending);

// Test sync manually
const synced = await syncPendingSwipes();
console.log('Synced count:', synced);
```

**Common Causes:**
1. Sync function never called
2. Network still offline
3. Session no longer exists
4. User ID mismatch

**Solution:**
Call sync when connection is restored:

```typescript
// Listen for online event
window.addEventListener('online', async () => {
  console.log('Connection restored, syncing pending swipes');
  try {
    const synced = await syncPendingSwipes();
    console.log(`Synced ${synced} pending swipes`);
  } catch (error) {
    console.error('Sync failed:', error);
  }
});

// Also sync on app startup
useEffect(() => {
  if (navigator.onLine) {
    syncPendingSwipes();
  }
}, []);
```

#### Debugging Tools

**Enable Verbose Logging:**

```typescript
// Add to localStorageCache.ts for debugging
const DEBUG = true;

function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[Cache Debug] ${message}`, data);
  }
}

export function cacheSessionState(session: SwipeSession): void {
  debugLog('Caching session state', { sessionId: session.id });
  
  try {
    // ... validation and caching
    debugLog('Cache successful');
  } catch (error) {
    debugLog('Cache failed', error);
  }
}
```

**Inspect Cache Contents:**

```typescript
// Utility function to inspect cache
export function inspectCache() {
  return {
    sessionState: localStorage.getItem(CACHE_KEYS.SESSION_STATE),
    pendingSwipes: localStorage.getItem(CACHE_KEYS.PENDING_SWIPES),
    sessionStateParsed: getCachedSessionState(),
    pendingSwipesParsed: getPendingSwipes(),
    totalSize: new Blob([
      localStorage.getItem(CACHE_KEYS.SESSION_STATE) || '',
      localStorage.getItem(CACHE_KEYS.PENDING_SWIPES) || ''
    ]).size
  };
}

// Use in console
console.log(inspectCache());
```

**Clear Cache for Testing:**

```typescript
// Utility to reset cache state
export function resetCache() {
  clearCachedSessionState();
  clearPendingSwipes();
  console.log('Cache cleared');
}
```

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
