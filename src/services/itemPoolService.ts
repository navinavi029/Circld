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
  if (!currentUserId) {
    throw new Error('Invalid input: User ID is required');
  }

  if (limit <= 0 || limit > 100) {
    throw new Error('Invalid limit: Must be between 1 and 100');
  }

  return retryWithBackoff(async () => {
    const itemsRef = collection(db, 'items');
    
    // Extract item IDs from swipe history to exclude
    const swipedItemIds = swipeHistory.map(swipe => swipe.itemId);
    
    // Build query constraints
    const constraints: QueryConstraint[] = [
      where('status', '==', 'available'),
      where('ownerId', '!=', currentUserId),
      orderBy('ownerId'), // Required for != query
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit),
    ];
    
    // Add pagination if lastDoc provided
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }
    
    const q = query(itemsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    // Map documents to Item objects and filter out swiped items
    const items = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Item))
      .filter(item => !swipedItemIds.includes(item.id));
    
    return items;
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
  if (!currentUserId) {
    throw new Error('Invalid input: User ID is required');
  }

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
    
    if (querySnapshot.empty) {
      return undefined;
    }
    
    return querySnapshot.docs[querySnapshot.docs.length - 1];
  });
}
