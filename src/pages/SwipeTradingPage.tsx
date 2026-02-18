import { useState, useEffect, useRef } from 'react';
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
import { hasPendingSwipes, clearCachedSessionState } from '../utils/localStorageCache';

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

  // Loading phase type for sequential loading
  type LoadingPhase = 'idle' | 'creating-session' | 'loading-items' | 'complete' | 'error';

  // State management
  const [tradeAnchor, setTradeAnchor] = useState<Item | null>(null);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [itemPool, setItemPool] = useState<Item[]>([]);
  const [ownerProfiles, setOwnerProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [session, setSession] = useState<SwipeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [showExtendedLoadingMessage, setShowExtendedLoadingMessage] = useState(false);
  const [showNewSessionOption, setShowNewSessionOption] = useState(false);
  const hasAttemptedRestoreRef = useRef(false);

  // Restore session from cache on mount (only once, even in Strict Mode)
  useEffect(() => {
    if (user && !hasAttemptedRestoreRef.current) {
      hasAttemptedRestoreRef.current = true;
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

  // Extended loading message timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    // Start timer when loading begins
    if (loading && (loadingPhase === 'creating-session' || loadingPhase === 'loading-items')) {
      timer = setTimeout(() => {
        setShowExtendedLoadingMessage(true);
      }, 5000);
    } else {
      // Clear extended message when loading completes or errors
      setShowExtendedLoadingMessage(false);
    }

    // Cleanup timer on unmount or when dependencies change
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [loading, loadingPhase]);

  // Load user's items on mount
  useEffect(() => {
    if (user) {
      loadUserItems();
    }
  }, [user]);

  // Load owner profile for current item
  useEffect(() => {
    if (itemPool.length > 0) {
      loadOwnerProfilesForPool(itemPool);
    }
  }, [itemPool]);

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
      console.error('[SwipeTradingPage] Error loading user items:', {
        timestamp: new Date().toISOString(),
        component: 'SwipeTradingPage',
        action: 'loadUserItems',
        userId: user.uid,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      
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
   * Validates trade anchor existence before loading item pool
   * Clears cache if anchor no longer exists
   * Uses same error handling as new sessions
   * Requirements: 6.1, 6.2, 6.3, 6.5
   */
  const loadTradeAnchorFromSession = async (tradeAnchorId: string, cachedSession: SwipeSession) => {
    if (!user) return;
    
    console.log('[SwipeTradingPage] Restoring session from cache:', {
      timestamp: new Date().toISOString(),
      component: 'SwipeTradingPage',
      action: 'loadTradeAnchorFromSession',
      sessionId: cachedSession.id,
      userId: user.uid,
      tradeAnchorId,
      phase: 'starting-restoration',
    });
    
    try {
      setLoading(true);
      setError(null);
      setLoadingPhase('loading-items');
      
      // Validate trade anchor still exists (Requirement 6.1)
      const itemRef = doc(db, 'items', tradeAnchorId);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        // Trade anchor no longer exists - clear cache (Requirement 6.2)
        console.warn('[SwipeTradingPage] Cached trade anchor no longer exists, clearing cache:', {
          timestamp: new Date().toISOString(),
          component: 'SwipeTradingPage',
          action: 'loadTradeAnchorFromSession',
          sessionId: cachedSession.id,
          userId: user.uid,
          tradeAnchorId,
          phase: 'anchor-not-found',
        });
        
        clearCachedSessionState();
        setError('Your previous trade anchor is no longer available. Please select a new item.');
        setShowNewSessionOption(true);
        setLoading(false);
        setLoadingPhase('error');
        return;
      }
      
      const itemData = itemDoc.data();
      
      // Validate trade anchor is still available
      if (itemData.status !== 'available') {
        console.warn('[SwipeTradingPage] Cached trade anchor no longer available, clearing cache:', {
          timestamp: new Date().toISOString(),
          component: 'SwipeTradingPage',
          action: 'loadTradeAnchorFromSession',
          sessionId: cachedSession.id,
          userId: user.uid,
          tradeAnchorId,
          status: itemData.status,
          phase: 'anchor-unavailable',
        });
        
        clearCachedSessionState();
        setError('Your previous trade anchor is no longer available. Please select a new item.');
        setShowNewSessionOption(true);
        setLoading(false);
        setLoadingPhase('error');
        return;
      }
      
      const item = { id: itemDoc.id, ...itemDoc.data() } as Item;
      setTradeAnchor(item);
      setSession(cachedSession);
      
      // Load item pool with same error handling as new sessions (Requirement 6.3)
      try {
        console.log('[SwipeTradingPage] Loading item pool for restored session:', {
          timestamp: new Date().toISOString(),
          component: 'SwipeTradingPage',
          action: 'loadTradeAnchorFromSession',
          sessionId: cachedSession.id,
          userId: user.uid,
          tradeAnchorId,
          phase: 'loading-item-pool',
        });
        
        const swipeHistory = await getSwipeHistory(cachedSession.id, user.uid);
        console.log('[SwipeTradingPage] Swipe history loaded for restored session:', {
          sessionId: cachedSession.id,
          historyCount: swipeHistory.length,
          phase: 'history-loaded',
        });
        
        const items = await buildItemPool(user.uid, swipeHistory, 20);
        
        // Log successful restoration (Requirement 6.5)
        console.log('[SwipeTradingPage] Session restored successfully:', {
          timestamp: new Date().toISOString(),
          component: 'SwipeTradingPage',
          action: 'loadTradeAnchorFromSession',
          sessionId: cachedSession.id,
          userId: user.uid,
          tradeAnchorId,
          itemCount: items.length,
          phase: 'restoration-complete',
        });
        
        setItemPool(items);
        
        // Load owner profiles for the items
        if (items.length > 0) {
          const profiles = await loadOwnerProfiles(items);
          setOwnerProfiles(profiles);
        }
        
        setIsSwipeMode(true);
        setLoadingPhase('complete');
      } catch (err) {
        // Silently handle restoration errors - just clear cache and let user start fresh
        console.warn('[SwipeTradingPage] Error loading item pool from cached session, clearing cache:', {
          timestamp: new Date().toISOString(),
          component: 'SwipeTradingPage',
          action: 'loadTradeAnchorFromSession',
          sessionId: cachedSession.id,
          userId: user.uid,
          tradeAnchorId,
          error: err instanceof Error ? err.message : 'Unknown error',
          phase: 'restoration-failed-clearing-cache',
        });
        
        // Clear the cached session and let user start fresh
        clearCachedSessionState();
        setSession(null);
        setTradeAnchor(null);
        setIsSwipeMode(false);
        setLoadingPhase('idle');
      }
    } catch (err) {
      // Silently handle restoration errors - just clear cache and let user start fresh
      console.warn('[SwipeTradingPage] Error restoring session from cache, clearing cache:', {
        timestamp: new Date().toISOString(),
        component: 'SwipeTradingPage',
        action: 'loadTradeAnchorFromSession',
        sessionId: cachedSession.id,
        userId: user.uid,
        tradeAnchorId,
        error: err instanceof Error ? err.message : 'Unknown error',
        phase: 'restoration-failed-clearing-cache',
      });
      
      // Clear the cached session and let user start fresh
      clearCachedSessionState();
      setSession(null);
      setTradeAnchor(null);
      setIsSwipeMode(false);
      setLoadingPhase('idle');
    } finally {
      setLoading(false);
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
      
      // Load owner profiles for the items
      if (items.length > 0) {
        const profiles = await loadOwnerProfiles(items);
        setOwnerProfiles(profiles);
      }
    } catch (err) {
      console.error('[SwipeTradingPage] Error loading item pool:', {
        timestamp: new Date().toISOString(),
        component: 'SwipeTradingPage',
        action: 'loadItemPool',
        sessionId: session?.id,
        userId: user?.uid,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      
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
   * Creates a default profile for an owner when profile cannot be loaded
   * Used as fallback for missing or errored profiles
   */
  const createDefaultProfile = (ownerId: string): UserProfile => {
    return {
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
    };
  };

  /**
   * Loads owner profiles for all items in the pool
   * Updates the ownerProfiles map with batch loaded profiles
   */
  const loadOwnerProfilesForPool = async (items: Item[]) => {
    try {
      const profiles = await loadOwnerProfiles(items);
      setOwnerProfiles(profiles);
    } catch (err) {
      console.error('Error loading owner profiles for pool:', err);
      // Continue with empty profiles map - individual cards will show default profiles
    }
  };

  /**
   * Loads owner profiles for multiple items in parallel
   * Creates a Map for efficient lookup by owner ID
   * Handles errors gracefully with default profiles
   * Requirements: 5.6
   */
  const loadOwnerProfiles = async (items: Item[]): Promise<Map<string, UserProfile>> => {
    const profiles = new Map<string, UserProfile>();
    
    // Get unique owner IDs to avoid duplicate requests
    const uniqueOwnerIds = [...new Set(items.map(item => item.ownerId))];
    
    // Load all profiles in parallel
    await Promise.all(
      uniqueOwnerIds.map(async (ownerId) => {
        try {
          const profileDoc = await getDoc(doc(db, 'users', ownerId));
          if (profileDoc.exists()) {
            profiles.set(ownerId, profileDoc.data() as UserProfile);
          } else {
            console.warn('Profile not found for ownerId:', ownerId);
            profiles.set(ownerId, createDefaultProfile(ownerId));
          }
        } catch (err) {
          console.error('Error loading profile for ownerId:', ownerId, err);
          profiles.set(ownerId, createDefaultProfile(ownerId));
        }
      })
    );
    
    return profiles;
  };

  /**
   * Handles loading errors with classification and comprehensive logging
   * Classifies errors into specific types and provides user-friendly messages
   * Logs diagnostic information for debugging
   * Resets loading state to allow retry
   */
  const handleLoadingError = (err: unknown, anchorId?: string) => {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    
    // Comprehensive error logging with context
    console.error('[SwipeTradingPage] Loading error details:', {
      timestamp: new Date().toISOString(),
      component: 'SwipeTradingPage',
      action: 'handleLoadingError',
      message: errorMessage,
      phase: loadingPhase,
      userId: user?.uid,
      sessionId: session?.id,
      tradeAnchorId: anchorId || tradeAnchor?.id,
      stack: err instanceof Error ? err.stack : undefined,
    });
    
    // Classify error and set specific user-friendly message
    if (errorMessage.includes('session creation failed') || errorMessage.includes('Failed to create session')) {
      setError('Failed to create swipe session. Please try again.');
    } else if (errorMessage.includes('failed after') || errorMessage.includes('network') || errorMessage.includes('UNAVAILABLE')) {
      setError('Network error. Please check your connection and try again.');
    } else if (errorMessage.includes('requires an index')) {
      setError('Database setup incomplete. Please contact support or check the console for the index creation link.');
    } else if (errorMessage.includes('not found') || errorMessage.includes('no longer available')) {
      setError('This item is no longer available. Please select another item.');
    } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized') || errorMessage.includes('not own')) {
      setError('You do not have permission to use this item. Please select one of your own items.');
    } else if (errorMessage.includes('Invalid input')) {
      setError('Session error. Please try selecting your trade anchor again.');
    } else if (errorMessage.includes('no items') || errorMessage.includes('empty pool')) {
      // This is actually a valid state - no items available
      console.log('[SwipeTradingPage] Empty item pool - no items available for swiping');
      setItemPool([]);
      setIsSwipeMode(true);
      setLoadingPhase('complete');
      return; // Don't set error state for empty pool
    } else {
      setError('Failed to load items. Please try again.');
    }
    
    // Reset loading state to allow retry
    setLoadingPhase('error');
    setIsSwipeMode(false);
    setTradeAnchor(null);
    setSession(null);
    setItemPool([]);
  };

  /**
   * Handles trade anchor selection
   * Creates a new swipe session and transitions to swipe mode
   * Validates the item is still available before starting
   * Implements sequential loading to prevent race conditions
   */
  const handleTradeAnchorSelect = async (item: Item) => {
    if (!user) return;

    console.log('[SwipeTradingPage] Trade anchor selected:', {
      itemId: item.id,
      userId: user.uid,
      phase: 'starting'
    });

    try {
      setLoading(true);
      setError(null);
      setLoadingPhase('idle');

      // Validate item is still available
      const itemRef = doc(db, 'items', item.id);
      const itemDoc = await getDoc(itemRef);
      
      if (!itemDoc.exists()) {
        setError('This item no longer exists. Please select another item.');
        setLoading(false);
        setLoadingPhase('error');
        return;
      }

      const itemData = itemDoc.data();
      if (itemData.status !== 'available') {
        setError('This item is no longer available. Please select another item.');
        setLoading(false);
        setLoadingPhase('error');
        return;
      }

      // Phase 1: Create session
      setLoadingPhase('creating-session');
      console.log('[SwipeTradingPage] Creating session:', {
        userId: user.uid,
        anchorId: item.id,
        phase: 'creating-session'
      });
      
      const newSession = await createSwipeSession(user.uid, item.id);
      
      console.log('[SwipeTradingPage] Session created:', {
        sessionId: newSession.id,
        userId: user.uid,
        anchorId: item.id,
        phase: 'session-created'
      });
      
      setSession(newSession);
      setTradeAnchor(item);
      
      // Phase 2: Load item pool (sequential - only after session is created)
      setLoadingPhase('loading-items');
      console.log('[SwipeTradingPage] Loading item pool:', {
        sessionId: newSession.id,
        userId: user.uid,
        anchorId: item.id,
        phase: 'loading-items'
      });
      
      const swipeHistory = await getSwipeHistory(newSession.id, user.uid);
      console.log('[SwipeTradingPage] Swipe history loaded:', {
        sessionId: newSession.id,
        historyCount: swipeHistory.length,
        phase: 'history-loaded'
      });
      
      const items = await buildItemPool(user.uid, swipeHistory, 20);
      console.log('[SwipeTradingPage] Item pool loaded:', {
        sessionId: newSession.id,
        itemCount: items.length,
        phase: 'items-loaded'
      });
      
      // Phase 3: Load owner profiles and complete transition to swipe mode
      setItemPool(items);
      
      // Load owner profiles for the items
      if (items.length > 0) {
        const profiles = await loadOwnerProfiles(items);
        setOwnerProfiles(profiles);
      }
      
      setIsSwipeMode(true);
      setLoadingPhase('complete');
      
      console.log('[SwipeTradingPage] Sequential loading complete:', {
        sessionId: newSession.id,
        userId: user.uid,
        anchorId: item.id,
        itemCount: items.length,
        phase: 'complete'
      });
    } catch (err) {
      handleLoadingError(err, item.id);
    } finally {
      setLoading(false);
    }
  };
  /**
   * Handles creating a new session with the same trade anchor after restoration failure
   * Requirements: 6.4
   */
  const handleCreateNewSession = async () => {
    if (!user || !tradeAnchor) return;
    
    console.log('[SwipeTradingPage] Creating new session after restoration failure:', {
      timestamp: new Date().toISOString(),
      component: 'SwipeTradingPage',
      action: 'handleCreateNewSession',
      userId: user.uid,
      tradeAnchorId: tradeAnchor.id,
    });
    
    // Clear error and new session option
    setError(null);
    setShowNewSessionOption(false);
    
    // Use the same flow as selecting a new anchor
    await handleTradeAnchorSelect(tradeAnchor);
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
    setOwnerProfiles(new Map());
  };

  /**
   * Handles swipe action (left or right)
   * - Records swipe in history
   * - If right swipe: creates trade offer and notification
   * - Removes swiped item from pool
   * - Handles errors gracefully without blocking progression
   * Requirements: 3.4, 6.1, 7.1, 7.2
   */
  const handleSwipe = async (itemId: string, direction: 'left' | 'right') => {
    if (!user || !session || !tradeAnchor) {
      return;
    }

    const item = itemPool.find(i => i.id === itemId);
    if (!item) {
      console.warn('Item not found in pool:', itemId);
      return;
    }

    try {
      // Validate session is still valid (check if trade anchor still exists and is available)
      const anchorRef = doc(db, 'items', tradeAnchor.id);
      const anchorDoc = await getDoc(anchorRef);
      
      if (!anchorDoc.exists() || anchorDoc.data().status !== 'available') {
        console.warn('[SwipeTradingPage] Trade anchor no longer available during swipe:', {
          timestamp: new Date().toISOString(),
          component: 'SwipeTradingPage',
          action: 'handleSwipe',
          sessionId: session.id,
          userId: user.uid,
          tradeAnchorId: tradeAnchor.id,
          exists: anchorDoc.exists(),
          status: anchorDoc.exists() ? anchorDoc.data().status : 'N/A',
        });
        
        // Clear session and show error
        clearCachedSessionState();
        setSession(null);
        setError('Your trade anchor is no longer available. Please select a new item to continue.');
        setIsSwipeMode(false);
        return;
      }
      
      // Record swipe in history
      await recordSwipe(session.id, user.uid, itemId, direction);

      // If right swipe, create trade offer and notification
      if (direction === 'right') {
        await handleRightSwipe(item);
      }

      // Remove item from pool
      setItemPool(prev => prev.filter(i => i.id !== itemId));

      // If we're running low on items, preload more (threshold changed from 3 to 5)
      if (itemPool.length <= 5) {
        preloadMoreItems();
      }
    } catch (err) {
      console.error('[SwipeTradingPage] Error handling swipe:', {
        timestamp: new Date().toISOString(),
        component: 'SwipeTradingPage',
        action: 'handleSwipe',
        direction,
        sessionId: session?.id,
        userId: user?.uid,
        itemId: itemId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      
      // Determine user-friendly error message
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      if (errorMessage.includes('not found') || errorMessage.includes('no longer available')) {
        setError('This item is no longer available. Moving to the next item.');
        // Still remove item from pool
        setItemPool(prev => prev.filter(i => i.id !== itemId));
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
      setLoadingError(null); // Clear any previous loading errors
      const swipeHistory = await getSwipeHistory(session.id, user.uid);
      const moreItems = await buildItemPool(user.uid, swipeHistory, 20);
      
      // Add new items that aren't already in the pool
      const existingIds = new Set(itemPool.map(item => item.id));
      const newItems = moreItems.filter(item => !existingIds.has(item.id));
      
      if (newItems.length > 0) {
        setItemPool(prev => [...prev, ...newItems]);
        
        // Load owner profiles for new items
        const newProfiles = await loadOwnerProfiles(newItems);
        setOwnerProfiles(prev => new Map([...prev, ...newProfiles]));
      }
    } catch (err) {
      console.error('Error preloading items:', err);
      setLoadingError('Failed to load more cards. They will retry automatically.');
      
      // Clear the error after 5 seconds
      setTimeout(() => setLoadingError(null), 5000);
    }
  };

  // Loading state
  if (loading && !tradeAnchor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex flex-col items-center justify-center pt-20">
          <LoadingSpinner />
          {showExtendedLoadingMessage && (
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              This is taking longer than usual. Please wait...
            </p>
          )}
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
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  setError(null);
                  setShowNewSessionOption(false);
                  setLoadingPhase('idle'); // Reset loading phase for retry
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
                className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
              >
                Retry
              </button>
              {showNewSessionOption && tradeAnchor && (
                <button
                  onClick={handleCreateNewSession}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                >
                  Create New Session
                </button>
              )}
            </div>
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
  const currentItem = itemPool.length > 0 ? itemPool[0] : null;
  const currentOwnerProfile = currentItem ? ownerProfiles.get(currentItem.ownerId) || null : null;

  return (
    <SwipeInterface
      tradeAnchor={tradeAnchor}
      currentItem={currentItem}
      ownerProfile={currentOwnerProfile}
      onSwipe={(direction) => {
        if (currentItem) {
          handleSwipe(currentItem.id, direction);
        }
      }}
      onChangeAnchor={handleChangeAnchor}
      hasMoreItems={itemPool.length > 1}
      loading={loading}
      syncStatus={syncStatus}
    />
  );
}
