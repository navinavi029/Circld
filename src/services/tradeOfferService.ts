import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { TradeOffer } from '../types/swipe-trading';
import { retryWithBackoff } from '../utils/retryWithBackoff';

/**
 * Creates a trade offer with idempotency check.
 * If a trade offer already exists for the same tradeAnchorId and targetItemId,
 * updates the timestamp instead of creating a duplicate.
 * 
 * @param tradeAnchorId - ID of the item being offered for trade
 * @param targetItemId - ID of the item the user is interested in
 * @param offeringUserId - ID of the user making the offer
 * @returns The created or updated trade offer
 */
export async function createTradeOffer(
  tradeAnchorId: string,
  targetItemId: string,
  offeringUserId: string
): Promise<TradeOffer> {
  // Validate inputs
  if (!tradeAnchorId || !targetItemId || !offeringUserId) {
    throw new Error('Invalid input: All IDs are required');
  }

  return retryWithBackoff(async () => {
    // Check for existing trade offer (idempotency)
    const tradeOffersRef = collection(db, 'tradeOffers');
    const existingQuery = query(
      tradeOffersRef,
      where('tradeAnchorId', '==', tradeAnchorId),
      where('targetItemId', '==', targetItemId),
      where('offeringUserId', '==', offeringUserId)
    );
    
    const existingDocs = await getDocs(existingQuery);
    
    if (!existingDocs.empty) {
      // Update existing trade offer timestamp
      const existingDoc = existingDocs.docs[0];
      const existingData = existingDoc.data() as TradeOffer;
      
      await updateDoc(doc(db, 'tradeOffers', existingDoc.id), {
        updatedAt: serverTimestamp(),
      });
      
      return {
        ...existingData,
        id: existingDoc.id,
        updatedAt: Timestamp.now(), // Use current timestamp for immediate return
      };
    }
    
    // Fetch item details to get owner IDs and validate items exist and are available
    const tradeAnchorDoc = await getDoc(doc(db, 'items', tradeAnchorId));
    const targetItemDoc = await getDoc(doc(db, 'items', targetItemId));
    
    if (!tradeAnchorDoc.exists()) {
      throw new Error('Trade anchor item not found or no longer available');
    }
    
    if (!targetItemDoc.exists()) {
      throw new Error('Target item not found or no longer available');
    }

    const tradeAnchorData = tradeAnchorDoc.data();
    const targetItemData = targetItemDoc.data();

    // Validate items are still available
    if (tradeAnchorData.status !== 'available') {
      throw new Error('Trade anchor item is no longer available');
    }

    if (targetItemData.status !== 'available') {
      throw new Error('Target item is no longer available');
    }

    // Validate offering user owns the trade anchor
    if (tradeAnchorData.ownerId !== offeringUserId) {
      throw new Error('User does not own the trade anchor item');
    }
    
    const tradeAnchorOwnerId = tradeAnchorData.ownerId;
    const targetItemOwnerId = targetItemData.ownerId;
    
    // Create new trade offer
    const newTradeOfferRef = doc(collection(db, 'tradeOffers'));
    const newTradeOffer: Omit<TradeOffer, 'id'> = {
      tradeAnchorId,
      tradeAnchorOwnerId,
      targetItemId,
      targetItemOwnerId,
      offeringUserId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'pending',
    };
    
    await setDoc(newTradeOfferRef, {
      ...newTradeOffer,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Increment swipeInterestCount on the target item
    const targetItemRef = doc(db, 'items', targetItemId);
    const currentSwipeCount = targetItemData.swipeInterestCount || 0;
    await updateDoc(targetItemRef, {
      swipeInterestCount: currentSwipeCount + 1,
    });
    
    return {
      ...newTradeOffer,
      id: newTradeOfferRef.id,
    };
  });
}

/**
 * Retrieves all trade offers for a specific user where they are the target item owner.
 * 
 * @param userId - ID of the user to get trade offers for
 * @returns Array of trade offers where the user is the target item owner
 */
export async function getTradeOffersForUser(userId: string): Promise<TradeOffer[]> {
  if (!userId) {
    throw new Error('Invalid input: User ID is required');
  }

  return retryWithBackoff(async () => {
    const tradeOffersRef = collection(db, 'tradeOffers');
    const q = query(
      tradeOffersRef,
      where('targetItemOwnerId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as TradeOffer));
  });
}

/**
 * Marks a trade offer as read by updating its status.
 * 
 * @param offerId - ID of the trade offer to mark as read
 */
export async function markOfferAsRead(offerId: string): Promise<void> {
  if (!offerId) {
    throw new Error('Invalid input: Offer ID is required');
  }

  return retryWithBackoff(async () => {
    const offerRef = doc(db, 'tradeOffers', offerId);
    
    // Verify offer exists before updating
    const offerDoc = await getDoc(offerRef);
    if (!offerDoc.exists()) {
      throw new Error('Trade offer not found');
    }

    await updateDoc(offerRef, {
      status: 'read',
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Retrieves all trade offers for a specific item.
 * 
 * @param itemId - ID of the item to get trade offers for
 * @returns Array of trade offers where the item is the target
 */
export async function getTradeOffersForItem(itemId: string): Promise<TradeOffer[]> {
  if (!itemId) {
    throw new Error('Invalid input: Item ID is required');
  }

  return retryWithBackoff(async () => {
    const tradeOffersRef = collection(db, 'tradeOffers');
    const q = query(
      tradeOffersRef,
      where('targetItemId', '==', itemId)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as TradeOffer));
  });
}

/**
 * Accepts a trade offer by updating its status to 'accepted'.
 * Only the target item owner can accept a trade offer.
 *
 * @param offerId - ID of the trade offer to accept
 * @param userId - ID of the user accepting the offer (must be target item owner)
 * @returns The updated trade offer
 * @throws Error if offer not found or user is not authorized
 */
export async function acceptTradeOffer(
  offerId: string,
  userId: string
): Promise<TradeOffer> {
  if (!offerId || !userId) {
    throw new Error('Invalid input: Offer ID and User ID are required');
  }

  return retryWithBackoff(async () => {
    const offerRef = doc(db, 'tradeOffers', offerId);

    // Verify offer exists and user is authorized
    const offerDoc = await getDoc(offerRef);
    if (!offerDoc.exists()) {
      throw new Error('Trade offer not found');
    }

    const offerData = offerDoc.data() as TradeOffer;

    // Verify user is the target item owner
    if (offerData.targetItemOwnerId !== userId) {
      throw new Error('Only the target item owner can accept this trade offer');
    }

    // Update status to accepted
    await updateDoc(offerRef, {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });

    return {
      ...offerData,
      id: offerId,
      status: 'accepted',
      updatedAt: Timestamp.now(),
    };
  });
}
