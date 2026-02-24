import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTradeOffersForUser, acceptTradeOffer } from '../services/tradeOfferService';
import { createConversation } from '../services/messagingService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { TradeOffer } from '../types/swipe-trading';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Pagination } from '../components/ui/Pagination';
import { PageTransition } from '../components/PageTransition';

interface EnrichedTradeOffer extends TradeOffer {
  tradeAnchorTitle: string;
  tradeAnchorImage: string;
  targetItemTitle: string;
  targetItemImage: string;
  offeringUserName: string;
}

export function TradeOffers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<EnrichedTradeOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
      const enrichedOffers = await Promise.all(
        tradeOffers.map(async (offer) => {
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
            };
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

  if (offers.length === 0) {
    return (
      <PageTransition variant="page">
        <div className="flex-1 w-full flex flex-col">
          <div className="container mx-auto px-4 py-6 max-w-7xl flex-1 flex flex-col">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-accent via-accent-dark to-primary bg-clip-text text-transparent dark:from-primary-light dark:via-primary dark:to-accent-dark leading-tight pb-0.5">
                Trade Offers
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary dark:text-gray-400 mt-1">
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
                  className="!bg-gradient-to-r !from-accent !to-accent-dark dark:!from-primary-light dark:!to-primary hover:shadow-lg hover:shadow-accent/30 dark:hover:shadow-primary/30 transition-shadow"
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
        <div className="container mx-auto px-4 py-6 max-w-7xl flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-accent via-accent-dark to-primary bg-clip-text text-transparent dark:from-primary-light dark:via-primary dark:to-accent-dark leading-tight pb-0.5">
                Trade Offers
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary dark:text-gray-400 mt-1">
                {offers.length} {offers.length === 1 ? 'offer' : 'offers'} received
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {offers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((offer) => (
              <div
                key={offer.id}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-xl hover:shadow-primary/10 hover:border-accent/40 dark:hover:border-primary-light/40 transition-all duration-300"
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
                          onClick={() => handleAcceptOffer(offer)}
                          className="flex-1 !bg-gradient-to-r !from-accent !to-accent-dark dark:!from-primary-light dark:!to-primary hover:shadow-lg hover:shadow-accent/30 dark:hover:shadow-primary/30 transition-shadow"
                          isLoading={acceptingOfferId === offer.id}
                          disabled={acceptingOfferId !== null}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Accept & Message
                        </Button>
                        <Button
                          onClick={() => navigate(`/listings/${offer.targetItemId}`)}
                          variant="outline"
                          className="flex-1"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Your Item
                        </Button>
                      </>
                    )}
                    {(offer.status === 'accepted' || offer.status === 'completed') && (
                      <Button
                        onClick={() => handleViewConversation(offer)}
                        className="flex-1 !bg-gradient-to-r !from-accent !to-accent-dark dark:!from-primary-light dark:!to-primary hover:shadow-lg hover:shadow-accent/30 dark:hover:shadow-primary/30 transition-shadow"
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

          {offers.length > PAGE_SIZE && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(offers.length / PAGE_SIZE)}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </PageTransition >
  );
}
