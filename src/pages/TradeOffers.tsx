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
import { Navigation } from '../components/Navigation';

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
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
            Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
            Declined
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <LoadingSpinner message="Loading trade offers..." size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation />
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-text dark:text-gray-100 mb-6">
            Trade Offers
          </h1>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg p-12 text-center border border-white/20 dark:border-gray-700/50">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
            <h3 className="text-xl font-semibold text-text dark:text-gray-100 mb-2">
              No trade offers yet
            </h3>
            <p className="text-text-secondary dark:text-gray-400 mb-6">
              When someone is interested in your items, their offers will appear here
            </p>
            <Button onClick={() => navigate('/listings')} variant="primary">
              View Your Listings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-text dark:text-gray-100">
            Trade Offers
          </h1>
          <div className="text-sm text-text-secondary dark:text-gray-400">
            {offers.length} {offers.length === 1 ? 'offer' : 'offers'}
          </div>
        </div>

        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark dark:from-primary-light dark:to-primary flex items-center justify-center text-white font-semibold">
                      {offer.offeringUserName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-text dark:text-gray-100">
                        {offer.offeringUserName}
                      </p>
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        {formatOfferTime(offer.createdAt)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(offer.status)}
                </div>

                {/* Trade Items */}
                <div className="flex items-center gap-4 mb-4">
                  {/* Their Item (Trade Anchor) */}
                  <div className="flex-1 flex flex-col items-center text-center">
                    <img
                      src={offer.tradeAnchorImage}
                      alt={offer.tradeAnchorTitle}
                      className="w-24 h-24 rounded-xl object-cover shadow-md border-2 border-white dark:border-gray-700 mb-2"
                    />
                    <p className="text-sm font-medium text-text dark:text-gray-100 line-clamp-2">
                      {offer.tradeAnchorTitle}
                    </p>
                    <p className="text-xs text-text-secondary dark:text-gray-400">
                      They offer
                    </p>
                  </div>

                  {/* Swap Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary-light/20 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-primary dark:text-primary-light"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Your Item (Target) */}
                  <div className="flex-1 flex flex-col items-center text-center">
                    <img
                      src={offer.targetItemImage}
                      alt={offer.targetItemTitle}
                      className="w-24 h-24 rounded-xl object-cover shadow-md border-2 border-white dark:border-gray-700 mb-2"
                    />
                    <p className="text-sm font-medium text-text dark:text-gray-100 line-clamp-2">
                      {offer.targetItemTitle}
                    </p>
                    <p className="text-xs text-text-secondary dark:text-gray-400">
                      Your item
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {offer.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleAcceptOffer(offer)}
                        variant="primary"
                        className="flex-1"
                        isLoading={acceptingOfferId === offer.id}
                        disabled={acceptingOfferId !== null}
                      >
                        Accept & Message
                      </Button>
                      <Button
                        onClick={() => navigate(`/listings/${offer.targetItemId}`)}
                        variant="secondary"
                        className="flex-1"
                      >
                        View Your Item
                      </Button>
                    </>
                  )}
                  {(offer.status === 'accepted' || offer.status === 'completed') && (
                    <Button
                      onClick={() => handleViewConversation(offer)}
                      variant="primary"
                      className="flex-1"
                    >
                      View Conversation
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
