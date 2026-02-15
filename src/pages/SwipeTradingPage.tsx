import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { SwipeSession } from '../types/swipe-trading';
import { TradeAnchorSelector } from '../components/TradeAnchorSelector';
import { SwipeInterface } from '../components/SwipeInterface';
import { Navigation } from '../components/Navigation';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { buildItemPool } from '../services/itemPoolService';
import { createTradeOffer } from '../services/tradeOfferService';
import { 
  recordSwipe, 
  createSwipeSession, 
  getSwipeHistory,
  syncPendingSwipes,
  restoreSessionFromCache,
} from '../services/swipeHistoryService';
import { createTradeOfferNotification } from '../services/notificationService';
import { hasPendingSwipes } from '../utils/localStorageCache';

/**
 * SwipeTradingPage - Main page component for swipe trading feature
 * 
 * Manages the complete swipe trading flow:
 * 1. User selects a trade anchor from their available listings
 * 2. System creates a swipe session and loads item pool
 * 3. User swipes through items (left = pass, right = interested)
 * 4. On right swipe: creates trade offer and sends notification
 * 5. Records all swipes in session history
 * 
 * Requirements: 1.2, 1.3, 1.5, 4.1, 6.1
 */
export function SwipeTradingPage() {
  const { user } = useAuth();
  const { profile } = useProfile();

  // State management
  const [tradeAnchor, setTradeAnchor] = useState<Item | null>(null);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [itemPool, setItemPool] = useState<Item[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentOwnerProfile, setCurrentOwnerProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<SwipeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Restore session from cache on mount
  useEffect(() => {
    if (user) {
      const cachedSession = restoreSessionFromCache(user.uid);
      if (cachedSession) {
        setSession(cachedSession);
        // Load the trade anchor item and pass the session
        loadTradeAnchorFromSession(cachedSession.tradeAnchorId, cachedSession);
      }
    }
  }, [user]);

  // Sync pending swipes when online
  useEffect(() => {
    if (user && hasPendingSwipes()) {
      syncCachedSwipes();
    }
  }, [user]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (user && hasPendingSwipes()) {
        syncCachedSwipes();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  // Load user's items on mount
  useEffect(() => {
    if (user) {
      loadUserItems();
    }
  }, [user]);

  // Load owner profile for current item
  useEffect(() => {
    if (itemPool.length > 0 && currentItemIndex < itemPool.length) {
      loadOwnerProfile(itemPool[currentItemIndex].ownerId);
    }
  }, [itemPool, currentItemIndex]);

  /**
   * Fetches all items owned by the current user
   */
  const loadUserItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const itemsRef = collection(db, 'items');
      const q = query(itemsRef, where('ownerId', '==', user.uid));
      const snapshot = await getDocs(q);

      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Item));

      setUserItems(items);
    } catch (err) {
      console.error('Error loading user items:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        setError('You do not have permission to view items. Please sign in again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('failed after')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to load your items. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Loads a trade anchor item from a cached session
   */
  const loadTradeAnchorFromSession = async (tradeAnchorId: string, cachedSession: SwipeSession) => {
    if (!user) return;
    
    try {
      const itemRef = doc(db, 'items', tradeAnchorId);
      const itemDoc = await getDoc(itemRef);
      
      if (itemDoc.exists()) {
        const item = { id: itemDoc.id, ...itemDoc.data() } as Item;
        setTradeAnchor(item);
        setIsSwipeMode(true);
        
        // Load item pool for the restored session
        try {
          const swipeHistory = await getSwipeHistory(cachedSession.id, user.uid);
          const items = await buildItemPool(user.uid, swipeHistory, 20);
          setItemPool(items);
          setCurrentItemIndex(0);
        } catch (err) {
          console.error('Error loading item pool from cached session:', err);
        }
      }
    } catch (err) {
      console.error('Error loading trade anchor from cache:', err);
    }
  };

  /**
   * Syncs cached swipes to Firestore
   */
  const syncCachedSwipes = async () => {
    try {
      setSyncStatus('Syncing cached actions...');
      const syncedCount = await syncPendingSwipes();
      if (syncedCount > 0) {
        setSyncStatus(`Synced ${syncedCount} action${syncedCount > 1 ? 's' : ''}`);
        setTimeout(() => setSyncStatus(null), 3000);
      } else {
        setSyncStatus(null);
      }
    } catch (err) {
      console.error('Error syncing cached swipes:', err);
      setSyncStatus(null);
    }
  };

  /**
   * Loads the item pool for swiping, excluding:
   * - Current user's items
   * - Items already swiped in this session
   * - Items with status != 'available'
   */
  const loadItemPool = async () => {
    if (!user || !session) {
      console.warn('loadItemPool called without user or session', { user: !!user, session: !!session });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const swipeHistory = await getSwipeHistory(session.id, user.uid);
      const items = await buildItemPool(user.uid, swipeHistory, 20);
      
      // Empty pool is a valid state, not an error
      setItemPool(items);
      setCurrentItemIndex(0);
    } catch (err) {
      console.error('Error loading item pool:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      if (errorMessage.includes('session not found')) {
        setError('Your swipe session has expired. Please select a trade anchor again.');
        setIsSwipeMode(false);
      } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        setError('You do not have permission to view items. Please sign in again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('failed after')) {
        setError('Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('Invalid input')) {
        // This shouldn't happen if guards work correctly, but handle it gracefully
        console.error('Invalid input to loadItemPool - missing session or user');
        setError('Session error. Please select your trade anchor again.');
        setIsSwipeMode(false);
      } else {
        setError('Failed to load items. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Loads the profile of the owner of a specific item
   * Handles errors silently to not disrupt the swipe flow
   */
  const loadOwnerProfile = async (ownerId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, 'profiles', ownerId));
      if (profileDoc.exists()) {
        setCurrentOwnerProfile(profileDoc.data() as UserProfile);
      } else {
        // Set a default profile if not found
        setCurrentOwnerProfile({
          uid: ownerId,
          firstName: 'Unknown',
          lastName: 'User',
          email: '',
          location: 'Unknown',
          coordinates: null,
          eligible_to_match: false,
          createdAt: Timestamp.now(),
          photoUrl: null,
          lastPhotoUpdate: null,
          lastLocationUpdate: null,
        });
      }
    } catch (err) {
      console.error('Error loading owner profile:', err);
      // Set a default profile on error
      setCurrentOwnerProfile({
        uid: ownerId,
        firstName: 'Unknown',
        lastName: 'User',
        email: '',
        location: 'Unknown',
        coordinates: null,
        eligible_to_match: false,
        createdAt: Timestamp.now(),
        photoUrl: null,
        lastPhotoUpdate: null,
        lastLocationUpdate: null,
      });
    }
  };

  /**
   * Handles trade anchor selection
   * Creates a new swipe session and transitions to swipe mode
   * Validates the item is still available before starting
   */
  const handleTradeAnchorSelect = async (item: Item) => {
    if (!user) return;

    console.log('Selecting trade anchor:', {
      itemId: item.id,
      itemOwnerId: item.ownerId,
      currentUserId: user.uid,
      match: item.ownerId === user.uid
    });

    try {
      setLoading(true);
      setError(null);

      // Validate item is still available
      const itemRef = doc(db, 'items', item.id);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        setError('This item no longer exists. Please select another item.');
        setLoading(false);
        return;
      }

      const itemData = itemDoc.data();
      if (itemData.status !== 'available') {
        setError('This item is no longer available. Please select another item.');
        setLoading(false);
        return;
      }

      setTradeAnchor(item);
      
      console.log('Creating swipe session...');
      // Create new swipe session
      const newSession = await createSwipeSession(user.uid, item.id);
      console.log('Session created:', newSession.id);
      setSession(newSession);
      
      // Transition to swipe mode
      setIsSwipeMode(true);
      
      console.log('Loading item pool...');
      // Load item pool immediately after session is created
      // Don't rely on useEffect to avoid race conditions
      try {
        const swipeHistory = await getSwipeHistory(newSession.id, user.uid);
        console.log('Swipe history loaded:', swipeHistory.length, 'records');
        const items = await buildItemPool(user.uid, swipeHistory, 20);
        console.log('Item pool loaded:', items.length, 'items');
        setItemPool(items);
        setCurrentItemIndex(0);
      } catch (poolErr) {
        console.error('Error loading initial item pool:', poolErr);
        // Let the error be handled by the main catch block
        throw poolErr;
      }
    } catch (err) {
      console.error('Error creating swipe session:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      if (errorMessage.includes('requires an index')) {
        setError('Database setup incomplete. Please contact support or check the console for the index creation link.');
      } else if (errorMessage.includes('not found') || errorMessage.includes('no longer available')) {
        setError('This item is no longer available. Please select another item.');
      } else if (errorMessage.includes('permission') || errorMessage.includes('not own')) {
        setError('You do not have permission to use this item. Please select one of your own items.');
      } else if (errorMessage.includes('network') || errorMessage.includes('failed after')) {
        setError('Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('Invalid input')) {
        setError('Session error. Please try selecting your trade anchor again.');
      } else {
        setError('Failed to start swipe session. Please try again.');
      }
      
      // Reset state on error
      setIsSwipeMode(false);
      setTradeAnchor(null);
      setSession(null);
      setItemPool([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles changing the trade anchor during a swipe session
   * Creates a new session with empty swipe history
   */
  const handleChangeAnchor = () => {
    setIsSwipeMode(false);
    setTradeAnchor(null);
    setSession(null);
    setItemPool([]);
    setCurrentItemIndex(0);
  };

  /**
   * Handles swipe action (left or right)
   * - Records swipe in history
   * - If right swipe: creates trade offer and notification
   * - Advances to next item
   * - Handles errors gracefully without blocking progression
   */
  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!user || !session || !tradeAnchor || currentItemIndex >= itemPool.length) {
      return;
    }

    const currentItem = itemPool[currentItemIndex];

    try {
      // Record swipe in history
      await recordSwipe(session.id, user.uid, currentItem.id, direction);

      // If right swipe, create trade offer and notification
      if (direction === 'right') {
        await handleRightSwipe(currentItem);
      }

      // Move to next item
      setCurrentItemIndex(prev => prev + 1);

      // If we're running low on items, preload more
      if (currentItemIndex >= itemPool.length - 3) {
        preloadMoreItems();
      }
    } catch (err) {
      console.error('Error handling swipe:', err);
      
      // Determine user-friendly error message
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      if (errorMessage.includes('not found') || errorMessage.includes('no longer available')) {
        setError('This item is no longer available. Moving to the next item.');
        // Still advance to next item
        setCurrentItemIndex(prev => prev + 1);
        // Clear error after a few seconds
        setTimeout(() => setError(null), 3000);
      } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        setError('You do not have permission to perform this action. Please sign in again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('failed after')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to process swipe. Please try again.');
      }
    }
  };

  /**
   * Handles right swipe (interested)
   * Creates trade offer and sends notification to target item owner
   * Handles errors gracefully without blocking the swipe flow
   */
  const handleRightSwipe = async (targetItem: Item) => {
    if (!user || !tradeAnchor || !profile) return;

    try {
      // Validate target item is still available
      const targetItemRef = doc(db, 'items', targetItem.id);
      const targetItemDoc = await getDoc(targetItemRef);
      
      if (!targetItemDoc.exists() || targetItemDoc.data().status !== 'available') {
        console.warn('Target item is no longer available');
        return; // Silently skip - item was removed or sold
      }

      // Create trade offer
      const tradeOffer = await createTradeOffer(
        tradeAnchor.id,
        targetItem.id,
        user.uid
      );

      // Create notification for target item owner
      await createTradeOfferNotification(
        tradeOffer,
        tradeAnchor.title,
        tradeAnchor.images[0] || '',
        targetItem.title,
        targetItem.images[0] || '',
        `${profile.firstName} ${profile.lastName}`
      );
    } catch (err) {
      console.error('Error creating trade offer:', err);
      
      // Log but don't throw - we still want to record the swipe
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      if (errorMessage.includes('no longer available')) {
        // Item became unavailable during swipe - this is expected
        console.warn('Item became unavailable during swipe');
      } else {
        // Other errors - show a brief notification but don't block
        console.error('Failed to create trade offer:', errorMessage);
      }
    }
  };

  /**
   * Preloads more items when running low
   */
  const preloadMoreItems = async () => {
    if (!user || !session) return;

    try {
      const swipeHistory = await getSwipeHistory(session.id, user.uid);
      const moreItems = await buildItemPool(user.uid, swipeHistory, 20);
      
      // Add new items that aren't already in the pool
      const existingIds = new Set(itemPool.map(item => item.id));
      const newItems = moreItems.filter(item => !existingIds.has(item.id));
      
      if (newItems.length > 0) {
        setItemPool(prev => [...prev, ...newItems]);
      }
    } catch (err) {
      console.error('Error preloading items:', err);
    }
  };

  // Loading state
  if (loading && !tradeAnchor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center pt-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={() => {
                setError(null);
                if (!tradeAnchor) {
                  loadUserItems();
                } else if (session && user) {
                  loadItemPool();
                } else {
                  // If no session, go back to anchor selection
                  setIsSwipeMode(false);
                  setTradeAnchor(null);
                }
              }}
              className="mt-2 text-red-600 dark:text-red-400 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trade anchor selection view
  if (!isSwipeMode || !tradeAnchor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TradeAnchorSelector
            userItems={userItems}
            onSelect={handleTradeAnchorSelect}
            selectedItemId={tradeAnchor?.id || null}
          />
        </div>
      </div>
    );
  }

  // Swipe interface view
  const currentItem = currentItemIndex < itemPool.length ? itemPool[currentItemIndex] : null;
  const hasMoreItems = currentItemIndex < itemPool.length;

  return (
    <SwipeInterface
      tradeAnchor={tradeAnchor}
      currentItem={currentItem}
      ownerProfile={currentOwnerProfile}
      onSwipe={handleSwipe}
      onChangeAnchor={handleChangeAnchor}
      hasMoreItems={hasMoreItems}
      loading={loading}
      syncStatus={syncStatus}
    />
  );
}
