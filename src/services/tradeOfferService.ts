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
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { TradeOffer } from '../types/swipe-trading';
import { retryWithBackoff } from '../utils/retryWithBackoff';
import { createLogger } from '../utils/logger';

// Create logger instance for this service
const logger = createLogger('tradeOfferService');

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
      
      logger.info('Updated existing trade offer timestamp', {
        offerId: existingDoc.id,
        tradeAnchorId,
        targetItemId,
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
    
    logger.info('Created new trade offer', {
      offerId: newTradeOfferRef.id,
      tradeAnchorId,
      targetItemId,
      offeringUserId,
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
 * Validates that both items are still available before accepting.
 *
 * @param offerId - ID of the trade offer to accept
 * @param userId - ID of the user accepting the offer (must be target item owner)
 * @returns The updated trade offer
 * @throws Error if offer not found, user is not authorized, or items are unavailable
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

    // Verify both items are still available
    const tradeAnchorDoc = await getDoc(doc(db, 'items', offerData.tradeAnchorId));
    const targetItemDoc = await getDoc(doc(db, 'items', offerData.targetItemId));

    if (!tradeAnchorDoc.exists() || !targetItemDoc.exists()) {
      throw new Error('One or more items in this trade are no longer available');
    }

    const tradeAnchorStatus = tradeAnchorDoc.data().status;
    const targetItemStatus = targetItemDoc.data().status;

    if (tradeAnchorStatus === 'unavailable' || targetItemStatus === 'unavailable') {
      throw new Error('One or more items in this trade are no longer available');
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

/**
 * Declines a trade offer by updating its status to 'declined'.
 * Only the target item owner can decline a trade offer.
 *
 * @param offerId - ID of the trade offer to decline
 * @param userId - ID of the user declining the offer (must be target item owner)
 * @returns The updated trade offer
 * @throws Error if offer not found or user is not authorized
 */
export async function declineTradeOffer(
  offerId: string,
  userId: string,
  reason?: string
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
      throw new Error('Only the target item owner can decline this trade offer');
    }

    // Update status to declined with optional reason
    const updateData: any = {
      status: 'declined',
      updatedAt: serverTimestamp(),
    };

    if (reason) {
      updateData.declineReason = reason;
    }

    await updateDoc(offerRef, updateData);

    logger.info('Trade offer declined', {
      offerId,
      userId,
      reason: reason || 'none',
    });

    return {
      ...offerData,
      id: offerId,
      status: 'declined',
      updatedAt: Timestamp.now(),
      ...(reason && { declineReason: reason }),
    };
  });
}

/**
 * Marks a trade offer as completed.
 * Both participants must confirm completion before the trade is marked as completed.
 * The first user to confirm will mark their confirmation, and when the second user confirms,
 * the trade status will be updated to 'completed'.
 *
 * @param offerId - ID of the trade offer to complete
 * @param userId - ID of the user completing the trade (must be a participant)
 * @returns The updated trade offer
 * @throws Error if offer not found or user is not authorized
 */
export async function completeTradeOffer(
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

    // Verify user is a participant (either offering user or target item owner)
    if (offerData.offeringUserId !== userId && offerData.targetItemOwnerId !== userId) {
      throw new Error('Only trade participants can complete this trade');
    }

    // Verify trade is accepted before completing
    if (offerData.status !== 'accepted' && offerData.status !== 'completed') {
      throw new Error('Trade must be accepted before it can be completed');
    }

    // Check if user has already confirmed
    const completedBy = offerData.completedBy || [];
    if (completedBy.includes(userId)) {
      throw new Error('You have already confirmed completion of this trade');
    }

    // Validate that both items are still available
    const tradeAnchorItemRef = doc(db, 'items', offerData.tradeAnchorId);
    const targetItemRef = doc(db, 'items', offerData.targetItemId);
    
    const [tradeAnchorItemDoc, targetItemDoc] = await Promise.all([
      getDoc(tradeAnchorItemRef),
      getDoc(targetItemRef)
    ]);

    if (!tradeAnchorItemDoc.exists() || !targetItemDoc.exists()) {
      throw new Error('One or more items no longer exist');
    }

    const tradeAnchorItemData = tradeAnchorItemDoc.data();
    const targetItemData = targetItemDoc.data();

    if (tradeAnchorItemData.status !== 'available' || targetItemData.status !== 'available') {
      throw new Error('One or more items are no longer available for trading');
    }

    // Add user to completedBy array
    const updatedCompletedBy = [...completedBy, userId];

    // Check if both users have now confirmed
    const bothConfirmed = 
      updatedCompletedBy.includes(offerData.offeringUserId) &&
      updatedCompletedBy.includes(offerData.targetItemOwnerId);

    // Create batch for atomic operations
    const batch = writeBatch(db);

    // Add trade offer update to batch
    batch.update(offerRef, {
      completedBy: updatedCompletedBy,
      status: bothConfirmed ? 'completed' : 'accepted',
      updatedAt: serverTimestamp(),
    });

    // If both users confirmed, mark items as traded
    if (bothConfirmed) {
      batch.update(tradeAnchorItemRef, {
        status: 'traded',
        updatedAt: serverTimestamp(),
      });

      batch.update(targetItemRef, {
        status: 'traded',
        updatedAt: serverTimestamp(),
      });

      // Query and decline all conflicting accepted trades
      const tradeOffersRef = collection(db, 'tradeOffers');
      
      // Query for trades where tradeAnchorId matches either item
      const conflictingQuery1 = query(
        tradeOffersRef,
        where('status', '==', 'accepted'),
        where('tradeAnchorId', '==', offerData.tradeAnchorId)
      );
      
      const conflictingQuery2 = query(
        tradeOffersRef,
        where('status', '==', 'accepted'),
        where('targetItemId', '==', offerData.tradeAnchorId)
      );
      
      const conflictingQuery3 = query(
        tradeOffersRef,
        where('status', '==', 'accepted'),
        where('tradeAnchorId', '==', offerData.targetItemId)
      );
      
      const conflictingQuery4 = query(
        tradeOffersRef,
        where('status', '==', 'accepted'),
        where('targetItemId', '==', offerData.targetItemId)
      );

      // Execute all queries in parallel
      const [results1, results2, results3, results4] = await Promise.all([
        getDocs(conflictingQuery1),
        getDocs(conflictingQuery2),
        getDocs(conflictingQuery3),
        getDocs(conflictingQuery4)
      ]);

      // Collect all conflicting trade offers (excluding current offer)
      const conflictingOffers = new Set<string>();
      [results1, results2, results3, results4].forEach(querySnapshot => {
        querySnapshot.docs.forEach(docSnapshot => {
          if (docSnapshot.id !== offerId) {
            conflictingOffers.add(docSnapshot.id);
          }
        });
      });

      // Add decline updates to batch for all conflicting offers
      conflictingOffers.forEach(conflictingOfferId => {
        const conflictingOfferRef = doc(db, 'tradeOffers', conflictingOfferId);
        batch.update(conflictingOfferRef, {
          status: 'declined',
          declineReason: 'Item no longer available',
          updatedAt: serverTimestamp(),
        });
      });
    }

    // Commit all updates atomically
    try {
      await batch.commit();
    } catch (error) {
      logger.error('Batch commit failed during trade completion', {
        offerId,
        userId,
        bothConfirmed: bothConfirmed.toString(),
        tradeAnchorId: offerData.tradeAnchorId,
        targetItemId: offerData.targetItemId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }

    // If both users confirmed, disable conflicting conversations
    if (bothConfirmed) {
      try {
        await disableConflictingConversations(
          offerData.tradeAnchorId,
          offerData.targetItemId,
          offerId
        );
      } catch (error) {
        // Log error but don't fail trade completion
        logger.error('Error disabling conflicting conversations', {
          offerId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Trade offer completion processed', {
      offerId,
      userId,
      bothConfirmed: bothConfirmed.toString(),
      status: bothConfirmed ? 'completed' : 'accepted',
    });

    return {
      ...offerData,
      id: offerId,
      completedBy: updatedCompletedBy,
      status: bothConfirmed ? 'completed' : 'accepted',
      updatedAt: Timestamp.now(),
    };
  });
}

/**
 * Disables conversations involving the specified items.
 * This is called when a trade is completed to prevent messaging on conflicting offers.
 * Uses exponential backoff retry logic for resilience.
 * 
 * @param tradeAnchorId - ID of the trade anchor item
 * @param targetItemId - ID of the target item
 * @param completedTradeOfferId - ID of the completed trade offer (to exclude its conversation)
 * @returns Number of conversations disabled
 */
async function disableConflictingConversations(
  tradeAnchorId: string,
  targetItemId: string,
  completedTradeOfferId: string
): Promise<number> {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const conversationsRef = collection(db, 'conversations');
      
      // Find conversations involving the trade anchor
      const tradeAnchorQuery = query(
        conversationsRef,
        where('tradeAnchorId', '==', tradeAnchorId)
      );
      
      // Find conversations involving the target item
      const targetItemQuery = query(
        conversationsRef,
        where('targetItemId', '==', targetItemId)
      );
      
      const [tradeAnchorDocs, targetItemDocs] = await Promise.all([
        getDocs(tradeAnchorQuery),
        getDocs(targetItemQuery)
      ]);
      
      // Combine and deduplicate conversations
      const conversationIds = new Set<string>();
      
      tradeAnchorDocs.docs.forEach(doc => {
        const data = doc.data();
        // Exclude the completed trade's conversation
        if (data.tradeOfferId !== completedTradeOfferId) {
          conversationIds.add(doc.id);
        }
      });
      
      targetItemDocs.docs.forEach(doc => {
        const data = doc.data();
        // Exclude the completed trade's conversation
        if (data.tradeOfferId !== completedTradeOfferId) {
          conversationIds.add(doc.id);
        }
      });
      
      // Disable each conversation
      const batch = writeBatch(db);
      const now = Timestamp.now();
      
      conversationIds.forEach(conversationId => {
        const conversationRef = doc(db, 'conversations', conversationId);
        batch.update(conversationRef, {
          status: 'disabled',
          disabledReason: 'Item no longer available',
          disabledAt: now,
        });
      });
      
      if (conversationIds.size > 0) {
        await batch.commit();
        logger.info('Disabled conflicting conversations', {
          count: conversationIds.size.toString(),
          tradeAnchorId,
          targetItemId,
          completedTradeOfferId,
        });
      }
      
      return conversationIds.size;
    } catch (error) {
      retryCount++;
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      
      logger.error('Failed to disable conversations', {
        attempt: retryCount.toString(),
        maxRetries: maxRetries.toString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      if (retryCount >= maxRetries) {
        logger.error('Max retries reached for disabling conversations', {
          tradeAnchorId,
          targetItemId,
          completedTradeOfferId,
        });
        return 0;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return 0;
}
