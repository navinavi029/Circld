# Design Document: Swipe Trading Data Loading Fix

## Overview

This design addresses critical data loading bugs in the swipe trading feature that cause users to see "No Matches Found" even when items are available. The root causes are:

1. **Race conditions** between session creation and item pool loading
2. **Silent failures** in the data loading pipeline without proper error propagation
3. **Missing retry mechanisms** when Firestore queries fail
4. **Inadequate logging** making it difficult to diagnose failures in production

The solution involves refactoring the data loading flow to be sequential and deterministic, adding comprehensive error handling with retry logic, implementing proper loading state management, and adding diagnostic logging throughout the pipeline.

## Architecture

### Current Flow (Problematic)

```
User selects trade anchor
    ↓
Session creation starts (async)
    ↓
useEffect triggers item pool load (async) ← RACE CONDITION
    ↓
Item pool may load before session exists
    ↓
Silent failure or empty results
```

### Improved Flow (Sequential)

```
User selects trade anchor
    ↓
Display loading indicator
    ↓
Create session (await)
    ↓
Load item pool with session ID (await)
    ↓
Verify results and log diagnostics
    ↓
Transition to swipe interface OR show error with retry
```

### Key Architectural Changes

1. **Sequential Loading**: Session creation and item pool loading happen in sequence, not parallel
2. **Explicit State Management**: Loading states are explicitly managed and tracked
3. **Retry Layer**: All Firestore operations go through retry logic with exponential backoff
4. **Error Boundaries**: Clear error handling at each layer with specific error types
5. **Diagnostic Logging**: Comprehensive logging at each step for production debugging

## Components and Interfaces

### Modified: SwipeTradingPage Component

**Responsibilities:**
- Orchestrate sequential session creation and item pool loading
- Manage loading states explicitly
- Handle errors with user-friendly messages and retry options
- Log diagnostic information at each step

**Key Changes:**

```typescript
// Add explicit loading phases
type LoadingPhase = 'idle' | 'creating-session' | 'loading-items' | 'complete';
const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle');

// Sequential loading in handleTradeAnchorSelect
const handleTradeAnchorSelect = async (item: Item) => {
  try {
    setLoadingPhase('creating-session');
    console.log('[SwipeTradingPage] Creating session for anchor:', item.id);
    
    // Step 1: Create session
    const newSession = await createSwipeSession(user.uid, item.id);
    console.log('[SwipeTradingPage] Session created:', newSession.id);
    setSession(newSession);
    
    setLoadingPhase('loading-items');
    console.log('[SwipeTradingPage] Loading item pool for session:', newSession.id);
    
    // Step 2: Load item pool (with session guaranteed to exist)
    const swipeHistory = await getSwipeHistory(newSession.id, user.uid);
    console.log('[SwipeTradingPage] Swipe history loaded:', swipeHistory.length);
    
    const items = await buildItemPool(user.uid, swipeHistory, 20);
    console.log('[SwipeTradingPage] Item pool loaded:', items.length, 'items');
    
    // Step 3: Set state and transition
    setItemPool(items);
    setCurrentItemIndex(0);
    setTradeAnchor(item);
    setIsSwipeMode(true);
    setLoadingPhase('complete');
    
    // Log success
    console.log('[SwipeTradingPage] Successfully loaded swipe session');
  } catch (err) {
    console.error('[SwipeTradingPage] Error in session creation/loading:', err);
    handleLoadingError(err);
  }
};
```

**Error Handling:**

```typescript
const handleLoadingError = (err: unknown) => {
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  
  console.error('[SwipeTradingPage] Loading error details:', {
    message: errorMessage,
    phase: loadingPhase,
    userId: user?.uid,
    tradeAnchorId: tradeAnchor?.id,
  });
  
  // Specific error messages based on error type
  if (errorMessage.includes('session creation failed')) {
    setError('Failed to create swipe session. Please try again.');
  } else if (errorMessage.includes('failed after')) {
    setError('Network error. Please check your connection and try again.');
  } else if (errorMessage.includes('no items')) {
    // This is actually success - no items available
    setItemPool([]);
    setIsSwipeMode(true);
  } else {
    setError('Failed to load items. Please try again.');
  }
  
  // Reset loading state
  setLoadingPhase('idle');
  setIsSwipeMode(false);
};
```

### Modified: itemPoolService

**Responsibilities:**
- Execute Firestore queries with retry logic
- Log query execution details
- Filter results and log filtering statistics
- Provide detailed error messages

**Key Changes:**

