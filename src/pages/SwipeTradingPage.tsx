import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { SwipeSession, SwipeFilterPreferences } from '../types/swipe-trading';
import { TradeAnchorSelector } from '../components/TradeAnchorSelector';
import { SwipeInterface } from '../components/SwipeInterface';
import { SwipeFilters } from '../components/SwipeFilters';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { LoadingProgress } from '../components/LoadingProgress';
import { PageTransition } from '../components/PageTransition';
import { 
  loadInitialBatch,
  loadNextBatch,
  shouldLoadMore,
  updateCurrentIndex,
  PaginationState,
  createInitialPaginationState,
} from '../services/itemPoolService';
import { createTradeOffer } from '../services/tradeOfferService';
import {
  recordSwipe,
  createSwipeSession,
  getSwipeHistory,
  syncPendingSwipes,
} from '../services/swipeHistoryService';
import { createTradeOfferNotification } from '../services/notificationService';
import { createConversation } from '../services/messagingService';
import { hasPendingSwipes, clearCachedSessionState } from '../utils/localStorageCache';
import { getPageBackgroundClasses } from '../styles/designSystem';
import { usePageTitle } from '../hooks/usePageTitle';

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
  usePageTitle('Swipe Trading');
  const { user } = useAuth();
  const { profile } = useProfile();

  // Loading phase type for sequential loading
  type LoadingPhase = 'idle' | 'creating-session' | 'loading-items' | 'complete' | 'error';

  // State management
  const [tradeAnchor, setTradeAnchor] = useState<Item | null>(null);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [paginationState, setPaginationState] = useState<PaginationState>(createInitialPaginationState());
  const [ownerProfiles, setOwnerProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [session, setSession] = useState<SwipeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [showExtendedLoadingMessage, setShowExtendedLoadingMessage] = useState(false);
  const [showNewSessionOption, setShowNewSessionOption] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const hasAttemptedRestoreRef = useRef(false);
  const processingSwipesRef = useRef<Set<string>>(new Set());
  const [filterPreferences, setFilterPreferences] = useState<SwipeFilterPreferences>(() => {
    // Load filter preferences from localStorage
    const saved = localStorage.getItem('swipeFilterPreferences');
    return saved ? JSON.parse(saved) : { maxDistance: null, categories: [], conditions: [] };
  });

  // Note: Automatic session restoration removed to prevent unwanted auto-navigation
  // Users now always start at the trade anchor selection screen
  // Previous sessions are cleared when the page loads

  useEffect(() => {
    if (user && !hasAttemptedRestoreRef.current) {
      hasAttemptedRestoreRef.current = true;
      
      // Clear any cached session to ensure fresh start
      clearCachedSessionState();
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
      }, 3000); // Show after 3 seconds per requirement 8.4
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
    if (paginationState.loadedItems.length > 0) {
      loadOwnerProfilesForPool(paginationState.loadedItems);
    }
  }, [paginationState.loadedItems]);

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
   * Loads the item pool for swiping using pagination, excluding:
   * - Current user's items
   * - Items already swiped in this session
   * - Items with status != 'available'
   * Requirements: 5.1, 5.5
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
      
      // Use pagination for initial load
      const initialState = await loadInitialBatch(
        user.uid,
        swipeHistory,
        filterPreferences,
        profile?.coordinates || null
      );

      setPaginationState(initialState);

      // Load owner profiles for the items
      if (initialState.loadedItems.length > 0) {
        const profiles = await loadOwnerProfiles(initialState.loadedItems);
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
      setPaginationState(createInitialPaginationState());
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
    setPaginationState(createInitialPaginationState());
  };

  /**
   * Handles trade anchor selection with swipe filter preferences
   * Creates a new swipe session and transitions to swipe mode
   * Validates the item is still available before starting
   * Implements sequential loading to prevent race conditions
   */
  const handleTradeAnchorSelect = async (item: Item, filters: SwipeFilterPreferences) => {
    if (!user) return;

    console.log('[SwipeTradingPage] Trade anchor selected:', {
      itemId: item.id,
      userId: user.uid,
      filters,
      phase: 'starting'
    });

    // Update filter preferences
    setFilterPreferences(filters);
    localStorage.setItem('swipeFilterPreferences', JSON.stringify(filters));

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

      // Use pagination for initial load
      const initialState = await loadInitialBatch(
        user.uid,
        swipeHistory,
        filterPreferences,
        profile?.coordinates || null
      );
      console.log('[SwipeTradingPage] Item pool loaded:', {
        sessionId: newSession.id,
        itemCount: initialState.loadedItems.length,
        hasMore: initialState.hasMore,
        phase: 'items-loaded'
      });

      // Phase 3: Load owner profiles and complete transition to swipe mode
      setPaginationState(initialState);

      // Load owner profiles for the items
      if (initialState.loadedItems.length > 0) {
        const profiles = await loadOwnerProfiles(initialState.loadedItems);
        setOwnerProfiles(profiles);
      }

      setIsSwipeMode(true);
      setLoadingPhase('complete');

      console.log('[SwipeTradingPage] Sequential loading complete:', {
        sessionId: newSession.id,
        userId: user.uid,
        anchorId: item.id,
        itemCount: initialState.loadedItems.length,
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

    // Use the same flow as selecting a new anchor with current filter preferences
    await handleTradeAnchorSelect(tradeAnchor, filterPreferences);
  };

  /**
   * Handles changing the trade anchor during a swipe session
   * Creates a new session with empty swipe history
   */
  const handleChangeAnchor = () => {
    // Clear cached session so user can select a new anchor
    clearCachedSessionState();
    
    setIsSwipeMode(false);
    setTradeAnchor(null);
    setSession(null);
    setPaginationState(createInitialPaginationState());
    setOwnerProfiles(new Map());
  };

  /**
   * Handles swipe action (left or right)
   * - Records swipe in history
   * - If right swipe: creates trade offer and notification
   * - Removes swiped item from pool
   * - Updates pagination index and loads more if needed
   * - Handles errors gracefully without blocking progression
   * Requirements: 3.4, 5.2, 6.1, 7.1, 7.2
   */
  const handleSwipe = async (itemId: string, direction: 'left' | 'right') => {
    if (!user || !session || !tradeAnchor) {
      return;
    }

    // Prevent duplicate swipe processing
    if (processingSwipesRef.current.has(itemId)) {
      console.warn('[SwipeTradingPage] Swipe already being processed for item:', itemId);
      return;
    }

    const item = paginationState.loadedItems.find(i => i.id === itemId);
    if (!item) {
      console.warn('Item not found in pool:', itemId);
      return;
    }

    // Mark this item as being processed
    processingSwipesRef.current.add(itemId);

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
        processingSwipesRef.current.delete(itemId);
        return;
      }

      // Record swipe in history
      const swipeResult = await recordSwipe(session.id, user.uid, itemId, direction);

      // Show warning if provided
      if (swipeResult.warning) {
        setError(swipeResult.warning);
        // Clear warning after 5 seconds
        setTimeout(() => setError(null), 5000);
      }

      // If right swipe, create trade offer and notification
      if (direction === 'right') {
        await handleRightSwipe(item);
      }

      // Update pagination state - increment index and remove swiped item
      const newState = updateCurrentIndex(paginationState, paginationState.currentIndex + 1);
      const stateWithoutItem = {
        ...newState,
        loadedItems: newState.loadedItems.filter(i => i.id !== itemId),
      };
      setPaginationState(stateWithoutItem);

      // Clean up processing tracker
      processingSwipesRef.current.delete(itemId);

      // Check if we should load more items (70% threshold)
      if (shouldLoadMore(stateWithoutItem)) {
        loadMoreItems(stateWithoutItem);
      }
    } catch (err) {
      // Clean up processing tracker on error
      processingSwipesRef.current.delete(itemId);

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
        setPaginationState(prev => ({
          ...prev,
          loadedItems: prev.loadedItems.filter(i => i.id !== itemId),
        }));
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
   * Creates trade offer, sends notification to target item owner, and initiates conversation
   * Handles errors gracefully without blocking the swipe flow
   */
  const handleRightSwipe = async (targetItem: Item) => {
    // NOTE: profile is intentionally NOT required here — we fetch user name inline as a fallback
    // so that a missing/slow-loading profile does NOT silently abort the offer creation.
    if (!user || !tradeAnchor) return;

    try {
      // Validate target item is still available
      const targetItemRef = doc(db, 'items', targetItem.id);
      const targetItemDoc = await getDoc(targetItemRef);

      if (!targetItemDoc.exists() || targetItemDoc.data().status !== 'available') {
        console.warn('Target item is no longer available');
        return; // Silently skip - item was removed or sold
      }

      // Resolve the offering user's display name — prefer loaded profile, fall back to Firestore
      let offeringUserName = 'A user';
      if (profile?.firstName && profile?.lastName) {
        offeringUserName = `${profile.firstName} ${profile.lastName}`;
      } else {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const d = userDoc.data();
            offeringUserName = `${d.firstName || ''} ${d.lastName || ''}`.trim() || user.email || 'A user';
          }
        } catch {
          // Non-fatal — notification will just use the fallback name
        }
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
        offeringUserName
      );

      // Create conversation/message thread immediately after trade offer
      try {
        console.log('[SwipeTradingPage] Creating conversation for trade offer:', {
          tradeOfferId: tradeOffer.id,
          offeringUserId: user.uid,
          targetItemOwnerId: targetItem.ownerId,
        });

        const conversation = await createConversation(tradeOffer.id, user.uid, true); // allowPending = true

        console.log('[SwipeTradingPage] Conversation created successfully:', {
          conversationId: conversation.id,
          tradeOfferId: tradeOffer.id,
          participantIds: conversation.participantIds,
          targetItemOwnerId: targetItem.ownerId,
          offeringUserId: user.uid,
        });
        // The trade offer card in ConversationView already shows all item details visually —
        // no need to send a redundant auto-generated text message here.
      } catch (messageErr) {
        console.error('[SwipeTradingPage] Error creating conversation:', messageErr);
        // Don't block the swipe flow - trade offer and notification were still created
      }
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
   * Loads more items when threshold is reached
   * Requirements: 5.2, 5.3
   */
  const loadMoreItems = async (currentState: PaginationState) => {
    if (!user || !session) return;

    try {
      const swipeHistory = await getSwipeHistory(session.id, user.uid);
      
      const newState = await loadNextBatch(
        currentState,
        user.uid,
        swipeHistory,
        filterPreferences,
        profile?.coordinates || null
      );

      setPaginationState(newState);

      // Load owner profiles for new items
      const existingIds = new Set(ownerProfiles.keys());
      const newItems = newState.loadedItems.filter(item => !existingIds.has(item.ownerId));
      
      if (newItems.length > 0) {
        const newProfiles = await loadOwnerProfiles(newItems);
        setOwnerProfiles(prev => new Map([...prev, ...newProfiles]));
      }
    } catch (err) {
      console.error('Error loading more items:', err);
    }
  };

  // Loading state - show when creating session or loading items after anchor selection
  if (loading && (loadingPhase === 'creating-session' || loadingPhase === 'loading-items')) {
    const phaseMessages = {
      'creating-session': {
        message: 'Creating your swipe session',
        subtitle: 'Setting up your personalized trading experience',
      },
      'loading-items': {
        message: 'Loading available items',
        subtitle: 'Finding items that match your preferences',
      },
    };

    const currentPhase = phaseMessages[loadingPhase];

    return (
      <PageTransition variant="page">
        <div className={`flex-1 w-full flex flex-col items-center justify-center ${getPageBackgroundClasses()} relative z-0 min-h-screen px-4`}>
          <div className="max-w-2xl w-full space-y-8">
            {/* Main loading spinner */}
            <LoadingSpinner 
              variant="flow"
              message={currentPhase.message}
              size="lg" 
            />

            {/* Progress indicator */}
            <LoadingProgress 
              phase={loadingPhase}
              messages={{
                'creating-session': 'Creating session',
                'loading-items': 'Loading available items',
                'loading-profiles': 'Loading item details',
                'applying-filters': 'Applying filters',
                'complete': 'Ready to swipe',
              }}
              showExtendedMessage={showExtendedLoadingMessage}
            />
          </div>
        </div>
      </PageTransition>
    );
  }

  // Loading state - initial load
  if (loading && !tradeAnchor) {
    return (
      <PageTransition variant="page">
        <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[50vh] relative z-0">
          <LoadingSpinner 
            variant="flow"
            message="Loading your items" 
            size="lg" 
          />
          {showExtendedLoadingMessage && (
            <div className="mt-8 px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-lg max-w-md text-center animate-fadeIn">
              <div className="flex items-center justify-center gap-2 mb-1">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  This is taking longer than usual
                </p>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Please wait while we load your items...
              </p>
            </div>
          )}
        </div>
      </PageTransition>
    );
  }

  // Error state
  if (error) {
    return (
      <PageTransition variant="page">
        <div className="flex-1 w-full relative z-0">
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
      </PageTransition>
    );
  }

  // Trade anchor selection view - TradeAnchorSelector now handles its own full-page layout
  if (!isSwipeMode || !tradeAnchor) {
    return (
      <PageTransition variant="page">
        <TradeAnchorSelector
          userItems={userItems}
          onSelect={handleTradeAnchorSelect}
          isLoading={loading && loadingPhase !== 'idle'}
        />
      </PageTransition>
    );
  }

  // Swipe interface view
  const currentItem = paginationState.loadedItems.length > 0 ? paginationState.loadedItems[0] : null;
  const currentOwnerProfile = currentItem ? ownerProfiles.get(currentItem.ownerId) || null : null;
  const hasMoreItems = paginationState.loadedItems.length > 1 || paginationState.hasMore;

  /**
   * Handles restoring an item to the top of the swipe stack after undo
   * Requirements: 6.7
   */
  const handleItemRestored = (item: Item, ownerProfile: UserProfile) => {
    // Add the item back to the beginning of the loaded items
    setPaginationState(prev => ({
      ...prev,
      loadedItems: [item, ...prev.loadedItems],
    }));

    // Ensure the owner profile is in the map
    setOwnerProfiles(prev => new Map(prev).set(item.ownerId, ownerProfile));
  };

  /**
   * Detects the reason for empty state based on current conditions
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
   */
  const detectEmptyStateReason = (): 'no-filters-match' | 'no-location-match' | 'all-swiped' | 'no-anchor' | 'network-error' | 'default' => {
    // Check if there's no trade anchor
    if (!tradeAnchor) {
      return 'no-anchor';
    }

    // Check if there was a network error
    if (error && (error.includes('network') || error.includes('connection'))) {
      return 'network-error';
    }

    // Check if filters are active
    const hasActiveFilters = 
      filterPreferences.maxDistance !== null ||
      filterPreferences.categories.length > 0 ||
      filterPreferences.conditions.length > 0;

    // If location filter is active and no items, it's likely a location issue
    if (filterPreferences.maxDistance !== null && paginationState.loadedItems.length === 0) {
      return 'no-location-match';
    }

    // If other filters are active and no items, it's a filter issue
    if (hasActiveFilters && paginationState.loadedItems.length === 0) {
      return 'no-filters-match';
    }

    // If no filters and no items, user has swiped through everything
    if (!hasActiveFilters && paginationState.loadedItems.length === 0 && !paginationState.hasMore) {
      return 'all-swiped';
    }

    return 'default';
  };

  /**
   * Handles opening the filters adjustment modal
   * Requirements: 7.6
   */
  const handleAdjustFilters = () => {
    setShowFiltersModal(true);
  };

  /**
   * Handles applying new filters and reloading items
   * Requirements: 7.6
   */
  const handleApplyFilters = async (newFilters: SwipeFilterPreferences) => {
    setFilterPreferences(newFilters);
    localStorage.setItem('swipeFilterPreferences', JSON.stringify(newFilters));
    setShowFiltersModal(false);

    // Reload items with new filters
    if (user && session) {
      try {
        setLoading(true);
        const swipeHistory = await getSwipeHistory(session.id, user.uid);
        const initialState = await loadInitialBatch(
          user.uid,
          swipeHistory,
          newFilters,
          profile?.coordinates || null
        );
        setPaginationState(initialState);

        // Load owner profiles for the items
        if (initialState.loadedItems.length > 0) {
          const profiles = await loadOwnerProfiles(initialState.loadedItems);
          setOwnerProfiles(profiles);
        }
      } catch (err) {
        console.error('Error reloading items with new filters:', err);
        setError('Failed to apply filters. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * Handles retrying after a network error
   * Requirements: 7.5
   */
  const handleRetry = () => {
    setError(null);
    if (session && user) {
      loadItemPool();
    }
  };

  return (
    <PageTransition variant="page">
      <div className="flex-1 w-full relative z-0">
        <AnimatePresence mode="wait">
          <SwipeInterface
            key={currentItem?.id || 'empty'}
            tradeAnchor={tradeAnchor}
            currentItem={currentItem}
            ownerProfile={currentOwnerProfile}
            onSwipe={(direction) => {
              if (currentItem) {
                handleSwipe(currentItem.id, direction);
              }
            }}
            onChangeAnchor={handleChangeAnchor}
            hasMoreItems={hasMoreItems}
            loading={loading || paginationState.isLoading}
            syncStatus={syncStatus}
            sessionId={session?.id || ''}
            onItemRestored={handleItemRestored}
            emptyStateReason={detectEmptyStateReason()}
            onAdjustFilters={handleAdjustFilters}
            onRetry={handleRetry}
          />
        </AnimatePresence>

        {/* Filters Modal */}
        <Modal
          isOpen={showFiltersModal}
          onClose={() => setShowFiltersModal(false)}
          title="Adjust Filters"
        >
          <SwipeFilters
            onApply={handleApplyFilters}
            initialFilters={filterPreferences}
          />
        </Modal>
      </div>
    </PageTransition>
  );
}

