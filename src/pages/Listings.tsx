import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { PageTransition } from '../components/PageTransition';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Alert } from '../components/ui/Alert';
import { AddItemForm } from '../components/AddItemForm';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Pagination } from '../components/ui/Pagination';
import { QuickActions } from '../components/QuickActions';
import { useAuth } from '../contexts/AuthContext';
import { toggleFavorite } from '../utils/metadata';

type ViewMode = 'grid' | 'list';

function getRelativeTime(timestamp: any): string {
  const date = timestamp?.toDate?.();
  if (!date) return 'Recently';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function getConditionBadgeClass(condition: string): string {
  switch (condition) {
    case 'new': return 'bg-emerald-500 text-white';
    case 'like-new': return 'bg-sky-500 text-white';
    case 'good': return 'bg-amber-500 text-white';
    case 'fair': return 'bg-orange-500 text-white';
    case 'poor': return 'bg-red-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

export function Listings() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const PAGE_SIZE = 10;

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
    if (!user) { setLoading(false); return; }
    try {
      let q = query(
        collection(db, 'items'),
        where('ownerId', '==', user.uid),
        where('status', '==', 'available'),
        orderBy('createdAt', 'desc')
      );
      let snapshot;
      try {
        snapshot = await getDocs(q);
      } catch {
        q = query(collection(db, 'items'), where('ownerId', '==', user.uid), where('status', '==', 'available'));
        snapshot = await getDocs(q);
      }
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Item[]);
    } catch (err) {
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
    if (selectedCategory !== 'all') filtered = filtered.filter(item => item.category === selectedCategory);
    if (selectedCondition !== 'all') filtered = filtered.filter(item => item.condition === selectedCondition);
    if (showTradeOffersOnly) filtered = filtered.filter(item => (item.swipeInterestCount || 0) > 0);
    setFilteredItems(filtered);
    setCurrentPage(1);
  };

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const snapshot = await getDocs(query(collection(db, 'favorites'), where('userId', '==', user.uid)));
      setFavorites(new Set(snapshot.docs.map(doc => doc.data().itemId)));
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };

  const loadOwnerProfiles = async () => {
    const ownerIds = Array.from(new Set(items.map(item => item.ownerId)));
    const profiles = new Map<string, UserProfile>();
    await Promise.all(ownerIds.map(async ownerId => {
      try {
        const userDoc = await getDoc(doc(db, 'users', ownerId));
        if (userDoc.exists()) profiles.set(ownerId, userDoc.data() as UserProfile);
      } catch { /* ignore */ }
    }));
    setOwnerProfiles(profiles);
  };

  const handleFavoriteToggle = async (itemId: string) => {
    if (!user) { navigate('/login'); return; }
    try {
      const newStatus = await toggleFavorite(itemId, user.uid);
      setFavorites(prev => {
        const next = new Set(prev);
        newStatus ? next.add(itemId) : next.delete(itemId);
        return next;
      });
      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, favoriteCount: (item.favoriteCount || 0) + (newStatus ? 1 : -1) }
          : item
      ));
    } catch {
      setError('Failed to update favorite status');
    }
  };

  const getOwnerProfile = (ownerId: string) => ownerProfiles.get(ownerId);
  const getOwnerInitials = (ownerId: string): string => {
    const p = ownerProfiles.get(ownerId);
    if (!p) return '?';
    return `${p.firstName?.charAt(0) || ''}${p.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const categories = Array.from(new Set(items.map(item => item.category)));

  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || selectedCondition !== 'all' || showTradeOffersOnly;

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedCondition('all');
    setShowTradeOffersOnly(false);
  };

  const totalViews = items.reduce((sum, item) => sum + (item.viewCount || 0), 0);
  const totalFavorites = items.reduce((sum, item) => sum + (item.favoriteCount || 0), 0);
  const totalInterest = items.reduce((sum, item) => sum + (item.swipeInterestCount || 0), 0);

  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex-1 w-full flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner message="Loading items..." size="lg" />
      </div>
    );
  }

  return (
    <PageTransition variant="page">
      <div className="flex-1 w-full">
        <div className="container mx-auto px-4 py-6 max-w-7xl">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-accent via-accent-dark to-primary bg-clip-text text-transparent dark:from-primary-light dark:via-primary dark:to-accent-dark leading-tight pb-0.5">
                My Listings
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary dark:text-gray-400 mt-1">
                {items.length > 0
                  ? `${items.length} ${items.length === 1 ? 'item' : 'items'} listed`
                  : 'No items yet — add your first listing!'}
              </p>

              {/* Stat chips */}
              {items.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 rounded-full text-xs font-medium text-text-secondary dark:text-gray-400 shadow-sm">
                    <svg className="w-3.5 h-3.5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {totalViews.toLocaleString()} views
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 rounded-full text-xs font-medium text-text-secondary dark:text-gray-400 shadow-sm">
                    <svg className="w-3.5 h-3.5 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {totalFavorites.toLocaleString()} saves
                  </span>
                  {totalInterest > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 rounded-full text-xs font-medium text-text-secondary dark:text-gray-400 shadow-sm">
                      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      {totalInterest.toLocaleString()} trade interest
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* View mode toggle */}
              {items.length > 0 && (
                <div className="hidden sm:flex items-center bg-white/70 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-accent dark:bg-primary-light text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    title="List view"
                    className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-accent dark:bg-primary-light text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              )}

              <Button
                onClick={() => setShowAddForm(true)}
                className="hidden sm:flex items-center gap-2 !bg-gradient-to-r !from-accent !to-accent-dark dark:!from-primary-light dark:!to-primary hover:shadow-lg hover:shadow-accent/30 dark:hover:shadow-primary/30 transition-shadow"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Add Listing
              </Button>
            </div>
          </div>

          {error && <Alert variant="error" className="mb-6">{error}</Alert>}

          {/* ── Filter Bar ── */}
          <div className="mb-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-sm border border-white/20 dark:border-gray-700/50 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  type="text"
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Category and Condition inline */}
              <div className="flex gap-3 flex-shrink-0">
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-40"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>

                <Select
                  value={selectedCondition}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="w-36"
                >
                  <option value="all">All Conditions</option>
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </Select>
              </div>
            </div>

            {/* Active filter pills row */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                onClick={() => setShowTradeOffersOnly(!showTradeOffersOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${showTradeOffersOnly
                  ? 'bg-accent dark:bg-primary-light text-white border-transparent shadow-sm'
                  : 'bg-transparent text-text-secondary dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-accent dark:hover:border-primary-light'
                  }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Has trade interest
              </button>

              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 dark:bg-primary-light/10 text-accent dark:text-primary-light border border-accent/20 dark:border-primary-light/20"
                >
                  {selectedCategory}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {selectedCondition !== 'all' && (
                <button
                  onClick={() => setSelectedCondition('all')}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 dark:bg-primary-light/10 text-accent dark:text-primary-light border border-accent/20 dark:border-primary-light/20 capitalize"
                >
                  {selectedCondition.replace('-', ' ')}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="ml-auto text-xs text-text-secondary dark:text-gray-500 hover:text-accent dark:hover:text-primary-light transition-colors underline underline-offset-2"
                >
                  Clear all
                </button>
              )}

              {filteredItems.length > 0 && (
                <span className="ml-auto text-xs text-text-secondary dark:text-gray-500">
                  {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}
                </span>
              )}
            </div>
          </div>

          {/* ── Empty State ── */}
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent/10 to-primary/10 dark:from-primary-light/10 dark:to-accent/10 border-2 border-dashed border-accent/30 dark:border-primary-light/30 flex items-center justify-center animate-pulse">
                  <svg className="w-10 h-10 text-accent/60 dark:text-primary-light/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-text dark:text-gray-100 mb-1.5">
                {hasActiveFilters ? 'No matching items' : 'Nothing here yet'}
              </h3>
              <p className="text-sm text-text-secondary dark:text-gray-400 mb-6 max-w-xs">
                {hasActiveFilters
                  ? 'Try adjusting your filters or searching for something different.'
                  : 'Start listing items you want to trade. It only takes a minute!'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {hasActiveFilters ? (
                  <Button onClick={clearAllFilters} variant="outline">Clear Filters</Button>
                ) : (
                  <>
                    <Button onClick={() => setShowAddForm(true)}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Your First Item
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/swipe')}>
                      Explore Listings
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* ── Grid View ── */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pagedItems.map((item) => {
                    const isFavorited = favorites.has(item.id);
                    const ownerProfile = getOwnerProfile(item.ownerId);
                    const ownerInitials = getOwnerInitials(item.ownerId);
                    const hasTradeInterest = (item.swipeInterestCount || 0) > 0;

                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/listings/${item.id}`)}
                        className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:border-accent/40 dark:hover:border-primary-light/40 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col relative"
                      >
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
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}

                          {/* Gradient overlay */}
                          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

                          {/* Condition badge */}
                          <div className="absolute top-2 left-2 z-10">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize shadow-md ${getConditionBadgeClass(item.condition)}`}>
                              {item.condition.replace('-', ' ')}
                            </span>
                          </div>

                          {/* Image count */}
                          {item.images.length > 1 && (
                            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium rounded flex items-center gap-1 z-10">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {item.images.length}
                            </div>
                          )}

                          {/* Trade interest badge */}
                          {hasTradeInterest && (
                            <div className="absolute bottom-2 left-2 z-10">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded shadow-md">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                {item.swipeInterestCount} interested
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card content */}
                        <div className="p-3.5 flex flex-col flex-grow">
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 bg-accent/10 dark:bg-primary-light/20 text-accent dark:text-primary-light rounded text-[11px] font-semibold truncate max-w-[60%]">
                              {item.category}
                            </span>
                            <span className="text-[10px] text-text-secondary dark:text-gray-500 flex-shrink-0">
                              {getRelativeTime(item.createdAt)}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-text dark:text-gray-100 line-clamp-1 group-hover:text-accent dark:group-hover:text-primary-light transition-colors mb-1">
                            {item.title}
                          </h3>

                          <p className="text-text-secondary dark:text-gray-400 text-xs line-clamp-2 mb-3 flex-grow leading-relaxed">
                            {item.description}
                          </p>

                          {/* Stats row + owner */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-700">
                            {/* Owner avatar */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              {ownerProfile?.photoUrl ? (
                                <img src={ownerProfile.photoUrl} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-accent-dark dark:from-primary-light dark:to-primary flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">
                                  {ownerInitials}
                                </div>
                              )}
                              <span className="text-[10px] text-text-secondary dark:text-gray-500 truncate">
                                {ownerProfile ? `${ownerProfile.firstName} ${ownerProfile.lastName}` : 'You'}
                              </span>
                            </div>

                            {/* Micro stats */}
                            <div className="flex items-center gap-2">
                              {(item.viewCount || 0) > 0 && (
                                <span className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  {item.viewCount}
                                </span>
                              )}
                              {(item.favoriteCount || 0) > 0 && (
                                <span className="flex items-center gap-0.5 text-[10px] text-rose-400">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  {item.favoriteCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── List View ── */}
              {viewMode === 'list' && (
                <div className="flex flex-col gap-3">
                  {pagedItems.map((item) => {
                    const isFavorited = favorites.has(item.id);
                    const ownerProfile = getOwnerProfile(item.ownerId);
                    const ownerInitials = getOwnerInitials(item.ownerId);
                    const hasTradeInterest = (item.swipeInterestCount || 0) > 0;

                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/listings/${item.id}`)}
                        className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:border-accent/40 dark:hover:border-primary-light/40 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-row relative"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-28 sm:w-40 flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-700">
                          {item.images.length > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold capitalize shadow ${getConditionBadgeClass(item.condition)}`}>
                              {item.condition.replace('-', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex items-center px-2 py-0.5 bg-accent/10 dark:bg-primary-light/20 text-accent dark:text-primary-light rounded text-[11px] font-semibold">
                                {item.category}
                              </span>
                              {hasTradeInterest && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold rounded">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                  {item.swipeInterestCount} interested
                                </span>
                              )}
                              <span className="text-[10px] text-text-secondary dark:text-gray-500 ml-auto flex-shrink-0">
                                {getRelativeTime(item.createdAt)}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-text dark:text-gray-100 group-hover:text-accent dark:group-hover:text-primary-light transition-colors line-clamp-1 mb-1">
                              {item.title}
                            </h3>
                            <p className="text-xs text-text-secondary dark:text-gray-400 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {ownerProfile?.photoUrl ? (
                                <img src={ownerProfile.photoUrl} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-accent to-accent-dark dark:from-primary-light dark:to-primary flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0">
                                  {ownerInitials}
                                </div>
                              )}
                              <span className="text-[10px] text-text-secondary dark:text-gray-500 truncate">
                                {ownerProfile ? `${ownerProfile.firstName} ${ownerProfile.lastName}` : 'You'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {(item.viewCount || 0) > 0 && (
                                <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  {item.viewCount}
                                </span>
                              )}
                              {(item.favoriteCount || 0) > 0 && (
                                <span className="flex items-center gap-1 text-[11px] text-rose-400">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                  {item.favoriteCount}
                                </span>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleFavoriteToggle(item.id); }}
                                className={`p-1 rounded-full transition-colors ${isFavorited ? 'text-rose-500' : 'text-gray-300 hover:text-rose-400'}`}
                              >
                                <svg className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredItems.length > PAGE_SIZE && (
                <div className="mt-8 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredItems.length / PAGE_SIZE)}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile FAB */}
        <button
          onClick={() => setShowAddForm(true)}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-accent to-accent-dark dark:from-primary-light dark:to-primary text-white rounded-full shadow-lg shadow-accent/40 hover:shadow-xl hover:shadow-accent/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center z-40"
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
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-text dark:text-gray-100">Add New Listing</h2>
                  <p className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">Fill in the details of your item</p>
                </div>
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
    </PageTransition>
  );
}