```typescript
export async function buildItemPool(
  currentUserId: string,
  swipeHistory: SwipeRecord[],
  limit: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<Item[]> {
  console.log('[itemPoolService] Building item pool:', {
    userId: currentUserId,
    historyCount: swipeHistory.length,
    limit,
    hasLastDoc: !!lastDoc,
  });

  if (!currentUserId) {
    throw new Error('Invalid input: User ID is required');
  }

  if (limit <= 0 || limit > 100) {
    throw new Error('Invalid limit: Must be between 1 and 100');
  }

  return retryWithBackoff(async () => {
    const startTime = Date.now();
    const itemsRef = collection(db, 'items');
    
    // Extract item IDs from swipe history to exclude
    const swipedItemIds = swipeHistory.map(swipe => swipe.itemId);
    console.log('[itemPoolService] Excluding swiped items:', swipedItemIds.length);
    
    // Build query constraints
    const constraints: QueryConstraint[] = [
      where('status', '==', 'available'),
      where('ownerId', '!=', currentUserId),
      orderBy('ownerId'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit),
    ];
    
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    const q = query(itemsRef, ...constraints);
    
    console.log('[itemPoolService] Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    const queryTime = Date.now() - startTime;
    
    console.log('[itemPoolService] Query completed:', {
      resultCount: querySnapshot.docs.length,
      queryTimeMs: queryTime,
      empty: querySnapshot.empty,
    });
    
    // Map documents to Item objects
    const allItems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Item));
    
    // Filter out swiped items
    const filteredItems = allItems.filter(item => !swipedItemIds.includes(item.id));
    
    console.log('[itemPoolService] Filtering results:', {
      preFilterCount: allItems.length,
      postFilterCount: filteredItems.length,
      filteredOut: allItems.length - filteredItems.length,
    });
    
    return filteredItems;
  }, {
    maxRetries: 3,
    initialDelay: 1000,
    onRetry: (attempt, error) => {
      console.warn('[itemPoolService] Retry attempt', attempt, 'after error:', error.message);
    },
  });
}
```

### Modified: retryWithBackoff Utility

**Responsibilities:**
- Retry failed operations with exponential backoff
- Log retry attempts
- Distinguish between retryable and non-retryable errors
- Provide callback hooks for retry events

**Key Changes:**

```typescript
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void; // NEW: callback for retry events
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      console.log('[retryWithBackoff] Attempt', attempt + 1, 'of', config.maxRetries + 1);
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      console.error('[retryWithBackoff] Attempt', attempt + 1, 'failed:', lastError.message);

      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        console.log('[retryWithBackoff] Non-retryable error, throwing immediately');
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === config.maxRetries) {
        console.error('[retryWithBackoff] All retries exhausted');
        throw new Error(
          `Operation failed after ${config.maxRetries} retries: ${lastError.message}`
        );
      }

      // Call retry callback if provided
      if (config.onRetry) {
        config.onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      console.log('[retryWithBackoff] Waiting', delay, 'ms before retry');
      await sleep(delay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * config.backoffFactor, config.maxDelay);
    }
  }

  throw lastError!;
}
```

### New: LoadingStateManager

**Responsibilities:**
- Track loading phases explicitly
- Provide loading state queries
- Manage transitions between states

**Interface:**

```typescript
type LoadingPhase = 
  | 'idle' 
  | 'creating-session' 
  | 'loading-items' 
  | 'complete' 
  | 'error';

interface LoadingState {
  phase: LoadingPhase;
  startTime: number | null;
  error: Error | null;
}

class LoadingStateManager {
  private state: LoadingState;
  
  constructor() {
    this.state = {
      phase: 'idle',
      startTime: null,
      error: null,
    };
  }
  
  startPhase(phase: LoadingPhase): void {
    console.log('[LoadingStateManager] Starting phase:', phase);
    this.state = {
      phase,
      startTime: Date.now(),
      error: null,
    };
  }
  
  completePhase(): void {
    const duration = this.state.startTime 
      ? Date.now() - this.state.startTime 
      : 0;
    console.log('[LoadingStateManager] Phase completed:', this.state.phase, 'in', duration, 'ms');
    this.state.phase = 'complete';
  }
  
  setError(error: Error): void {
    console.error('[LoadingStateManager] Error in phase:', this.state.phase, error);
    this.state = {
      ...this.state,
      phase: 'error',
      error,
    };
  }
  
  isLoading(): boolean {
    return this.state.phase !== 'idle' && 
           this.state.phase !== 'complete' && 
           this.state.phase !== 'error';
  }
  
  getPhase(): LoadingPhase {
    return this.state.phase;
  }
  
  getDuration(): number {
    return this.state.startTime ? Date.now() - this.state.startTime : 0;
  }
}
```

## Data Models

### Enhanced Error Types

