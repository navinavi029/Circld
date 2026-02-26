import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner, Button, Card } from '../components/ui';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { PageTransition } from '../components/PageTransition';
import { getCardClasses, getPrimaryButtonClasses, getPageContainerClasses } from '../styles/designSystem';
import { usePageTitle } from '../hooks/usePageTitle';

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  usePageTitle(item ? item.title : 'Item Detail');

  console.log('ItemDetail component rendered, ID:', id);
  console.log('useParams result:', { id });
  console.log('user:', user);

  // Early return test to see if component is mounting
  if (!id) {
    console.error('No ID in params!');
    return (
      <div className="min-h-screen bg-red-500 flex items-center justify-center">
        <div className="text-white text-2xl">NO ID FOUND</div>
      </div>
    );
  }

  useEffect(() => {
    async function fetchItemAndOwner() {
      console.log('fetchItemAndOwner called with ID:', id);

      if (!id) {
        console.error('Item ID is missing');
        setError('Item ID is missing');
        setLoading(false);
        return;
      }

      console.log('Fetching item with ID:', id);

      try {
        // Fetch item
        const itemDoc = await getDoc(doc(db, 'items', id));

        console.log('Item doc exists:', itemDoc.exists());

        if (!itemDoc.exists()) {
          setError('Item not found');
          setLoading(false);
          return;
        }

        const itemData = { id: itemDoc.id, ...itemDoc.data() } as Item;
        console.log('Item data:', itemData);
        setItem(itemData);

        // Fetch owner profile
        console.log('Fetching owner with ID:', itemData.ownerId);
        const ownerDoc = await getDoc(doc(db, 'users', itemData.ownerId));
        if (ownerDoc.exists()) {
          const ownerData = ownerDoc.data() as UserProfile;
          console.log('Owner data:', ownerData);
          setOwner(ownerData);
        } else {
          console.warn('Owner not found');
        }

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching item:', err);
        setError(err.message || 'Failed to load item');
        setLoading(false);
      }
    }

    fetchItemAndOwner();
  }, [id]);

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'like-new':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'good':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'fair':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'poor':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'unavailable':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="flex-1 w-full flex items-center justify-center py-20">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner message="Loading item..." size="lg" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    console.log('Rendering error state:', { error, hasItem: !!item });
    return (
      <div className="flex-1 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card variant="elevated">
            <div className="p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-red-500 dark:text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-text dark:text-gray-100 mb-2">
                {error || 'Item not found'}
              </h2>
              <p className="text-text-secondary dark:text-gray-400 mb-6">
                The item you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/listings')} variant="primary">
                Back to Listings
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === item.ownerId;

  console.log('Rendering main content, item:', item.title);

  return (
    <PageTransition variant="page">
      <div className="flex-1 w-full">
        <div className={getPageContainerClasses('lg')}>
          {/* Back Button */}
          <button
            onClick={() => navigate('/listings')}
            className="inline-flex items-center text-accent dark:text-primary-light hover:text-accent-dark dark:hover:text-primary transition-colors mb-6 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Listings
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image Gallery - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <div className={getCardClasses('standard', 'normal') + ' overflow-hidden'}>
                {/* Main Image */}
                <div className="relative aspect-[16/10] bg-gray-100 dark:bg-gray-900">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[selectedImageIndex]}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-24 h-24 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Image Counter */}
                  {item.images && item.images.length > 0 && (
                    <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white rounded-lg text-sm font-medium">
                      {selectedImageIndex + 1} / {item.images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {item.images && item.images.length > 1 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {item.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                            ? 'border-accent dark:border-primary-light ring-2 ring-accent/20 dark:ring-primary-light/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                          <img
                            src={image}
                            alt={`${item.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description Card - Below images on mobile/tablet */}
              <div className={getCardClasses('standard', 'normal') + ' mt-6'}>
                <h2 className="text-lg font-semibold text-text dark:text-gray-100 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-accent dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </h2>
                <p className="text-text-secondary dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Item Details Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Main Info Card */}
              <div className={getCardClasses('standard', 'normal')}>
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(item.status)}`}>
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="4" />
                    </svg>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                  {isOwner && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-xs font-medium">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Your Item
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-text dark:text-gray-100 mb-4 leading-tight">
                  {item.title}
                </h1>

                {/* Details Grid */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-text-secondary dark:text-gray-400 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Category
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 bg-accent/10 dark:bg-primary-light/20 text-accent dark:text-primary-light rounded-md text-sm font-medium">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-sm text-text-secondary dark:text-gray-400 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Condition
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${getConditionColor(item.condition)}`}>
                      {item.condition.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-text-secondary dark:text-gray-400 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Posted
                    </span>
                    <span className="text-sm text-text dark:text-gray-100 font-medium">
                      {item.createdAt.toDate().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {!isOwner && item.status === 'available' && (
                    <Button variant="primary" size="lg" className={`w-full ${getPrimaryButtonClasses(true)}`}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      Request Item
                    </Button>
                  )}
                  {isOwner && (
                    <>
                      <Button
                        variant="primary"
                        size="lg"
                        className={`w-full ${getPrimaryButtonClasses(true)}`}
                        onClick={() => navigate(`/listings/edit/${item.id}`)}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Item
                      </Button>
                      <Button variant="outline" size="lg" className="w-full">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Item
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Owner Info Card */}
              {owner && (
                <div className={getCardClasses('standard', 'normal')}>
                  <h2 className="text-sm font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-4">
                    Listed By
                  </h2>
                  <div className="flex items-start space-x-3">
                    {owner.photoUrl ? (
                      <img
                        src={owner.photoUrl}
                        alt={`${owner.firstName} ${owner.lastName}`}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-full ${getPrimaryButtonClasses()} flex items-center justify-center ring-2 ring-gray-100 dark:ring-gray-700`}>
                        <span className="text-white text-lg font-semibold">
                          {owner.firstName.charAt(0)}{owner.lastName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text dark:text-gray-100 truncate">
                        {owner.firstName} {owner.lastName}
                      </p>
                      {owner.location && (
                        <p className="text-sm text-text-secondary dark:text-gray-400 flex items-center mt-1">
                          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{owner.location}</span>
                        </p>
                      )}
                      {!isOwner && (
                        <button className="mt-3 text-sm text-accent dark:text-primary-light hover:text-accent-dark dark:hover:text-primary font-medium flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          View Profile
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
