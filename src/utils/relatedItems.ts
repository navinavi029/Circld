import { collection, query, where, getDocs, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../firebase';
import { Item, EnhancedItem } from '../types/item';

interface ScoredItem {
  item: Item;
  score: number;
}

/**
 * Finds related items based on category, condition, owner, and recency.
 * 
 * Scoring algorithm:
 * - Same category: +10 points
 * - Same condition: +5 points
 * - Same owner: +3 points
 * - Recent (< 7 days): +2 points
 * 
 * @param currentItem - The item to find related items for
 * @param limit - Maximum number of related items to return (default: 8)
 * @returns Array of related items, sorted by score descending, then by createdAt descending
 */
export async function findRelatedItems(
  currentItem: Item,
  limit: number = 8
): Promise<EnhancedItem[]> {
  try {
    // Query items with the same category (excluding the current item)
    // We'll fetch more than needed and filter/score client-side
    const itemsQuery = query(
      collection(db, 'items'),
      where('status', '==', 'available'),
      firestoreLimit(50) // Fetch more items for better scoring
    );

    const snapshot = await getDocs(itemsQuery);
    const items = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Item))
      .filter(item => item.id !== currentItem.id); // Exclude current item

    // Score each item
    const scoredItems: ScoredItem[] = items.map(item => ({
      item,
      score: calculateScore(item, currentItem)
    }));

    // Sort by score descending, then by createdAt descending
    scoredItems.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // If scores are equal, sort by createdAt (most recent first)
      const aTime = a.item.createdAt?.toMillis?.() || 0;
      const bTime = b.item.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    // Return top N items (limit to 8 by default), converting to EnhancedItem
    return scoredItems.slice(0, limit).map(scored => ({
      ...scored.item,
      viewCount: scored.item.viewCount || 0,
      favoriteCount: scored.item.favoriteCount || 0,
      swipeInterestCount: scored.item.swipeInterestCount || 0,
      isFavorited: false, // This would need to be checked against user's favorites
      distance: null, // Distance calculation would be done separately if needed
    }));
  } catch (error) {
    console.error('Error finding related items:', error);
    return [];
  }
}

/**
 * Calculates the relevance score for a potential related item.
 * 
 * @param item - The item to score
 * @param currentItem - The reference item
 * @returns The calculated score
 */
function calculateScore(item: Item, currentItem: Item): number {
  let score = 0;

  // Same category: +10 points
  if (item.category === currentItem.category) {
    score += 10;
  }

  // Same condition: +5 points
  if (item.condition === currentItem.condition) {
    score += 5;
  }

  // Same owner: +3 points
  if (item.ownerId === currentItem.ownerId) {
    score += 3;
  }

  // Recent (< 7 days): +2 points
  if (isRecent(item)) {
    score += 2;
  }

  return score;
}

/**
 * Checks if an item was created within the last 7 days.
 * 
 * @param item - The item to check
 * @returns True if the item is recent (< 7 days old)
 */
function isRecent(item: Item): boolean {
  if (!item.createdAt) {
    return false;
  }

  const now = Date.now();
  const itemTime = item.createdAt.toMillis?.() || 0;
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

  return (now - itemTime) < sevenDaysInMs;
}