```typescript
// Specific error types for better error handling
export class SessionCreationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'SessionCreationError';
  }
}

export class ItemPoolLoadError extends Error {
  constructor(
    message: string, 
    public readonly cause?: Error,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'ItemPoolLoadError';
  }
}

export class QueryTimeoutError extends Error {
  constructor(message: string, public readonly queryTimeMs: number) {
    super(message);
    this.name = 'QueryTimeoutError';
  }
}
```

### Loading State Type

```typescript
interface LoadingState {
  phase: 'idle' | 'creating-session' | 'loading-items' | 'complete' | 'error';
  startTime: number | null;
  error: Error | null;
  sessionId?: string;
  itemCount?: number;
}
```

### Diagnostic Log Entry

```typescript
interface DiagnosticLogEntry {
  timestamp: number;
  component: string;
  action: string;
  details: Record<string, unknown>;
  level: 'info' | 'warn' | 'error';
}
```



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Sequential Session and Item Pool Loading

*For any* trade anchor selection, session creation must complete successfully before item pool loading begins, ensuring the session ID is available for the query.

**Validates: Requirements 1.1, 1.5**

### Property 2: Empty Pool State Distinction

*For any* item pool loading result that returns an empty array, the system must correctly distinguish and log whether this was due to no available items in the database or all items being filtered out by swipe history.

**Validates: Requirements 1.4, 2.5**

### Property 3: Retry with Exponential Backoff

*For any* Firestore query that fails with a retryable error, the system must retry up to 3 times with exponentially increasing delays (1s, 2s, 4s), and log each retry attempt.

**Validates: Requirements 2.1, 4.4, 5.2**

### Property 4: Error Propagation After Retry Exhaustion

*For any* operation where all retry attempts are exhausted, the system must throw a descriptive error containing the original failure reason and the number of retries attempted.

**Validates: Requirements 2.2, 5.5**

### Property 5: Comprehensive Error Logging

*For any* error that occurs during session creation or item pool loading, the system must log diagnostic information including timestamp, component name, error message, session ID (if available), user ID, and current loading phase.

**Validates: Requirements 2.4, 4.1**

### Property 6: Loading State Lifecycle

*For any* trade anchor selection, the loading state must transition through the sequence: idle → creating-session → loading-items → complete (or error), and the loading indicator must be visible during all intermediate states.

**Validates: Requirements 3.1, 3.2, 3.3, 3.5**

### Property 7: Query Metrics Logging

*For any* Firestore query execution in the item pool service, the system must log the query parameters (user ID, swipe history count, limit), execution time in milliseconds, and result count.

**Validates: Requirements 4.2, 4.3**

### Property 8: Filtering Statistics Logging

*For any* item pool filtering operation, the system must log both the pre-filter count (raw query results) and post-filter count (after excluding swiped items), along with the number of items filtered out.

**Validates: Requirements 4.5**

### Property 9: Sequential Query Execution

*For any* scenario requiring multiple Firestore queries, the queries must execute sequentially (one completes before the next begins) rather than in parallel, to avoid overwhelming Firestore and causing race conditions.

**Validates: Requirements 5.3**

### Property 10: Session Restoration Validation

*For any* cached session restoration attempt, the system must verify the trade anchor still exists in Firestore before attempting to load the item pool, and must clear the cache if the anchor no longer exists.

**Validates: Requirements 6.1, 6.2**

### Property 11: Restoration Error Handling Consistency

*For any* restored session, the error handling and retry logic during item pool loading must be identical to the logic used for new sessions, ensuring consistent behavior regardless of session origin.

**Validates: Requirements 6.3**

### Property 12: Successful Restoration Logging

*For any* successfully restored session, the system must log the restoration event including the session ID, trade anchor ID, user ID, and the number of items loaded.

**Validates: Requirements 6.5**

## Error Handling

### Error Classification

Errors are classified into three categories:

1. **Retryable Errors**: Network errors, timeouts, temporary Firestore issues
   - Action: Retry with exponential backoff
   - Examples: `UNAVAILABLE`, `DEADLINE_EXCEEDED`, network failures

2. **Non-Retryable Errors**: Permission errors, not found errors, validation errors
   - Action: Fail immediately with descriptive message
   - Examples: `PERMISSION_DENIED`, `NOT_FOUND`, `INVALID_ARGUMENT`

3. **Silent Errors**: Errors that should not block the user flow
   - Action: Log error but continue operation
   - Examples: Owner profile loading failure, preload failures

### Error Recovery Strategies

**Session Creation Failure:**
```typescript
try {
  const session = await createSwipeSession(userId, anchorId);
} catch (err) {
  // Log error with context
  console.error('[SwipeTradingPage] Session creation failed:', {
    userId,
    anchorId,
    error: err.message,
  });
  
  // Show user-friendly error
  setError('Failed to create swipe session. Please try again.');
  
  // Reset state to allow retry
  setLoadingPhase('idle');
  setIsSwipeMode(false);
}
```

