import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Alert } from '../components/ui/Alert';
import { Navigation } from '../components/Navigation';
import { AddItemForm } from '../components/AddItemForm';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { QuickActions } from '../components/QuickActions';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { toggleFavorite } from '../utils/metadata';
import { calculateDistanceForItem, formatDistanceDisplay } from '../utils/location';

export function Listings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [showTradeOffersOnly, setShowTradeOffersOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [ownerProfiles, setOwnerProfiles] = useState<Map<string, UserProfile>>(new Map());

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, selectedCategory, selectedCondition, showTradeOffersOnly]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  useEffect(() => {
    if (items.length > 0) {
      loadOwnerProfiles();
    }
  }, [items]);

  const fetchItems = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Try with orderBy first
      let q = query(
        collection(db, 'items'),
        where('ownerId', '==', user.uid),
        where('status', '==', 'available'),
        orderBy('createdAt', 'desc')
      );
      
      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch (indexError) {
        // If index error, try without orderBy
        console.warn('Firestore index not found, fetching without ordering:', indexError);
        q = query(
          collection(db, 'items'),
          where('ownerId', '==', user.uid),
          where('status', '==', 'available')
        );
        snapshot = await getDocs(q);
      }
      
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Item[];
      
      setItems(itemsData);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedCondition !== 'all') {
      filtered = filtered.filter(item => item.condition === selectedCondition);
    }

    if (showTradeOffersOnly) {
      filtered = filtered.filter(item => (item.swipeInterestCount || 0) > 0);
    }

    setFilteredItems(filtered);
  };

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      const favoritesRef = collection(db, 'favorites');
      const q = query(favoritesRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      const favoriteIds = new Set(snapshot.docs.map(doc => doc.data().itemId));
      setFavorites(favoriteIds);
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };

  const loadOwnerProfiles = async () => {
    const ownerIds = Array.from(new Set(items.map(item => item.ownerId)));
    const profiles = new Map<string, UserProfile>();
    
    await Promise.all(
      ownerIds.map(async (ownerId) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', ownerId));
          if (userDoc.exists()) {
            profiles.set(ownerId, userDoc.data() as UserProfile);
          }
        } catch (err) {
          console.error(`Error loading profile for ${ownerId}:`, err);
        }
      })
    );
    
    setOwnerProfiles(profiles);
  };

  const handleFavoriteToggle = async (itemId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const newStatus = await toggleFavorite(itemId, user.uid);
      
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (newStatus) {
          newFavorites.add(itemId);
        } else {
          newFavorites.delete(itemId);
        }
        return newFavorites;
      });

      // Update the item's favorite count in local state
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? { ...item, favoriteCount: (item.favoriteCount || 0) + (newStatus ? 1 : -1) }
            : item
        )
      );
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorite status');
    }
  };

  const getOwnerInitials = (ownerId: string): string => {
    const ownerProfile = ownerProfiles.get(ownerId);
    if (!ownerProfile) return '?';
    
    const firstInitial = ownerProfile.firstName?.charAt(0) || '';
    const lastInitial = ownerProfile.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const getOwnerName = (ownerId: string): string => {
    const ownerProfile = ownerProfiles.get(ownerId);
    if (!ownerProfile) return 'Unknown';
    
    return `${ownerProfile.firstName} ${ownerProfile.lastName}`;
  };

  const getDistanceDisplay = (ownerId: string): string | null => {
    const ownerProfile = ownerProfiles.get(ownerId);
    if (!ownerProfile) return null;
    
    const distance = calculateDistanceForItem(
      profile?.coordinates || null,
      ownerProfile.coordinates || null
    );
    
    return formatDistanceDisplay(distance, ownerProfile.location);
  };

  const categories = Array.from(new Set(items.map(item => item.category)));

  if (loading) {
    return (
      <div className="h-screen bg-background dark:bg-gray-900 overflow-hidden">
        <Navigation />
        <div className="flex justify-center items-center" style={{ height: 'calc(100vh - 4rem)' }}>
          <LoadingSpinner message="Loading items..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text dark:text-gray-100">My Listings</h1>
            <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} available
            </p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="hidden sm:flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Listing
          </Button>
        </div>

        {error && <Alert variant="error" className="mb-6">{error}</Alert>}

        {/* Filters Section */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>

              <Select
                label="Condition"
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
              >
                <option value="all">All Conditions</option>
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </Select>
            </div>

            {/* Trade Offers Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTradeOffersOnly(!showTradeOffersOnly)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showTradeOffersOnly
                    ? 'bg-accent dark:bg-primary-light text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-text-secondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Items with Trade Offers
              </button>
            </div>

            {(searchTerm || selectedCategory !== 'all' || selectedCondition !== 'all' || showTradeOffersOnly) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedCondition('all');
                  setShowTradeOffersOnly(false);
                }}
                className="text-sm text-accent hover:text-accent-dark dark:text-primary-light dark:hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text dark:text-gray-100 mb-2">No items found</h3>
            <p className="text-text-secondary dark:text-gray-400 mb-6 text-sm">
              {searchTerm || selectedCategory !== 'all' || selectedCondition !== 'all' || showTradeOffersOnly
                ? 'Try adjusting your filters' 
                : 'Be the first to add an item'}
            </p>
            {!searchTerm && selectedCategory === 'all' && selectedCondition === 'all' && !showTradeOffersOnly && (
              <Button onClick={() => setShowAddForm(true)}>Add Your First Item</Button>
            )}
          </div>
        ) : (
          /* Items Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const isFavorited = favorites.has(item.id);
              const distanceDisplay = getDistanceDisplay(item.ownerId);
              const ownerName = getOwnerName(item.ownerId);
              const ownerInitials = getOwnerInitials(item.ownerId);
              
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/listings/${item.id}`)}
                  className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-accent dark:hover:border-primary-light transition-all duration-200 cursor-pointer flex flex-col relative"
                >
                  {/* Quick Actions */}
                  <QuickActions
                    itemId={item.id}
                    itemTitle={item.title}
                    isFavorited={isFavorited}
                    onFavoriteToggle={handleFavoriteToggle}
                  />

                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    {item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Image count indicator */}
                    {item.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-md flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {item.images.length}
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs font-medium text-text dark:text-gray-100 rounded-md shadow capitalize">
                        {item.condition.replace('-', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 bg-accent/10 dark:bg-primary-light/20 text-accent dark:text-primary-light rounded text-xs font-medium flex-shrink-0">
                        {item.category}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded text-xs font-medium flex-shrink-0">
                        Available
                      </span>
                    </div>
                    
                    <h3 className="text-base font-semibold mb-2 text-text dark:text-gray-100 line-clamp-1 group-hover:text-accent dark:group-hover:text-primary-light transition-colors">
                      {item.title}
                    </h3>
                    
                    <p className="text-text-secondary dark:text-gray-400 text-sm line-clamp-2 mb-3 flex-grow">
                      {item.description}
                    </p>
                    
                    {/* Metadata section */}
                    <div className="flex items-center gap-3 text-xs text-text-secondary dark:text-gray-500 mb-3">
                      {(item.viewCount || 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{item.viewCount}</span>
                        </div>
                      )}
                      {(item.favoriteCount || 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{item.favoriteCount}</span>
                        </div>
                      )}
                      {(item.swipeInterestCount || 0) > 0 && (
                        <div className="flex items-center gap-1" title="Swipe interest">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span>{item.swipeInterestCount}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Owner and location info */}
                    <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-gray-500">
                        <div className="w-5 h-5 rounded-full bg-accent/20 dark:bg-primary-light/20 flex items-center justify-center text-accent dark:text-primary-light font-medium text-[10px]">
                          {ownerInitials}
                        </div>
                        <span className="truncate">{ownerName}</span>
                      </div>
                      
                      
                      <div className="flex items-center text-xs text-text-secondary dark:text-gray-500">
                        <svg className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">
                          {item.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => setShowAddForm(true)}
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-accent dark:bg-primary-light text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center z-40"
        aria-label="Add new listing"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Add Item Modal */}
      {showAddForm && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeInFast"
          onClick={() => setShowAddForm(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-text dark:text-gray-100">Add New Listing</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 73px)' }}>
              <AddItemForm onSuccess={() => {
                setShowAddForm(false);
                fetchItems();
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}