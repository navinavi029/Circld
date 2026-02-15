import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  increment,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ItemMetadata } from '../types/item';

/**
 * Increments the view count for an item with 24-hour deduplication logic.
 * Prevents the same user from incrementing the view count multiple times within 24 hours.
 * 
 * @param itemId - The ID of the item being viewed
 * @param userId - The ID of the user viewing the item (null for anonymous users)
 * @returns Promise<void>
 */
export async function incrementViewCount(
  itemId: string,
  userId: string | null
): Promise<void> {
  try {
    // Check if user has viewed this item in the last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const viewsRef = collection(db, 'item_views');
    const q = query(
      viewsRef,
      where('itemId', '==', itemId),
      where('userId', '==', userId),
      where('viewedAt', '>', Timestamp.fromDate(twentyFourHoursAgo))
    );
    
    const existingViews = await getDocs(q);
    
    // If user has already viewed within 24 hours, don't increment
    if (!existingViews.empty) {
      return;
    }
    
    // Use transaction to ensure atomic update
    await runTransaction(db, async (transaction) => {
      // Add view record
      const viewDocRef = doc(collection(db, 'item_views'));
      transaction.set(viewDocRef, {
        itemId,
        userId,
        viewedAt: Timestamp.now(),
      });
      
      // Increment view count on item
      const itemRef = doc(db, 'items', itemId);
      transaction.update(itemRef, {
        viewCount: increment(1),
      });
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    throw error;
  }
}

/**
 * Toggles the favorite status for an item.
 * If the item is already favorited, it removes the favorite.
 * If the item is not favorited, it adds a favorite.
 * 
 * @param itemId - The ID of the item to favorite/unfavorite
 * @param userId - The ID of the user performing the action
 * @returns Promise<boolean> - Returns the new favorite status (true if favorited, false if unfavorited)
 */
export async function toggleFavorite(
  itemId: string,
  userId: string
): Promise<boolean> {
  try {
    // Check if favorite already exists
    const favoritesRef = collection(db, 'favorites');
    const q = query(
      favoritesRef,
      where('userId', '==', userId),
      where('itemId', '==', itemId)
    );
    
    const existingFavorites = await getDocs(q);
    
    if (!existingFavorites.empty) {
      // Favorite exists, remove it
      await runTransaction(db, async (transaction) => {
        // Delete favorite document
        const favoriteDoc = existingFavorites.docs[0];
        transaction.delete(favoriteDoc.ref);
        
        // Decrement favorite count on item
        const itemRef = doc(db, 'items', itemId);
        transaction.update(itemRef, {
          favoriteCount: increment(-1),
        });
      });
      
      return false; // Unfavorited
    } else {
      // Favorite doesn't exist, add it
      await runTransaction(db, async (transaction) => {
        // Add favorite document
        const favoriteDocRef = doc(collection(db, 'favorites'));
        transaction.set(favoriteDocRef, {
          userId,
          itemId,
          createdAt: Timestamp.now(),
        });
        
        // Increment favorite count on item
        const itemRef = doc(db, 'items', itemId);
        transaction.update(itemRef, {
          favoriteCount: increment(1),
        });
      });
      
      return true; // Favorited
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
}

/**
 * Checks if a user has favorited a specific item.
 * 
 * @param itemId - The ID of the item to check
 * @param userId - The ID of the user to check
 * @returns Promise<boolean> - Returns true if the user has favorited the item, false otherwise
 */
export async function getFavoriteStatus(
  itemId: string,
  userId: string
): Promise<boolean> {
  try {
    const favoritesRef = collection(db, 'favorites');
    const q = query(
      favoritesRef,
      where('userId', '==', userId),
      where('itemId', '==', itemId)
    );
    
    const existingFavorites = await getDocs(q);
    return !existingFavorites.empty;
  } catch (error) {
    console.error('Error getting favorite status:', error);
    throw error;
  }
}

/**
 * Fetches the metadata for an item including view count, favorite count, and status history.
 * 
 * @param itemId - The ID of the item to fetch metadata for
 * @returns Promise<ItemMetadata> - Returns the item metadata
 */
export async function getItemMetadata(itemId: string): Promise<ItemMetadata> {
  try {
    const itemRef = doc(db, 'items', itemId);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      throw new Error(`Item with ID ${itemId} not found`);
    }
    
    const data = itemDoc.data();
    
    return {
      viewCount: data.viewCount || 0,
      favoriteCount: data.favoriteCount || 0,
      lastViewed: data.lastViewed || null,
      statusHistory: data.statusHistory || [],
    };
  } catch (error) {
    console.error('Error getting item metadata:', error);
    throw error;
  }
}