**Item Pool Loading Failure:**
```typescript
try {
  const items = await buildItemPool(userId, history, 20);
  
  if (items.length === 0) {
    console.log('[SwipeTradingPage] Empty item pool - no items available');
    // This is valid - show empty state
    setItemPool([]);
    setIsSwipeMode(true);
  }
} catch (err) {
  console.error('[SwipeTradingPage] Item pool loading failed:', {
    userId,
    sessionId: session.id,
    error: err.message,
  });
  
  if (err.message.includes('failed after')) {
    setError('Network error. Please check your connection and try again.');
  } else {
    setError('Failed to load items. Please try again.');
  }
  
  // Offer retry
  setLoadingPhase('error');
}
```

**Session Restoration Failure:**
```typescript
try {
  const cachedSession = restoreSessionFromCache(userId);
  
  if (cachedSession) {
    // Verify trade anchor still exists
    const anchorDoc = await getDoc(doc(db, 'items', cachedSession.tradeAnchorId));
    
    if (!anchorDoc.exists()) {
      console.warn('[SwipeTradingPage] Cached anchor no longer exists, clearing cache');
      clearSessionCache(userId);
      return; // Return to anchor selection
    }
    
    // Load item pool with same error handling as new sessions
    await loadItemPoolForSession(cachedSession);
  }
} catch (err) {
  console.error('[SwipeTradingPage] Session restoration failed:', err);
  
  // Offer to create new session with same anchor
  setError('Failed to restore session. Would you like to start a new session?');
  setShowNewSessionOption(true);
}
```

### Error Messages

User-facing error messages are specific and actionable:

- **Session creation failed**: "Failed to create swipe session. Please try again."
- **Network error**: "Network error. Please check your connection and try again."
- **Item pool loading failed**: "Failed to load items. Please try again."
- **Session expired**: "Your swipe session has expired. Please select a trade anchor again."
- **Anchor no longer available**: "This item is no longer available. Please select another item."
- **Restoration failed**: "Failed to restore session. Would you like to start a new session?"

## Testing Strategy

### Dual Testing Approach

This bugfix requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific error scenarios, edge cases, and integration points
- **Property tests**: Verify universal properties hold across all inputs and scenarios

### Unit Testing Focus

Unit tests should cover:

1. **Specific error scenarios**:
   - Session creation fails with permission error
   - Network timeout during item pool loading
   - Cached anchor no longer exists during restoration

2. **Edge cases**:
   - Loading takes longer than 5 seconds (extended loading message)
   - Query returns partial results due to timeout
   - Empty item pool after filtering

3. **Integration points**:
   - Sequential execution of session creation and item pool loading
   - Error state transitions and UI updates
   - Retry callback invocation

### Property-Based Testing Configuration

For this bugfix, we'll use **fast-check** (TypeScript/JavaScript property-based testing library) with the following configuration:

- **Minimum 100 iterations** per property test
- **Tag format**: `Feature: swipe-trading-data-loading-fix, Property {number}: {property_text}`
- Each property test must reference its design document property

### Example Property Test Structure

```typescript
import fc from 'fast-check';

// Feature: swipe-trading-data-loading-fix, Property 1: Sequential Session and Item Pool Loading
test('session creation completes before item pool loading', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        userId: fc.string(),
        tradeAnchorId: fc.string(),
      }),
      async ({ userId, tradeAnchorId }) => {
        let sessionCreated = false;
        let itemPoolLoadStarted = false;
        
        // Mock session creation
        const createSession = async () => {
          await delay(10);
          sessionCreated = true;
          return { id: 'session-123', userId, tradeAnchorId };
        };
        
        // Mock item pool loading
        const loadItemPool = async () => {
          itemPoolLoadStarted = true;
          // Session must be created before this runs
          expect(sessionCreated).toBe(true);
        };
        
        // Execute sequential flow
        await createSession();
        await loadItemPool();
        
        expect(sessionCreated).toBe(true);
        expect(itemPoolLoadStarted).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Goals

- **Unit test coverage**: 90%+ for modified components
- **Property test coverage**: All 12 correctness properties implemented
- **Integration test coverage**: End-to-end flow from anchor selection to swipe interface
- **Error scenario coverage**: All error types and recovery paths tested

### Testing Tools

- **Jest**: Unit testing framework
- **fast-check**: Property-based testing library
- **React Testing Library**: Component testing
- **MSW (Mock Service Worker)**: Firestore mocking for integration tests
