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
} from 'firebase/firestore';
import { db } from '../firebase';
import { Item } from '../types/item';
import { SwipeRecord } from '../types/swipe-trading';
import { retryWithBackoff } from '../utils/retryWithBackoff';

// Query execution queue to ensure sequential execution
let queryQueue: Promise<any> = Promise.resolve();
let queryExecutionCounter = 0;

/**
 * Builds the item pool for swipe trading with comprehensive filtering.
 * 
 * Filters applied:
 * - Only items with status="available"
 * - Excludes items owned by the current user
 * - Excludes items already swiped on in the current session
 * - Orders by createdAt descending (newest first)
 * - Supports batch loading with limit/offset
 * 
 * @param currentUserId - ID of the current user (to exclude their items)
 * @param swipeHistory - Array of swipe records from the current session
 * @param limit - Maximum number of items to return (default: 20)
 * @param lastDoc - Last document from previous batch for pagination
 * @returns Array of items matching the criteria
 */
export async function buildItemPool(
  currentUserId: string,
  swipeHistory: SwipeRecord[],
  limit: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<Item[]> {
  // Ensure sequential execution by chaining onto the query queue
  const queryId = ++queryExecutionCounter;
  
  // Log service entry with query parameters
  console.log('[itemPoolService] Building item pool:', {
    queryId,
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

  // Chain this query onto the queue to ensure sequential execution
  queryQueue = queryQueue.then(async () => {
    console.log('[itemPoolService] Starting query execution:', { queryId, order: queryExecutionCounter });
    
    return retryWithBackoff(async () => {
    const startTime = Date.now();
    const itemsRef = collection(db, 'items');
    
    // Extract item IDs from swipe history to exclude
    const swipedItemIds = swipeHistory.map(swipe => swipe.itemId);
    console.log('[itemPoolService] Excluding swiped items:', swipedItemIds.length);
    
    // Build query constraints
    // Note: We need to fetch more items than the limit because we'll filter by swipe history
    // Fetch 3x the limit to account for filtering
    const fetchLimit = Math.min(limit * 3, 100);
    
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
    
    const q = query(itemsRef, ...constraints);
    
    // Log before query execution
    console.log('[itemPoolService] Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    
    // Log after query execution with timing
    const queryTime = Date.now() - startTime;
    console.log('[itemPoolService] Query completed:', {
      queryId,
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
    
    // Limit to requested amount after filtering
    const limitedItems = filteredItems.slice(0, limit);
    
    // Log filtering statistics
    console.log('[itemPoolService] Filtering results:', {
      queryId,
      preFilterCount: allItems.length,
      postFilterCount: filteredItems.length,
      filteredOut: allItems.length - filteredItems.length,
      finalCount: limitedItems.length,
    });
    
    // Distinguish empty results (no items vs all filtered)
    if (limitedItems.length === 0) {
      if (allItems.length === 0) {
        console.log('[itemPoolService] Empty result: No items available in database', { queryId });
      } else {
        console.log('[itemPoolService] Empty result: All items filtered out by swipe history', { queryId });
      }
    }
    
    console.log('[itemPoolService] Query execution complete:', { queryId });
    
    return limitedItems;
  }, {
    onRetry: (attempt, error) => {
      console.warn('[itemPoolService] Retry attempt', attempt, 'for query', queryId, 'after error:', error.message);
    },
  });
  });

  // Return the queued promise
  return queryQueue;
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
  
  console.log('[itemPoolService] Getting last document:', {
    queryId,
    userId: currentUserId,
    limit,
  });

  if (!currentUserId) {
    throw new Error('Invalid input: User ID is required');
  }

  // Chain this query onto the queue to ensure sequential execution
  queryQueue = queryQueue.then(async () => {
    console.log('[itemPoolService] Starting getLastDocument query execution:', { queryId });
    
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
      
      console.log('[itemPoolService] getLastDocument query completed:', {
        queryId,
        empty: querySnapshot.empty,
      });
      
      if (querySnapshot.empty) {
        return undefined;
      }
      
      return querySnapshot.docs[querySnapshot.docs.length - 1];
    });
  });

  return queryQueue;
}
