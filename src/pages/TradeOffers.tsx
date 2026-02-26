import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTradeOffersForUser, acceptTradeOffer, declineTradeOffer } from '../services/tradeOfferService';
import { createConversation } from '../services/messagingService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { TradeOffer } from '../types/swipe-trading';
import { Item } from '../types/item';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { PageTransition } from '../components/PageTransition';
import { Modal } from '../components/ui/Modal';
import { Dropdown } from '../components/ui/Dropdown';
import { getPageTitleClasses, typography, getCardClasses, getPrimaryButtonClasses, getPageContainerClasses } from '../styles/designSystem';
import { usePageTitle } from '../hooks/usePageTitle';

interface EnrichedTradeOffer extends TradeOffer {
  tradeAnchorTitle: string;
  tradeAnchorImage: string;
  targetItemTitle: string;
  targetItemImage: string;
  offeringUserName: string;
  tradeAnchorItem?: Item;
  targetItem?: Item;
}

export function TradeOffers() {
  usePageTitle('Trade Offers');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<EnrichedTradeOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [decliningOfferId, setDecliningOfferId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<EnrichedTradeOffer | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [offerToDecline, setOfferToDecline] = useState<EnrichedTradeOffer | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');
  const [customDeclineReason, setCustomDeclineReason] = useState<string>('');

  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadOffers();
  }, [user, navigate]);

  const loadOffers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const tradeOffers = await getTradeOffersForUser(user.uid);

      // Enrich offers with item and user details
      const enrichedOffers: (EnrichedTradeOffer | null)[] = await Promise.all(
        tradeOffers.map(async (offer): Promise<EnrichedTradeOffer | null> => {
          try {
            // Fetch trade anchor item
            const tradeAnchorDoc = await getDoc(doc(db, 'items', offer.tradeAnchorId));
            const tradeAnchorData = tradeAnchorDoc.exists() ? tradeAnchorDoc.data() : null;

            // Fetch target item
            const targetItemDoc = await getDoc(doc(db, 'items', offer.targetItemId));
            const targetItemData = targetItemDoc.exists() ? targetItemDoc.data() : null;

            // Fetch offering user
            const offeringUserDoc = await getDoc(doc(db, 'users', offer.offeringUserId));
            const offeringUserData = offeringUserDoc.exists() ? offeringUserDoc.data() : null;

            return {
              ...offer,
              tradeAnchorTitle: tradeAnchorData?.title || 'Unknown Item',
              tradeAnchorImage: tradeAnchorData?.images?.[0] || '/placeholder-item.png',
              targetItemTitle: targetItemData?.title || 'Unknown Item',
              targetItemImage: targetItemData?.images?.[0] || '/placeholder-item.png',
              offeringUserName: offeringUserData
                ? `${offeringUserData.firstName || ''} ${offeringUserData.lastName || ''}`.trim() || 'Unknown User'
                : 'Unknown User',
              tradeAnchorItem: tradeAnchorData ? { id: offer.tradeAnchorId, ...tradeAnchorData } as Item : undefined,
              targetItem: targetItemData ? { id: offer.targetItemId, ...targetItemData } as Item : undefined,
            } as EnrichedTradeOffer;
          } catch (err) {
            console.error('Error enriching offer:', err);
            return null;
          }
        })
      );

      // Filter out failed enrichments and sort by date
      const validOffers = enrichedOffers
        .filter((offer): offer is EnrichedTradeOffer => offer !== null)
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });

      setOffers(validOffers);
    } catch (err) {
      console.error('Error loading trade offers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trade offers');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offer: EnrichedTradeOffer) => {
    if (!user) return;

    try {
      setAcceptingOfferId(offer.id);

      // Accept the trade offer
      await acceptTradeOffer(offer.id, user.uid);

      // Create or get conversation
      const conversation = await createConversation(offer.id, user.uid);

      // Navigate to the conversation
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      console.error('Error accepting trade offer:', err);
      alert(err instanceof Error ? err.message : 'Failed to accept offer');
    } finally {
      setAcceptingOfferId(null);
    }
  };

  const handleDeclineOffer = async (offerId: string) => {
    if (!user) return;

    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;

    // Open the decline modal
    setOfferToDecline(offer);
    setDeclineModalOpen(true);
  };

  const confirmDeclineOffer = async () => {
    if (!user || !offerToDecline) return;

    try {
      setDecliningOfferId(offerToDecline.id);

      // Decline the trade offer with optional reason
      const reason = declineReason === 'other' ? customDeclineReason : declineReason;
      await declineTradeOffer(offerToDecline.id, user.uid, reason || undefined);

      // Close modal and reset state
      setDeclineModalOpen(false);
      setOfferToDecline(null);
      setDeclineReason('');
      setCustomDeclineReason('');

      // Reload offers to reflect the change
      await loadOffers();
    } catch (err) {
      console.error('Error declining trade offer:', err);
      alert(err instanceof Error ? err.message : 'Failed to decline offer');
    } finally {
      setDecliningOfferId(null);
    }
  };

  const handleCompareItems = (offer: EnrichedTradeOffer) => {
    setSelectedOffer(offer);
    setCompareModalOpen(true);
  };

  const formatCondition = (condition: string) => {
    return condition.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleViewConversation = async (offer: EnrichedTradeOffer) => {
    if (!user) return;

    try {
      // Get or create conversation
      const conversation = await createConversation(offer.id, user.uid);
      navigate(`/messages/${conversation.id}`);
    } catch (err) {
      console.error('Error opening conversation:', err);
      alert(err instanceof Error ? err.message : 'Failed to open conversation');
    }
  };

  const formatOfferTime = (timestamp: any) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 shadow-sm flex-shrink-0">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800/50 shadow-sm flex-shrink-0">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800/50 shadow-sm flex-shrink-0">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Declined
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 shadow-sm flex-shrink-0">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 shadow-sm flex-shrink-0">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 w-full">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <LoadingSpinner message="Loading trade offers..." size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 w-full">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Error Loading Trade Offers
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <Button onClick={loadOffers} variant="primary">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort offers
  const filteredOffers = offers
    .filter(offer => {
      if (statusFilter === 'all') return true;
      return offer.status === statusFilter;
    })
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return sortBy === 'newest' ? bTime - aTime : aTime - bTime;
    });

  if (offers.length === 0) {
    return (
      <PageTransition variant="page">
        <div className="flex-1 w-full flex flex-col">
          <div className={getPageContainerClasses()}>
            <div className="mb-6">
              <h1 className={getPageTitleClasses()}>
                Trade Offers
              </h1>
              <p className={`${typography.subtitle} mt-1`}>
                No offers received yet
              </p>
            </div>
            
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center max-w-md">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent/10 to-primary/10 dark:from-primary-light/10 dark:to-accent/10 border-2 border-dashed border-accent/30 dark:border-primary-light/30 flex items-center justify-center animate-pulse mx-auto">
                    <svg className="w-12 h-12 text-accent/60 dark:text-primary-light/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-text dark:text-gray-100 mb-2">
                  No trade offers yet
                </h3>
                <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">
                  When someone is interested in your items, their offers will appear here
                </p>
                <Button 
                  onClick={() => navigate('/listings')} 
                  className={getPrimaryButtonClasses(true)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  View Your Listings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition variant="page">
      <div className="flex-1 w-full flex flex-col">
        <div className={getPageContainerClasses()}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={getPageTitleClasses()}>
                Trade Offers
              </h1>
              <p className={`${typography.subtitle} mt-1`}>
                {filteredOffers.length} {filteredOffers.length === 1 ? 'offer' : 'offers'} {statusFilter !== 'all' ? `(${statusFilter})` : ''}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Dropdown
                label="Filter by Status"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Offers' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'declined', label: 'Declined' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
            </div>
            <div className="flex-1">
              <Dropdown
                label="Sort by Date"
                value={sortBy}
                onChange={(value) => setSortBy(value as 'newest' | 'oldest')}
                options={[
                  { value: 'newest', label: 'Newest First' },
                  { value: 'oldest', label: 'Oldest First' },
                ]}
              />
            </div>
          </div>

          {filteredOffers.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center max-w-md">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent/10 to-primary/10 dark:from-primary-light/10 dark:to-accent/10 border-2 border-dashed border-accent/30 dark:border-primary-light/30 flex items-center justify-center animate-pulse mx-auto">
                    <svg className="w-12 h-12 text-accent/60 dark:text-primary-light/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-text dark:text-gray-100 mb-2">
                  No offers match your filters
                </h3>
                <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">
                  Try adjusting your filters to see more results
                </p>
                <Button 
                  onClick={() => {
                    setStatusFilter('all');
                    setSortBy('newest');
                  }} 
                  className={getPrimaryButtonClasses(true)}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOffers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((offer) => (
              <div
                key={offer.id}
                className={`${getCardClasses()} overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:border-accent/40 dark:hover:border-primary-light/40 transition-all duration-300`}
              >
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-accent to-accent-dark dark:from-primary-light dark:to-primary flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0 shadow-md">
                        {offer.offeringUserName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-bold text-text dark:text-gray-100 truncate">
                          {offer.offeringUserName}
                        </p>
                        <p className="text-xs text-text-secondary dark:text-gray-400">
                          {formatOfferTime(offer.createdAt)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(offer.status)}
                  </div>

                  {/* Trade Items */}
                  <div className="flex items-center gap-3 sm:gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    {/* Their Item (Trade Anchor) */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <img
                          src={offer.tradeAnchorImage}
                          alt={offer.tradeAnchorTitle}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shadow-md border-2 border-white dark:border-gray-700 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-accent dark:text-primary-light mb-1">
                            They offer
                          </p>
                          <p className="text-sm font-bold text-text dark:text-gray-100 line-clamp-2">
                            {offer.tradeAnchorTitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Swap Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-accent/10 to-primary/10 dark:from-primary-light/20 dark:to-accent/20 flex items-center justify-center border border-accent/20 dark:border-primary-light/30">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-accent dark:text-primary-light"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Your Item (Target) */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <img
                          src={offer.targetItemImage}
                          alt={offer.targetItemTitle}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shadow-md border-2 border-white dark:border-gray-700 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-primary dark:text-primary-light mb-1">
                            Your item
                          </p>
                          <p className="text-sm font-bold text-text dark:text-gray-100 line-clamp-2">
                            {offer.targetItemTitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {offer.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleCompareItems(offer)}
                          className={`flex-1 ${getPrimaryButtonClasses(true)}`}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Compare Items
                        </Button>
                        <Button
                          onClick={() => handleDeclineOffer(offer.id)}
                          variant="outline"
                          className="flex-1 border-2 border-red-500 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
                          isLoading={decliningOfferId === offer.id}
                          disabled={acceptingOfferId !== null || decliningOfferId !== null}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Decline Offer
                        </Button>
                      </>
                    )}
                    {(offer.status === 'accepted' || offer.status === 'completed') && (
                      <Button
                        onClick={() => handleViewConversation(offer)}
                        className={`flex-1 ${getPrimaryButtonClasses(true)}`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        View Conversation
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}

          {filteredOffers.length > PAGE_SIZE && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredOffers.length / PAGE_SIZE)}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      <Modal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        title="Compare Trade Items"
        size="xl"
      >
        {selectedOffer && selectedOffer.tradeAnchorItem && selectedOffer.targetItem && (
          <div className="space-y-4 md:space-y-6">
            {/* Header Row with User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-accent/10 via-accent/15 to-accent/20 dark:from-accent/20 dark:via-accent/25 dark:to-accent/30 rounded-2xl border-2 border-accent/30 dark:border-accent/40 shadow-lg">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent-dark dark:from-primary-light dark:to-primary flex items-center justify-center text-white font-bold text-xl shadow-xl">
                  {selectedOffer.offeringUserName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-accent dark:text-accent-light uppercase tracking-wider mb-1">
                    They Offer
                  </p>
                  <p className="text-xl font-bold text-text dark:text-gray-100">
                    {selectedOffer.offeringUserName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 bg-gradient-to-br from-primary/10 via-primary/15 to-primary/20 dark:from-primary/20 dark:via-primary/25 dark:to-primary/30 rounded-2xl border-2 border-primary/30 dark:border-primary/40 shadow-lg">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark dark:from-primary-light dark:to-primary flex items-center justify-center text-white font-bold text-xl shadow-xl">
                  You
                </div>
                <div>
                  <p className="text-sm font-bold text-primary dark:text-primary-light uppercase tracking-wider mb-1">
                    Your Item
                  </p>
                  <p className="text-xl font-bold text-text dark:text-gray-100">
                    Your Listing
                  </p>
                </div>
              </div>
            </div>

            {/* Images Row - Larger and more prominent */}
            <div className="grid grid-cols-2 gap-8">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent-dark dark:from-accent-light dark:to-accent rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <img
                  src={selectedOffer.tradeAnchorImage}
                  alt={selectedOffer.tradeAnchorTitle}
                  className="relative w-full h-96 object-cover rounded-2xl shadow-2xl border-4 border-white dark:border-gray-800"
                />
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-dark dark:from-primary-light dark:to-primary rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <img
                  src={selectedOffer.targetItemImage}
                  alt={selectedOffer.targetItemTitle}
                  className="relative w-full h-96 object-cover rounded-2xl shadow-2xl border-4 border-white dark:border-gray-800"
                />
              </div>
            </div>

            {/* Title Row */}
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-3">Title</p>
                <h3 className="text-2xl font-bold text-text dark:text-gray-100 leading-tight">
                  {selectedOffer.tradeAnchorTitle}
                </h3>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-3">Title</p>
                <h3 className="text-2xl font-bold text-text dark:text-gray-100 leading-tight">
                  {selectedOffer.targetItemTitle}
                </h3>
              </div>
            </div>

            {/* Category & Condition Row */}
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md space-y-4">
                <div>
                  <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-3">Category</p>
                  <span className="inline-flex px-4 py-2 text-base font-bold rounded-xl bg-accent/15 text-accent dark:bg-accent/25 dark:text-accent-light border-2 border-accent/30 shadow-sm">
                    {selectedOffer.tradeAnchorItem.category}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-3">Condition</p>
                  <span className="inline-flex px-4 py-2 text-base font-bold rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 shadow-sm">
                    {formatCondition(selectedOffer.tradeAnchorItem.condition)}
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md space-y-4">
                <div>
                  <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-3">Category</p>
                  <span className="inline-flex px-4 py-2 text-base font-bold rounded-xl bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-light border-2 border-primary/30 shadow-sm">
                    {selectedOffer.targetItem.category}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-3">Condition</p>
                  <span className="inline-flex px-4 py-2 text-base font-bold rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 shadow-sm">
                    {formatCondition(selectedOffer.targetItem.condition)}
                  </span>
                </div>
              </div>
            </div>

            {/* Description Row */}
            <div className="grid grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-3">Description</p>
                <p className="text-base text-text dark:text-gray-300 leading-relaxed">
                  {selectedOffer.tradeAnchorItem.description}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-3">Description</p>
                <p className="text-base text-text dark:text-gray-300 leading-relaxed">
                  {selectedOffer.targetItem.description}
                </p>
              </div>
            </div>

            {/* Additional Images Row */}
            {((selectedOffer.tradeAnchorItem.images && selectedOffer.tradeAnchorItem.images.length > 1) ||
              (selectedOffer.targetItem.images && selectedOffer.targetItem.images.length > 1)) && (
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                  <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-3">Additional Images</p>
                  {selectedOffer.tradeAnchorItem.images && selectedOffer.tradeAnchorItem.images.length > 1 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {selectedOffer.tradeAnchorItem.images.slice(1, 5).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${selectedOffer.tradeAnchorTitle} ${idx + 2}`}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:scale-105 transition-transform"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary dark:text-gray-500 italic">No additional images</p>
                  )}
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
                  <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider mb-3">Additional Images</p>
                  {selectedOffer.targetItem.images && selectedOffer.targetItem.images.length > 1 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {selectedOffer.targetItem.images.slice(1, 5).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${selectedOffer.targetItemTitle} ${idx + 2}`}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:scale-105 transition-transform"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary dark:text-gray-500 italic">No additional images</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons - More prominent */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t-2 border-gray-300 dark:border-gray-600">
              <Button
                onClick={() => {
                  setCompareModalOpen(false);
                  handleAcceptOffer(selectedOffer);
                }}
                className={`flex-1 text-lg py-4 ${getPrimaryButtonClasses(true)} shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all`}
                isLoading={acceptingOfferId === selectedOffer.id}
                disabled={acceptingOfferId !== null || decliningOfferId !== null}
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Accept Trade & Start Conversation
              </Button>
              <Button
                onClick={() => {
                  // Set the offer to decline before closing compare modal
                  const offer = offers.find(o => o.id === selectedOffer.id);
                  if (offer) {
                    setOfferToDecline(offer);
                    setDeclineModalOpen(true);
                  }
                  setCompareModalOpen(false);
                }}
                variant="outline"
                className="flex-1 text-lg py-4 border-2 border-red-500 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 hover:border-red-600 dark:hover:border-red-500 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                isLoading={decliningOfferId === selectedOffer.id}
                disabled={acceptingOfferId !== null || decliningOfferId !== null}
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Decline Offer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Decline Offer Modal */}
      <Modal
        isOpen={declineModalOpen}
        onClose={() => {
          setDeclineModalOpen(false);
          setOfferToDecline(null);
          setDeclineReason('');
          setCustomDeclineReason('');
        }}
        title="Decline Trade Offer"
        size="md"
      >
        {offerToDecline && (
          <div className="space-y-6">
            {/* Offer Summary */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-text-secondary dark:text-gray-400 mb-2">You're declining this offer:</p>
              <div className="flex items-center gap-4">
                <img
                  src={offerToDecline.tradeAnchorImage}
                  alt={offerToDecline.tradeAnchorTitle}
                  className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                />
                <div className="flex-1">
                  <p className="font-bold text-text dark:text-gray-100">{offerToDecline.tradeAnchorTitle}</p>
                  <p className="text-sm text-text-secondary dark:text-gray-400">from {offerToDecline.offeringUserName}</p>
                </div>
              </div>
            </div>

            {/* Decline Reason Selection */}
            <div>
              <label className="block text-sm font-bold text-text dark:text-gray-200 mb-3">
                Why are you declining? (Optional)
              </label>
              <div className="space-y-2">
                {[
                  { value: 'not-interested', label: 'Not interested in this item' },
                  { value: 'unfair-trade', label: 'Trade seems unfair' },
                  { value: 'item-unavailable', label: 'My item is no longer available' },
                  { value: 'better-offer', label: 'Received a better offer' },
                  { value: 'other', label: 'Other reason' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      declineReason === option.value
                        ? 'border-accent dark:border-accent-light bg-accent/10 dark:bg-accent/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="declineReason"
                      value={option.value}
                      checked={declineReason === option.value}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      className="w-4 h-4 text-accent dark:text-accent-light focus:ring-accent dark:focus:ring-accent-light"
                    />
                    <span className="text-sm font-medium text-text dark:text-gray-200">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Reason Input */}
            {declineReason === 'other' && (
              <div>
                <label className="block text-sm font-bold text-text dark:text-gray-200 mb-2">
                  Please specify your reason
                </label>
                <textarea
                  value={customDeclineReason}
                  onChange={(e) => setCustomDeclineReason(e.target.value)}
                  placeholder="Enter your reason for declining..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-text dark:text-gray-100 placeholder-text-secondary dark:placeholder-gray-500 focus:border-accent dark:focus:border-accent-light focus:ring-2 focus:ring-accent/20 dark:focus:ring-accent-light/20 transition-colors"
                />
              </div>
            )}

            {/* Warning Message */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-1">This action cannot be undone</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Once declined, the offer will be permanently rejected and the other user will be notified.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <Button
                onClick={() => {
                  setDeclineModalOpen(false);
                  setOfferToDecline(null);
                  setDeclineReason('');
                  setCustomDeclineReason('');
                }}
                variant="outline"
                className="flex-1"
                disabled={decliningOfferId !== null}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeclineOffer}
                className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
                isLoading={decliningOfferId === offerToDecline.id}
                disabled={decliningOfferId !== null || (declineReason === 'other' && !customDeclineReason.trim())}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Decline Offer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition >
  );
}
