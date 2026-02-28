import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  getDocs,
  QueryConstraint,
  DocumentSnapshot,
  documentId,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Item } from '../types/item';
import { SwipeRecord, SwipeFilterPreferences } from '../types/swipe-trading';
import { UserProfile } from '../types/user';
import { retryWithBackoff } from '../utils/retryWithBackoff';
import { calculateDistance } from '../utils/location';
import { createLogger } from '../utils/logger';

// Create logger instance for this service
const logger = createLogger('itemPoolService');

// Per-user query tracking for logging and debugging
let queryExecutionCounter = 0;

// Session-level profile cache to avoid redundant queries
// Maps userId to UserProfile
const profileCache = new Map<string, UserProfile>();

/**
 * Pagination state for managing item pool loading
 * Tracks loaded items, current position, and pagination metadata
 */
export interface PaginationState {
  loadedItems: Item[];
  currentIndex: number;
  lastDocument?: DocumentSnapshot;
  hasMore: boolean;
  isLoading: boolean;
  totalLoaded: number;
}

/**
 * Pagination configuration constants
 * Requirements: 5.1, 5.2, 5.3
 */
export const PAGINATION_CONFIG = {
  INITIAL_BATCH_SIZE: 10, // Load 5-10 items initially (using 10 for better UX)
  NEXT_BATCH_SIZE: 10, // Load 10 more items when threshold reached
  MAX_LOADED_ITEMS: 20, // Maximum items to keep loaded at once
  LOAD_MORE_THRESHOLD: 0.7, // Load more when 70% through current items
} as const;

/**
 * Creates initial pagination state
 */
export function createInitialPaginationState(): PaginationState {
  return {
    loadedItems: [],
    currentIndex: 0,
    lastDocument: undefined,
    hasMore: true,
    isLoading: false,
    totalLoaded: 0,
  };
}

/**
 * Builds the item pool for swipe trading with comprehensive filtering.
 * 
 * Filters applied:
 * - Only items with status="available"
 * - Excludes items owned by the current user
 * - Excludes items already swiped on (across all sessions)
 * - Optional: Distance filter (requires user coordinates)
 * - Optional: Category filter
 * - Optional: Condition filter (new, like-new, good, fair, poor)
 * - Orders by createdAt descending (newest first)
 * - Supports batch loading with limit/offset
 * 
 * @param currentUserId - ID of the current user (to exclude their items)
 * @param swipeHistory - Array of swipe records from the current session
 * @param limit - Maximum number of items to return (default: 20)
 * @param lastDoc - Last document from previous batch for pagination
 * @param filters - Optional filter preferences
 * @param userCoordinates - User's coordinates for distance filtering
 * @returns Array of items matching the criteria
 */
