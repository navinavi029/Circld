import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMessages, subscribeToMessages, markConversationAsRead, sendMessage } from '../services/messagingService';
import { completeTradeOffer, declineTradeOffer } from '../services/tradeOfferService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Message, Conversation, TradeOffer } from '../types/swipe-trading';
import { Item } from '../types/item';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

export function ConversationView() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  // Trade item details for header
  const [tradeAnchorTitle, setTradeAnchorTitle] = useState('');
  const [tradeAnchorImage, setTradeAnchorImage] = useState('');
  const [targetItemTitle, setTargetItemTitle] = useState('');
  const [targetItemImage, setTargetItemImage] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [tradeOffer, setTradeOffer] = useState<TradeOffer | null>(null);
  const [offerMakerName, setOfferMakerName] = useState('');

  // Message input state
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [completingTrade, setCompletingTrade] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState(false);
  const [cancellingTrade, setCancellingTrade] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [tradeAnchorItem, setTradeAnchorItem] = useState<Item | null>(null);
  const [targetItem, setTargetItem] = useState<Item | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || !conversationId) {
      navigate('/login');
      return;
    }

    loadConversation();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user, conversationId, navigate]);

  const loadConversation = async () => {
    if (!user || !conversationId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch conversation details
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));

      if (!conversationDoc.exists()) {
        setError('Conversation not found');
        setLoading(false);
        return;
      }

      const conversationData = {
        id: conversationDoc.id,
        ...conversationDoc.data(),
      } as Conversation;

      // Store conversation data
      setConversation(conversationData);

      // Validate user is a participant
      if (!conversationData.participantIds.includes(user.uid)) {
        setError('You are not authorized to view this conversation');
        setLoading(false);
        return;
      }

      // Fetch trade item details
      const tradeAnchorDoc = await getDoc(doc(db, 'items', conversationData.tradeAnchorId));
      const tradeAnchorData = tradeAnchorDoc.exists() ? tradeAnchorDoc.data() : null;
      setTradeAnchorTitle(tradeAnchorData?.title || 'Item');
      setTradeAnchorImage(tradeAnchorData?.images?.[0] || '/placeholder-item.png');
      if (tradeAnchorData) {
        setTradeAnchorItem({ id: conversationData.tradeAnchorId, ...tradeAnchorData } as Item);
      }

      const targetItemDoc = await getDoc(doc(db, 'items', conversationData.targetItemId));
      const targetItemData = targetItemDoc.exists() ? targetItemDoc.data() : null;
      setTargetItemTitle(targetItemData?.title || 'Item');
      setTargetItemImage(targetItemData?.images?.[0] || '/placeholder-item.png');
      if (targetItemData) {
        setTargetItem({ id: conversationData.targetItemId, ...targetItemData } as Item);
      }

      // Fetch partner details
      const partnerId = conversationData.participantIds.find(id => id !== user.uid);
      if (partnerId) {
        const partnerDoc = await getDoc(doc(db, 'users', partnerId));
        const partnerData = partnerDoc.exists() ? partnerDoc.data() : null;
        setPartnerName(
          partnerData
            ? `${partnerData.firstName || ''} ${partnerData.lastName || ''}`.trim() || 'Unknown User'
            : 'Unknown User'
        );
      }

      // Fetch trade offer details
      if (conversationData.tradeOfferId) {
        const tradeOfferDoc = await getDoc(doc(db, 'tradeOffers', conversationData.tradeOfferId));
        if (tradeOfferDoc.exists()) {
          const offerData = { id: tradeOfferDoc.id, ...tradeOfferDoc.data() } as TradeOffer;
          setTradeOffer(offerData);
          // Fetch the name of who made the offer
          const makerDoc = await getDoc(doc(db, 'users', offerData.offeringUserId));
          if (makerDoc.exists()) {
            const makerData = makerDoc.data();
            setOfferMakerName(
              `${makerData.firstName || ''} ${makerData.lastName || ''}`.trim() || 'Unknown User'
            );
          }
        }
      }

      // Fetch initial messages
      const initialMessages = await getMessages(conversationId, user.uid);
      setMessages(initialMessages);

      // Mark conversation as read
      await markConversationAsRead(conversationId, user.uid);

      // Subscribe to real-time updates
      unsubscribeRef.current = subscribeToMessages(
        conversationId,
        user.uid,
        (updatedMessages) => {
          setMessages(updatedMessages);
          // Mark as read when new messages arrive
          markConversationAsRead(conversationId, user.uid).catch(console.error);
        }
      );

      setLoading(false);
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !conversationId || !messageText.trim()) return;

    try {
      setSending(true);
      setSendError(null);

      const result = await sendMessage(conversationId, user.uid, messageText);

      // Show warning if provided
      if (result.warning) {
        setSendError(result.warning);
        // Clear warning after 5 seconds
        setTimeout(() => setSendError(null), 5000);
      }

      // Clear input on success
      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
      setSendError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleCompleteTrade = async () => {
    if (!user || !tradeOffer) return;

    // Check if user has already confirmed
    const hasConfirmed = tradeOffer.completedBy?.includes(user.uid);
    
    if (hasConfirmed) {
      return;
    }

    setShowCompletionModal(true);
  };

  const confirmCompleteTrade = async () => {
    if (!user || !tradeOffer) return;

    try {
      setCompletingTrade(true);

      const updatedOffer = await completeTradeOffer(tradeOffer.id, user.uid);

      // Update local trade offer state
      setTradeOffer(updatedOffer);
      setCompletionSuccess(true);

      // Close modal after a delay
      setTimeout(() => {
        setShowCompletionModal(false);
        setCompletionSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error completing trade:', err);
      setSendError(err instanceof Error ? err.message : 'Failed to complete trade');
    } finally {
      setCompletingTrade(false);
    }
  };

  const handleCancelTrade = () => {
    setShowCancelModal(true);
  };

  const confirmCancelTrade = async () => {
    if (!user || !tradeOffer) return;

    try {
      setCancellingTrade(true);

      const updatedOffer = await declineTradeOffer(tradeOffer.id, user.uid);

      // Update local trade offer state
      setTradeOffer(updatedOffer);
      setShowCancelModal(false);

      // Show success message
      setSendError(null);
    } catch (err) {
      console.error('Error cancelling trade:', err);
      setSendError(err instanceof Error ? err.message : 'Failed to cancel trade');
    } finally {
      setCancellingTrade(false);
    }
  };

  const formatCondition = (condition: string) => {
    return condition.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex-1 w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <LoadingSpinner variant="flow" message="Loading conversation..." size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
              Error Loading Conversation
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <Button onClick={() => navigate('/messages')} variant="primary">
              Back to Messages
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      {/* Header with trade item details */}
      <div className="bg-white/98 dark:bg-gray-800/98 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-700/80 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/messages')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 group"
              aria-label="Back to messages"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-primary dark:group-hover:text-primary-light transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="flex-1 flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="flex -space-x-2">
                  <div className="relative group">
                    <img
                      src={tradeAnchorImage || '/placeholder-item.png'}
                      alt={tradeAnchorTitle}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-item.png';
                      }}
                      className="w-10 h-10 rounded-lg object-cover border-2 border-white dark:border-gray-800 shadow-md transition-transform group-hover:scale-110"
                    />
                  </div>
                  <div className="relative group">
                    <img
                      src={targetItemImage || '/placeholder-item.png'}
                      alt={targetItemTitle}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-item.png';
                      }}
                      className="w-10 h-10 rounded-lg object-cover border-2 border-white dark:border-gray-800 shadow-md transition-transform group-hover:scale-110"
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                  {partnerName}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className="truncate max-w-[100px]">{tradeAnchorTitle}</span>
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span className="truncate max-w-[100px]">{targetItemTitle}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">

          {/* Disabled Conversation Banner */}
          {conversation?.status === 'disabled' && (
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl shadow-sm animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    This conversation is no longer active
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {conversation.disabledReason || 'This item is no longer available'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Offer Request Card */}
          {tradeOffer && (
            <div className="mb-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden animate-fadeIn">
              {/* Card header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary-light/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary dark:text-primary-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1">
                  Trade Offer
                </span>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-lg ${tradeOffer.status === 'completed'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : tradeOffer.status === 'accepted'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : tradeOffer.status === 'declined'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}
                >
                  {tradeOffer.status.charAt(0).toUpperCase() + tradeOffer.status.slice(1)}
                </span>
              </div>

              {/* Items being traded */}
              <div className="flex items-center gap-3 px-4 py-4">
                {/* Trade anchor (what the offering user is giving) */}
                <div className="flex-1 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <img
                    src={tradeAnchorImage || '/placeholder-item.png'}
                    alt={tradeAnchorTitle}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-item.png';
                    }}
                    className="w-16 h-16 rounded-lg object-cover shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{tradeAnchorTitle}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">by {offerMakerName}</p>
                  </div>
                </div>

                {/* Swap icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>

                {/* Target item (what they want in return) */}
                <div className="flex-1 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <img
                    src={targetItemImage || '/placeholder-item.png'}
                    alt={targetItemTitle}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-item.png';
                    }}
                    className="w-16 h-16 rounded-lg object-cover shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{targetItemTitle}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Requested</p>
                  </div>
                </div>
              </div>

              {/* Complete Trade Button */}
              {tradeOffer.status === 'accepted' && (
                <div className="px-4 pb-4 space-y-2.5">
                  {/* Show confirmation status if anyone has confirmed */}
                  {tradeOffer.completedBy && tradeOffer.completedBy.length > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <div className="flex items-start gap-2.5">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                            {tradeOffer.completedBy.includes(user?.uid || '') 
                              ? 'You confirmed. Waiting for the other party.'
                              : 'Other party confirmed. Please confirm to finalize.'}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                            {tradeOffer.completedBy.length} of 2 confirmations
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowCompareModal(true)}
                      variant="primary"
                      className="flex-1 text-sm py-2"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Compare & Confirm
                    </Button>
                    
                    <Button
                      onClick={handleCancelTrade}
                      variant="outline"
                      className="flex-1 text-sm py-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {tradeOffer.status === 'completed' && (
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Trade Completed</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-8 h-8 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Start the conversation
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Send a message to {partnerName} about your trade
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message, index) => {
                const isSent = message.senderId === user?.uid;
                const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
                const isLastInGroup = index === messages.length - 1 || messages[index + 1].senderId !== message.senderId;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isSent ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'} animate-fadeIn`}
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <div className={`flex items-end gap-2 max-w-[75%] ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar for non-sent messages */}
                      {!isSent && (
                        <div className={`w-7 h-7 flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-dark dark:from-primary-light dark:to-primary flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                            {partnerName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      )}
                      
                      <div className="relative group">
                        {/* Message bubble */}
                        <div
                          className={`rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200 ${
                            isSent
                              ? `bg-primary dark:bg-primary-light text-white ${
                                  isLastInGroup ? 'rounded-br-md' : ''
                                }`
                              : `bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 ${
                                  isLastInGroup ? 'rounded-bl-md' : ''
                                }`
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>
                          <div className={`flex items-center gap-1.5 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                            <p
                              className={`text-xs ${
                                isSent ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {formatMessageTime(message.createdAt)}
                            </p>
                            {isSent && message.readBy && message.readBy.length > 1 && (
                              <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        {/* Hover timestamp tooltip for desktop */}
                        {showAvatar && (
                          <div className={`absolute ${isSent ? 'right-0' : 'left-0'} -top-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}>
                            <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                              {message.createdAt?.toDate?.().toLocaleString() || 'Just now'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message input */}
      <div className="bg-white/98 dark:bg-gray-800/98 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-700/80 sticky bottom-0 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          {sendError && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-start gap-2 animate-fadeIn">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="flex-1">{sendError}</span>
              <button onClick={() => setSendError(null)} className="hover:scale-110 transition-transform">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={conversation?.status === 'disabled' ? 'This conversation is no longer active' : 'Type your message...'}
                rows={1}
                className="w-full px-4 py-3 pr-14 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:ring-primary-light bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={sending || conversation?.status === 'disabled'}
                maxLength={2000}
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = '48px';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
              <div className="absolute bottom-2 right-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded transition-all ${messageText.length > 1900
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {messageText.length}/2000
                </span>
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={!messageText.trim() || sending || messageText.length > 2000 || conversation?.status === 'disabled'}
              className="h-12 px-6 rounded-xl shadow-sm hover:shadow transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </form>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center flex items-center justify-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd>
            <span>to send</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Shift + Enter</kbd>
            <span>for new line</span>
          </p>
        </div>
      </div>

      {/* Trade Completion Modal */}
      <Modal
        isOpen={showCompletionModal}
        onClose={() => !completingTrade && setShowCompletionModal(false)}
        title="Confirm Trade Completion"
        size="md"
        closeOnOverlayClick={!completingTrade}
        footer={
          !completionSuccess && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowCompletionModal(false)}
                disabled={completingTrade}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmCompleteTrade}
                isLoading={completingTrade}
                disabled={completingTrade}
              >
                Confirm Completion
              </Button>
            </>
          )
        }
      >
        {completionSuccess ? (
          <div className="text-center py-8">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl animate-scaleIn">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-text dark:text-gray-100 mb-3">
              {tradeOffer?.status === 'completed' ? '🎉 Trade Completed!' : '✓ Confirmation Recorded'}
            </h3>
            <p className="text-base text-text-secondary dark:text-gray-400 max-w-md mx-auto">
              {tradeOffer?.status === 'completed'
                ? 'Both parties have confirmed. The trade is now complete. Thank you for using our platform!'
                : 'Your confirmation has been recorded. We\'ll notify you when the other party confirms.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-inner">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary-light/20 dark:to-accent/20 rounded-xl blur-md" />
                <img
                  src={tradeAnchorImage || '/placeholder-item.png'}
                  alt={tradeAnchorTitle}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-item.png';
                  }}
                  className="relative w-20 h-20 rounded-xl object-cover shadow-lg"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text dark:text-gray-100 truncate">{tradeAnchorTitle}</p>
                <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">Your item</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary-light/20 dark:to-accent/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text dark:text-gray-100 truncate">{targetItemTitle}</p>
                <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">Their item</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-primary/20 dark:from-accent/20 dark:to-primary-light/20 rounded-xl blur-md" />
                <img
                  src={targetItemImage || '/placeholder-item.png'}
                  alt={targetItemTitle}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-item.png';
                  }}
                  className="relative w-20 h-20 rounded-xl object-cover shadow-lg"
                />
              </div>
            </div>

            <div className="p-5 bg-gradient-to-br from-amber-50 via-amber-50 to-orange-50 dark:from-amber-900/20 dark:via-amber-900/15 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-amber-900 dark:text-amber-100 mb-2">
                    Important Notice
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                    By confirming, you acknowledge that you have received the item and the trade is complete. Both parties must confirm before the trade is finalized.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-base font-medium text-text dark:text-gray-100">
                Are you sure you want to confirm this trade as completed?
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Trade Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => !cancellingTrade && setShowCancelModal(false)}
        title="Cancel Trade"
        size="md"
        closeOnOverlayClick={!cancellingTrade}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(false)}
              disabled={cancellingTrade}
            >
              Keep Trade
            </Button>
            <Button
              variant="primary"
              onClick={confirmCancelTrade}
              isLoading={cancellingTrade}
              disabled={cancellingTrade}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Cancel Trade
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="p-5 bg-gradient-to-br from-red-50 via-red-50 to-orange-50 dark:from-red-900/20 dark:via-red-900/15 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-red-900 dark:text-red-100 mb-2">
                  Warning
                </p>
                <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed">
                  Cancelling this trade will decline the offer and make your item available again. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-base font-medium text-text dark:text-gray-100">
              Are you sure you want to cancel this trade?
            </p>
          </div>
        </div>
      </Modal>

      {/* Compare Items Modal - Reusing the same design from TradeOffers */}
      <Modal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        title="Compare Trade Items"
        size="xl"
      >
        {tradeAnchorItem && targetItem && tradeOffer && (
          <div className="space-y-4 md:space-y-6">
            {/* Header Row with User Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="flex items-center gap-3 p-3 md:p-4 bg-gradient-to-br from-accent/10 via-accent/15 to-accent/20 dark:from-accent/20 dark:via-accent/25 dark:to-accent/30 rounded-xl border-2 border-accent/30 dark:border-accent/40 shadow-md">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-accent to-accent-dark dark:from-primary-light dark:to-primary flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg flex-shrink-0">
                  {offerMakerName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-accent dark:text-accent-light uppercase tracking-wider mb-0.5">
                    They Offer
                  </p>
                  <p className="text-sm md:text-base font-bold text-text dark:text-gray-100 truncate">
                    {offerMakerName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 md:p-4 bg-gradient-to-br from-primary/10 via-primary/15 to-primary/20 dark:from-primary/20 dark:via-primary/25 dark:to-primary/30 rounded-xl border-2 border-primary/30 dark:border-primary/40 shadow-md">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark dark:from-primary-light dark:to-primary flex items-center justify-center text-white font-bold text-base md:text-lg shadow-lg flex-shrink-0">
                  {partnerName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-primary dark:text-primary-light uppercase tracking-wider mb-0.5">
                    They Want
                  </p>
                  <p className="text-sm md:text-base font-bold text-text dark:text-gray-100 truncate">
                    {partnerName}
                  </p>
                </div>
              </div>
            </div>

            {/* Images Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-accent-dark dark:from-accent-light dark:to-accent rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <img
                  src={tradeAnchorImage}
                  alt={tradeAnchorTitle}
                  className="relative w-full h-48 md:h-64 lg:h-72 object-cover rounded-xl shadow-lg border-2 border-white dark:border-gray-800"
                />
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-primary-dark dark:from-primary-light dark:to-primary rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <img
                  src={targetItemImage}
                  alt={targetItemTitle}
                  className="relative w-full h-48 md:h-64 lg:h-72 object-cover rounded-xl shadow-lg border-2 border-white dark:border-gray-800"
                />
              </div>
            </div>

            {/* Title Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-1.5">Title</p>
                <h3 className="text-base md:text-lg font-bold text-text dark:text-gray-100 leading-tight">
                  {tradeAnchorTitle}
                </h3>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-1.5">Title</p>
                <h3 className="text-base md:text-lg font-bold text-text dark:text-gray-100 leading-tight">
                  {targetItemTitle}
                </h3>
              </div>
            </div>

            {/* Category & Condition Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm space-y-2.5">
                <div>
                  <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-1.5">Category</p>
                  <span className="inline-flex px-3 py-1.5 text-sm font-bold rounded-lg bg-accent/15 text-accent dark:bg-accent/25 dark:text-accent-light border border-accent/30 shadow-sm">
                    {tradeAnchorItem.category}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-1.5">Condition</p>
                  <span className="inline-flex px-3 py-1.5 text-sm font-bold rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 shadow-sm">
                    {formatCondition(tradeAnchorItem.condition)}
                  </span>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm space-y-2.5">
                <div>
                  <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-1.5">Category</p>
                  <span className="inline-flex px-3 py-1.5 text-sm font-bold rounded-lg bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-light border border-primary/30 shadow-sm">
                    {targetItem.category}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-1.5">Condition</p>
                  <span className="inline-flex px-3 py-1.5 text-sm font-bold rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 shadow-sm">
                    {formatCondition(targetItem.condition)}
                  </span>
                </div>
              </div>
            </div>

            {/* Description Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
                <p className="text-sm text-text dark:text-gray-300 leading-relaxed line-clamp-4">
                  {tradeAnchorItem.description}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
                <p className="text-sm text-text dark:text-gray-300 leading-relaxed line-clamp-4">
                  {targetItem.description}
                </p>
              </div>
            </div>

            {/* Additional Images Row */}
            {((tradeAnchorItem.images && tradeAnchorItem.images.length > 1) ||
              (targetItem.images && targetItem.images.length > 1)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-2">Additional Images</p>
                  {tradeAnchorItem.images && tradeAnchorItem.images.length > 1 ? (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {tradeAnchorItem.images.slice(1, 5).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${tradeAnchorTitle} ${idx + 2}`}
                          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg flex-shrink-0 border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-105 transition-transform"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary dark:text-gray-500 italic">No additional images</p>
                  )}
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wide mb-2">Additional Images</p>
                  {targetItem.images && targetItem.images.length > 1 ? (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {targetItem.images.slice(1, 5).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${targetItemTitle} ${idx + 2}`}
                          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg flex-shrink-0 border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-105 transition-transform"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary dark:text-gray-500 italic">No additional images</p>
                  )}
                </div>
              </div>
            )}

            {/* Confirmation Status Indicator */}
            {tradeOffer.status === 'accepted' && tradeOffer.completedBy && tradeOffer.completedBy.length > 0 && (
              <div className="p-3 md:p-4 bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 dark:from-blue-900/20 dark:via-blue-900/15 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl shadow-md">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">
                        Trade Completion Status
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {tradeOffer.completedBy.length} of 2 participants have confirmed
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    {/* Current User Status */}
                    <div className="flex flex-col items-center gap-2 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-blue-200 dark:border-blue-700">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tradeOffer.completedBy.includes(user?.uid || '')
                          ? 'bg-gradient-to-br from-green-500 to-green-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        {tradeOffer.completedBy.includes(user?.uid || '') ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs font-bold text-text dark:text-gray-300">You</p>
                      <p className={`text-xs font-semibold ${
                        tradeOffer.completedBy.includes(user?.uid || '')
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {tradeOffer.completedBy.includes(user?.uid || '') ? 'Confirmed' : 'Pending'}
                      </p>
                    </div>

                    {/* Other User Status */}
                    <div className="flex flex-col items-center gap-2 p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-blue-200 dark:border-blue-700">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tradeOffer.completedBy.some(id => id !== user?.uid)
                          ? 'bg-gradient-to-br from-green-500 to-green-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        {tradeOffer.completedBy.some(id => id !== user?.uid) ? (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs font-bold text-text dark:text-gray-300">{partnerName}</p>
                      <p className={`text-xs font-semibold ${
                        tradeOffer.completedBy.some(id => id !== user?.uid)
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {tradeOffer.completedBy.some(id => id !== user?.uid) ? 'Confirmed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {tradeOffer.status === 'accepted' && (
              <div className="flex gap-4 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                <Button
                  onClick={() => {
                    setShowCompareModal(false);
                    handleCompleteTrade();
                  }}
                  className="flex-1 text-lg py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={tradeOffer.completedBy?.includes(user?.uid || '')}
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {tradeOffer.completedBy?.includes(user?.uid || '') 
                    ? 'You Have Confirmed Completion'
                    : 'Confirm Trade Completion'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

