import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMessages, subscribeToMessages, markConversationAsRead, sendMessage } from '../services/messagingService';
import { completeTradeOffer } from '../services/tradeOfferService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Message, Conversation, TradeOffer } from '../types/swipe-trading';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Button } from './ui/Button';

export function ConversationView() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const targetItemDoc = await getDoc(doc(db, 'items', conversationData.targetItemId));
      const targetItemData = targetItemDoc.exists() ? targetItemDoc.data() : null;
      setTargetItemTitle(targetItemData?.title || 'Item');
      setTargetItemImage(targetItemData?.images?.[0] || '/placeholder-item.png');

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

      await sendMessage(conversationId, user.uid, messageText);

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

    const confirmed = window.confirm(
      'Are you sure you want to mark this trade as completed? This will close the trade offer.'
    );

    if (!confirmed) return;

    try {
      setCompletingTrade(true);

      await completeTradeOffer(tradeOffer.id, user.uid);

      // Update local trade offer state
      setTradeOffer({ ...tradeOffer, status: 'completed' });

      alert('Trade marked as completed successfully!');
    } catch (err) {
      console.error('Error completing trade:', err);
      alert(err instanceof Error ? err.message : 'Failed to complete trade');
    } finally {
      setCompletingTrade(false);
    }
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
          <LoadingSpinner message="Loading conversation..." size="lg" />
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
    <div className="flex-1 w-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with trade item details */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/messages')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Back to messages"
            >
              <svg
                className="w-6 h-6 text-text dark:text-gray-100"
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

            <div className="flex-1 flex items-center space-x-3">
              <div className="flex -space-x-2">
                <img
                  src={tradeAnchorImage}
                  alt={tradeAnchorTitle}
                  className="w-10 h-10 rounded-lg object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                />
                <img
                  src={targetItemImage}
                  alt={targetItemTitle}
                  className="w-10 h-10 rounded-lg object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-text dark:text-gray-100 truncate">
                  {partnerName}
                </h2>
                <p className="text-sm text-text-secondary dark:text-gray-400 truncate">
                  {tradeAnchorTitle} ↔ {targetItemTitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* Offer Request Card */}
          {tradeOffer && (
            <div className="mb-6 rounded-2xl border border-primary/30 dark:border-primary-light/30 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary-light/10 dark:to-primary/10 shadow-md overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 dark:bg-primary-light/15 border-b border-primary/20 dark:border-primary-light/20">
                <svg className="w-4 h-4 text-primary dark:text-primary-light flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span className="text-sm font-semibold text-primary dark:text-primary-light">
                  Trade Offer Request
                </span>
                <span
                  className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${tradeOffer.status === 'completed'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    : tradeOffer.status === 'accepted'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : tradeOffer.status === 'declined'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}
                >
                  {tradeOffer.status.charAt(0).toUpperCase() + tradeOffer.status.slice(1)}
                </span>
              </div>

              {/* Items being traded */}
              <div className="flex items-center gap-3 px-4 py-4">
                {/* Trade anchor (what the offering user is giving) */}
                <div className="flex-1 flex flex-col items-center text-center gap-1.5">
                  <img
                    src={tradeAnchorImage || '/placeholder-item.png'}
                    alt={tradeAnchorTitle}
                    className="w-16 h-16 rounded-xl object-cover shadow-sm border-2 border-white dark:border-gray-700"
                  />
                  <p className="text-xs font-medium text-text dark:text-gray-100 line-clamp-2">{tradeAnchorTitle}</p>
                  <p className="text-xs text-text-secondary dark:text-gray-400">Offered by {offerMakerName}</p>
                </div>

                {/* Swap icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 dark:bg-primary-light/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary dark:text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>

                {/* Target item (what they want in return) */}
                <div className="flex-1 flex flex-col items-center text-center gap-1.5">
                  <img
                    src={targetItemImage || '/placeholder-item.png'}
                    alt={targetItemTitle}
                    className="w-16 h-16 rounded-xl object-cover shadow-sm border-2 border-white dark:border-gray-700"
                  />
                  <p className="text-xs font-medium text-text dark:text-gray-100 line-clamp-2">{targetItemTitle}</p>
                  <p className="text-xs text-text-secondary dark:text-gray-400">Requested item</p>
                </div>
              </div>

              {/* Complete Trade Button */}
              {tradeOffer.status === 'accepted' && (
                <div className="px-4 pb-4">
                  <Button
                    onClick={handleCompleteTrade}
                    variant="primary"
                    className="w-full"
                    isLoading={completingTrade}
                    disabled={completingTrade}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Complete Trade
                  </Button>
                </div>
              )}

              {tradeOffer.status === 'completed' && (
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Trade Completed</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center py-12">
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-text-secondary dark:text-gray-400">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isSent = message.senderId === user?.uid;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-md ${isSent
                        ? 'bg-gradient-to-br from-primary to-primary-dark dark:from-primary-light dark:to-primary text-white rounded-br-none'
                        : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-text dark:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 rounded-bl-none'
                        }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${isSent
                          ? 'text-white/70'
                          : 'text-text-secondary dark:text-gray-400'
                          }`}
                      >
                        {formatMessageTime(message.createdAt)}
                      </p>
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
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {sendError && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {sendError}
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light bg-white/90 dark:bg-gray-700/90 text-text dark:text-gray-100 placeholder-text-secondary dark:placeholder-gray-400 resize-none transition-shadow duration-200"
                disabled={sending}
                maxLength={2000}
              />
              <div className="flex items-center justify-between mt-1 px-1">
                <p className="text-xs text-text-secondary dark:text-gray-400">
                  Press Enter to send, Shift+Enter for new line
                </p>
                <p
                  className={`text-xs ${messageText.length > 1900
                    ? 'text-error dark:text-error-light'
                    : 'text-text-secondary dark:text-gray-400'
                    }`}
                >
                  {messageText.length}/2000
                </p>
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={!messageText.trim() || sending || messageText.length > 2000}
              isLoading={sending}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