export async function buildItemPool(
  currentUserId: string,
  swipeHistory: SwipeRecord[],
  limit: number = 20,
  lastDoc?: DocumentSnapshot,
  filters?: SwipeFilterPreferences,
  userCoordinates?: { latitude: number; longitude: number } | null
): Promise<Item[]> {
  // Generate unique query ID for logging and debugging
  const queryId = ++queryExecutionCounter;
  
  // Log service entry with query parameters
  logger.info('Building item pool', {
    queryId: queryId.toString(),
    userId: currentUserId,
    historyCount: swipeHistory.length.toString(),
    limit: limit.toString(),
    hasLastDoc: (!!lastDoc).toString(),
    filters: filters ? JSON.stringify(filters) : 'none',
    hasUserCoordinates: (!!userCoordinates).toString(),
  });

  if (!currentUserId) {
    throw new Error('Invalid input: User ID is required');
  }

  if (limit <= 0 || limit > 100) {
    throw new Error('Invalid limit: Must be between 1 and 100');
  }

  // Execute query directly without queue - allows parallel processing for concurrent users
  logger.debug('Starting query execution', { queryId: queryId.toString() });
  
  return retryWithBackoff(async () => {
    const startTime = Date.now();
    const itemsRef = collection(db, 'items');
    
    // Extract item IDs from current session swipe history
    const sessionSwipedItemIds = swipeHistory.map(swipe => swipe.itemId);
    
    // Fetch all historical swipes for this user across all sessions
    const allSwipedItemIds = await getAllSwipedItemIds(currentUserId);
    
    // Combine session and historical swipes
    const swipedItemIds = [...new Set([...sessionSwipedItemIds, ...allSwipedItemIds])];
    
    logger.debug('Excluding swiped items', {
      sessionSwipes: sessionSwipedItemIds.length.toString(),
      historicalSwipes: allSwipedItemIds.length.toString(),
      totalExcluded: swipedItemIds.length.toString(),
    });
    
    // Build query constraints
    // Note: We need to fetch more items than the limit because we'll filter by swipe history and other filters
    // Fetch 3x the limit to account for filtering
    const fetchLimit = Math.min(limit * 3, 100);
    
    // CRITICAL: Only include items with status='available'
    // This explicitly excludes 'pending' and 'unavailable' items per Requirements 2.1, 2.2, 2.3
    const constraints: QueryConstraint[] = [
      where('status', '==', 'available'),
      where('ownerId', '!=', currentUserId),
      orderBy('ownerId'), // Required for != query
      orderBy('createdAt', 'desc'),
      firestoreLimit(fetchLimit),
    ];
    
    // Add pagination if lastDoc provided
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    // Note: Category and age filters are applied client-side after fetching
    // because Firestore has limitations on compound queries
    
    const q = query(itemsRef, ...constraints);
    
    // Log query constraints for verification
    logger.debug('Query constraints', {
      queryId: queryId.toString(),
      statusFilter: 'available',
      excludedStatuses: 'pending,unavailable',
      excludedOwnerId: currentUserId,
      fetchLimit: fetchLimit.toString(),
    });
    
    // Log before query execution
    logger.debug('Executing Firestore query');
    const querySnapshot = await getDocs(q);
    
    // Log after query execution with timing
    const queryTime = Date.now() - startTime;
    
    // Log performance warning for slow operations
    if (queryTime > 2000) {
      logger.warn('Slow query detected', {
        queryId: queryId.toString(),
        queryTimeMs: queryTime.toString(),
        resultCount: querySnapshot.docs.length.toString(),
      });
    } else {
      logger.info('Query completed', {
        queryId: queryId.toString(),
        resultCount: querySnapshot.docs.length.toString(),
        queryTimeMs: queryTime.toString(),
        empty: querySnapshot.empty.toString(),
      });
    }
    
    // Map documents to Item objects
    const allItems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Item));
    
    // Verify and log item status distribution (should all be 'available')
    const statusCounts = allItems.reduce((acc, item) => {
      const status = item.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    logger.debug('Item status verification', {
      queryId: queryId.toString(),
      statusDistribution: JSON.stringify(statusCounts),
      allAvailable: (statusCounts['available'] === allItems.length).toString(),
      hasPending: ((statusCounts['pending'] || 0) > 0).toString(),
      hasUnavailable: ((statusCounts['unavailable'] || 0) > 0).toString(),
    });
    
    // Log warning if any non-available items were returned (should never happen)
    if (statusCounts['pending'] || statusCounts['unavailable']) {
      logger.warn('Query returned non-available items', {
        queryId: queryId.toString(),
        pendingCount: (statusCounts['pending'] || 0).toString(),
        unavailableCount: (statusCounts['unavailable'] || 0).toString(),
        statusDistribution: JSON.stringify(statusCounts),
      });
    }
    
    // Apply filters
    let filteredItems = allItems.filter(item => !swipedItemIds.includes(item.id));
    
    // Apply category filter
    if (filters?.categories && filters.categories.length > 0) {
      filteredItems = filteredItems.filter(item => 
        filters.categories.includes(item.category)
      );
    }
    
    // Apply condition filter
    if (filters?.conditions && filters.conditions.length > 0) {
      filteredItems = filteredItems.filter(item => 
        filters.conditions.includes(item.condition)
      );
    }
    
    // Apply distance filter (requires user coordinates and item owner coordinates)
    if (filters?.maxDistance && userCoordinates) {
      // Fetch owner profiles to get coordinates for distance calculation
      const ownerIds = [...new Set(filteredItems.map(item => item.ownerId))];
      const ownerProfiles = await fetchOwnerCoordinates(ownerIds);
      
      filteredItems = filteredItems.filter(item => {
        const ownerProfile = ownerProfiles.get(item.ownerId);
        if (!ownerProfile?.coordinates) {
          // Skip items where owner location is unknown
          return false;
        }
        
        const distance = calculateDistance(
          userCoordinates,
          ownerProfile.coordinates
        );
        
        return distance <= filters.maxDistance!;
      });
      
      logger.debug('Distance filter applied', {
        queryId: queryId.toString(),
        maxDistance: filters.maxDistance!.toString(),
        itemsAfterDistanceFilter: filteredItems.length.toString(),
      });
    }
    
    // Limit to requested amount after filtering
    const limitedItems = filteredItems.slice(0, limit);
    
    // Log filtering statistics
    logger.info('Filtering results', {
      queryId: queryId.toString(),
      preFilterCount: allItems.length.toString(),
      postFilterCount: filteredItems.length.toString(),
      filteredOut: (allItems.length - filteredItems.length).toString(),
      finalCount: limitedItems.length.toString(),
      categoriesCount: (filters?.categories?.length || 0).toString(),
      conditionsCount: (filters?.conditions?.length || 0).toString(),
      maxDistance: filters?.maxDistance?.toString() || 'none',
    });
    
    // Distinguish empty results (no items vs all filtered)
    if (limitedItems.length === 0) {
      if (allItems.length === 0) {
        logger.info('Empty result: No items available in database', { queryId: queryId.toString() });
      } else {
        logger.info('Empty result: All items filtered out by swipe history', { queryId: queryId.toString() });
      }
    }
    
    logger.debug('Query execution complete', { queryId: queryId.toString() });
    
    return limitedItems;
  }, {
    onRetry: (attempt, error) => {
      logger.warn('Retry attempt after error', {
        attempt: attempt.toString(),
        queryId: queryId.toString(),
        error: error.message,
      });
    },
  });
}

/**
 * Gets the last document from a query result for pagination.
 * This is used to fetch the next batch of items.
 * 
 * @param currentUserId - ID of the current user
 * @param limit - Number of items per batch
 * @returns The last document snapshot or undefined
 */
export async function getLastDocument(
  currentUserId: string,
  limit: number
): Promise<DocumentSnapshot | undefined> {
  const queryId = ++queryExecutionCounter;
  
  logger.debug('Getting last document', {
    queryId: queryId.toString(),
    userId: currentUserId,
    limit: limit.toString(),
  });

  if (!currentUserId) {
    throw new Error('Invalid input: User ID is required');
  }

  // Execute query directly without queue - allows parallel processing for concurrent users
  logger.debug('Starting getLastDocument query execution', { queryId: queryId.toString() });
  
  return retryWithBackoff(async () => {
    const itemsRef = collection(db, 'items');
    
    const constraints: QueryConstraint[] = [
      where('status', '==', 'available'),
      where('ownerId', '!=', currentUserId),
      orderBy('ownerId'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit),
    ];
    
    const q = query(itemsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    logger.debug('getLastDocument query completed', {
      queryId: queryId.toString(),
      empty: querySnapshot.empty.toString(),
    });
    
    if (querySnapshot.empty) {
      return undefined;
    }
    
    return querySnapshot.docs[querySnapshot.docs.length - 1];
  });
}

/**
 * Fetches all item IDs that a user has ever swiped on (across all sessions)
 * This ensures users don't see the same items again in new sessions
 * 
 * @param userId - ID of the user
 * @returns Array of item IDs that have been swiped on
 */
async function getAllSwipedItemIds(userId: string): Promise<string[]> {
  try {
    const sessionsRef = collection(db, 'swipeSessions');
    const q = query(sessionsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const allSwipedIds = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const sessionData = doc.data();
      if (sessionData.swipes && Array.isArray(sessionData.swipes)) {
        sessionData.swipes.forEach((swipe: SwipeRecord) => {
          allSwipedIds.add(swipe.itemId);
        });
      }
    });
    
    logger.info('Loaded historical swipes', {
      userId,
      sessionCount: snapshot.docs.length.toString(),
      uniqueSwipedItems: allSwipedIds.size.toString(),
    });
    
    return Array.from(allSwipedIds);
  } catch (err) {
    logger.error('Error fetching historical swipes', {
      userId,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    // Return empty array on error - don't block the item pool loading
    return [];
  }
}

/**
 * Fetches owner coordinates for distance filtering
 * Returns a map of ownerId to coordinates
 */
async function fetchOwnerCoordinates(
  ownerIds: string[]
): Promise<Map<string, { coordinates: { latitude: number; longitude: number } | null }>> {
  // Use batch profile loading to fetch all owner profiles at once
  const profiles = await batchFetchOwnerProfiles(ownerIds);
  
  // Convert to the expected format (coordinates only)
  const coordinatesMap = new Map<string, { coordinates: { latitude: number; longitude: number } | null }>();
  profiles.forEach((profile, ownerId) => {
    coordinatesMap.set(ownerId, { coordinates: profile.coordinates });
  });
  
  return coordinatesMap;
}

/**
 * Batch fetches owner profiles for multiple items in a single query.
 * Implements profile caching to avoid redundant queries within a session.
 * 
 * Requirements addressed:
 * - 2.1: Fetch all owner profiles in a single batch query
 * - 2.2: No N+1 pattern (single query for all profiles)
 * - 2.3: Maximum 2 queries (items + profiles)
 * - 2.4: Cache profiles within session
 * 
 * @param ownerIds - Array of unique owner IDs to fetch profiles for
 * @returns Map of ownerId to UserProfile
 */
export async function batchFetchOwnerProfiles(
  ownerIds: string[]
): Promise<Map<string, UserProfile>> {
  const uniqueOwnerIds = [...new Set(ownerIds)];
  
  logger.debug('Batch fetching owner profiles', {
    requestedCount: ownerIds.length.toString(),
    uniqueCount: uniqueOwnerIds.length.toString(),
  });
  
  // Check cache first
  const uncachedOwnerIds: string[] = [];
  const profiles = new Map<string, UserProfile>();
  
  uniqueOwnerIds.forEach(ownerId => {
    const cachedProfile = profileCache.get(ownerId);
    if (cachedProfile) {
      profiles.set(ownerId, cachedProfile);
    } else {
      uncachedOwnerIds.push(ownerId);
    }
  });
  
  logger.debug('Profile cache status', {
    cachedCount: profiles.size.toString(),
    uncachedCount: uncachedOwnerIds.length.toString(),
    cacheHitRate: (profiles.size / uniqueOwnerIds.length).toFixed(2),
  });
  
  // If all profiles are cached, return immediately
  if (uncachedOwnerIds.length === 0) {
    logger.debug('All profiles found in cache');
    return profiles;
  }
  
  // Batch fetch uncached profiles in a single query
  // Firestore 'in' queries support up to 10 items, so we need to batch if more
  const BATCH_SIZE = 10;
  const batches: string[][] = [];
  
  for (let i = 0; i < uncachedOwnerIds.length; i += BATCH_SIZE) {
    batches.push(uncachedOwnerIds.slice(i, i + BATCH_SIZE));
  }
  
  logger.debug('Fetching profiles in batches', {
    totalUncached: uncachedOwnerIds.length.toString(),
    batchCount: batches.length.toString(),
    batchSize: BATCH_SIZE.toString(),
  });
  
  // Execute all batches in parallel
  await Promise.all(
    batches.map(async (batch) => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where(documentId(), 'in', batch));
        const snapshot = await getDocs(q);
        
        snapshot.docs.forEach(doc => {
          const profile = { uid: doc.id, ...doc.data() } as UserProfile;
          profiles.set(doc.id, profile);
          // Cache the profile for future use
          profileCache.set(doc.id, profile);
        });
        
        logger.debug('Batch query completed', {
          batchSize: batch.length.toString(),
          fetchedCount: snapshot.docs.length.toString(),
        });
      } catch (err) {
        logger.error('Failed to fetch profile batch', {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        // Continue with other batches even if one fails
      }
    })
  );
  
  logger.info('Batch profile fetch complete', {
    totalFetched: profiles.size.toString(),
    totalRequested: uniqueOwnerIds.length.toString(),
    newlyCached: uncachedOwnerIds.length.toString(),
  });
  
  return profiles;
}

/**
 * Clears the profile cache. Useful for testing or when user logs out.
 */
export function clearProfileCache(): void {
  profileCache.clear();
  logger.debug('Profile cache cleared');
}

/**
 * Loads the initial batch of items for pagination
 * Requirements: 5.1 - Load 5-10 items initially
 * 
 * @param currentUserId - ID of the current user
 * @param swipeHistory - Array of swipe records from the current session
 * @param filters - Optional filter preferences
 * @param userCoordinates - User's coordinates for distance filtering
 * @returns Initial pagination state with loaded items
 */
export async function loadInitialBatch(
  currentUserId: string,
  swipeHistory: SwipeRecord[],
  filters?: SwipeFilterPreferences,
  userCoordinates?: { latitude: number; longitude: number } | null
): Promise<PaginationState> {
  logger.info('Loading initial batch', {
    userId: currentUserId,
    batchSize: PAGINATION_CONFIG.INITIAL_BATCH_SIZE.toString(),
  });

  const items = await buildItemPool(
    currentUserId,
    swipeHistory,
    PAGINATION_CONFIG.INITIAL_BATCH_SIZE,
    undefined,
    filters,
    userCoordinates
  );

  // Get the last document for pagination
  const lastDoc = items.length > 0 
    ? await getLastDocumentFromItems(currentUserId, PAGINATION_CONFIG.INITIAL_BATCH_SIZE)
    : undefined;

  const state: PaginationState = {
    loadedItems: items,
    currentIndex: 0,
    lastDocument: lastDoc,
    hasMore: items.length === PAGINATION_CONFIG.INITIAL_BATCH_SIZE,
    isLoading: false,
    totalLoaded: items.length,
  };

  logger.info('Initial batch loaded', {
    itemCount: items.length.toString(),
    hasMore: state.hasMore.toString(),
  });

  return state;
}

/**
 * Loads the next batch of items for pagination
 * Requirements: 5.2 - Load next batch when 70% threshold reached
 * Requirements: 5.3 - Limit maximum loaded items to 20
 * 
 * @param currentState - Current pagination state
 * @param currentUserId - ID of the current user
 * @param swipeHistory - Array of swipe records from the current session
 * @param filters - Optional filter preferences
 * @param userCoordinates - User's coordinates for distance filtering
 * @returns Updated pagination state with new items
 */
export async function loadNextBatch(
  currentState: PaginationState,
  currentUserId: string,
  swipeHistory: SwipeRecord[],
  filters?: SwipeFilterPreferences,
  userCoordinates?: { latitude: number; longitude: number } | null
): Promise<PaginationState> {
  // Don't load if already loading or no more items
  if (currentState.isLoading || !currentState.hasMore) {
    logger.debug('Skipping next batch load', {
      isLoading: currentState.isLoading.toString(),
      hasMore: currentState.hasMore.toString(),
    });
    return currentState;
  }

  logger.info('Loading next batch', {
    userId: currentUserId,
    currentLoaded: currentState.totalLoaded.toString(),
    batchSize: PAGINATION_CONFIG.NEXT_BATCH_SIZE.toString(),
  });

  try {
    const items = await buildItemPool(
      currentUserId,
      swipeHistory,
      PAGINATION_CONFIG.NEXT_BATCH_SIZE,
      currentState.lastDocument,
      filters,
      userCoordinates
    );

    // Get the last document for next pagination
    const lastDoc = items.length > 0
      ? await getLastDocumentFromItems(
          currentUserId,
          currentState.totalLoaded + items.length
        )
      : currentState.lastDocument;

    // Combine with existing items, respecting max limit
    const allItems = [...currentState.loadedItems, ...items];
    
    // Trim to max loaded items if exceeded
    // Remove oldest items (from the beginning) to stay within limit
    const trimmedItems = allItems.length > PAGINATION_CONFIG.MAX_LOADED_ITEMS
      ? allItems.slice(allItems.length - PAGINATION_CONFIG.MAX_LOADED_ITEMS)
      : allItems;

    const newState: PaginationState = {
      loadedItems: trimmedItems,
      currentIndex: currentState.currentIndex,
      lastDocument: lastDoc,
      hasMore: items.length === PAGINATION_CONFIG.NEXT_BATCH_SIZE,
      isLoading: false,
      totalLoaded: currentState.totalLoaded + items.length,
    };

    logger.info('Next batch loaded', {
      newItemCount: items.length.toString(),
      totalLoaded: newState.totalLoaded.toString(),
      currentlyInMemory: trimmedItems.length.toString(),
      hasMore: newState.hasMore.toString(),
      trimmed: (allItems.length > PAGINATION_CONFIG.MAX_LOADED_ITEMS).toString(),
    });

    return newState;
  } catch (error) {
    logger.error('Error loading next batch', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Return state with loading flag cleared
    return {
      ...currentState,
      isLoading: false,
    };
  }
}

/**
 * Checks if more items should be loaded based on current position
 * Requirements: 5.2 - Trigger loading at 70% threshold
 * 
 * @param state - Current pagination state
 * @returns True if more items should be loaded
 */
export function shouldLoadMore(state: PaginationState): boolean {
  // Don't load if already loading or no more items
  if (state.isLoading || !state.hasMore) {
    return false;
  }

  // Don't load if no items yet
  if (state.loadedItems.length === 0) {
    return false;
  }

  // Calculate progress through loaded items
  const progress = state.currentIndex / state.loadedItems.length;

  // Load more when past threshold
  const shouldLoad = progress >= PAGINATION_CONFIG.LOAD_MORE_THRESHOLD;

  if (shouldLoad) {
    logger.debug('Load more threshold reached', {
      currentIndex: state.currentIndex.toString(),
      totalItems: state.loadedItems.length.toString(),
      progress: `${(progress * 100).toFixed(1)}%`,
      threshold: `${(PAGINATION_CONFIG.LOAD_MORE_THRESHOLD * 100)}%`,
    });
  }

  return shouldLoad;
}

/**
 * Updates the current index in pagination state (e.g., after a swipe)
 * 
 * @param state - Current pagination state
 * @param newIndex - New current index
 * @returns Updated pagination state
 */
export function updateCurrentIndex(
  state: PaginationState,
  newIndex: number
): PaginationState {
  return {
    ...state,
    currentIndex: Math.max(0, Math.min(newIndex, state.loadedItems.length - 1)),
  };
}

/**
 * Helper function to get the last document from a query for pagination
 */
async function getLastDocumentFromItems(
  currentUserId: string,
  limit: number
): Promise<DocumentSnapshot | undefined> {
  return getLastDocument(currentUserId, limit);
}
