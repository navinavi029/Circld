import React, { useEffect, useRef, useState } from 'react';
import { Message } from '../../types/swipe-trading';
import { useDemoData } from '../contexts/DemoDataContext';

/**
 * DemoConversationView Component
 * 
 * Wrapper component that displays a demo conversation with simulated message send interaction.
 * Uses useDemoData hook to get demo conversation and messages, then renders them with the same
 * styling as the real ConversationView component.
 * 
 * This component replicates the key visual elements of ConversationView without requiring
 * Firebase authentication or routing context.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.7, 8.1, 8.2, 8.3
 */

interface DemoConversationViewProps {
  /** Delay in milliseconds before starting the message send simulation */
  simulationDelay?: number;
  /** Callback function when message send simulation completes */
  onSimulationComplete?: () => void;
  /** Whether to enable the simulated message send interaction */
  enableSimulation?: boolean;
  /** Whether this is an instant display (revisiting the slide) */
  instant?: boolean;
}

export const DemoConversationView: React.FC<DemoConversationViewProps> = ({
  simulationDelay = 2500,
  onSimulationComplete,
  enableSimulation = true,
  instant = false,
}) => {
  const { conversations, messages, messagesAlt, items, users } = useDemoData();
  const typingIndicatorRef = useRef<HTMLDivElement>(null);
  const newMessageRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use alternative messages on revisit
  const demoMessages = instant ? messagesAlt : messages;
  
  // Get demo conversation and related data
  const demoConversation = conversations[0];
  const conversationMessages = demoMessages.filter(m => m.conversationId === demoConversation.id);
  
  // Get item details
  const tradeAnchorItem = items.find(i => i.id === demoConversation.tradeAnchorId);
  const targetItem = items.find(i => i.id === demoConversation.targetItemId);
  
  // Get partner details (assume current user is user 1, partner is user 2)
  const currentUserId = users[0].uid;
  const partnerId = demoConversation.participantIds.find(id => id !== currentUserId);
  const partner = users.find(u => u.uid === partnerId);

  // State for simulated conversation with multiple messages
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>(
    instant ? conversationMessages : conversationMessages.slice(0, 2)
  );
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [currentTypingUser, setCurrentTypingUser] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const animationCompletedRef = useRef(false);

  // Set mounted state after a brief delay to ensure we're on the slide
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Wait until component is mounted
    if (!isMounted) {
      return;
    }

    // If instant mode or simulation disabled, show all messages immediately
    if (instant || !enableSimulation) {
      setDisplayedMessages(conversationMessages);
      animationCompletedRef.current = true;
      return;
    }

    // If animation already completed, don't restart it
    if (animationCompletedRef.current) {
      return;
    }

    const timeouts: NodeJS.Timeout[] = [];

    // Message 3 (Alex's reply) - appears after initial delay
    const timeout1 = setTimeout(() => {
      setShowTypingIndicator(true);
      setCurrentTypingUser('demo-user-1');
    }, simulationDelay);
    timeouts.push(timeout1);

    const timeout2 = setTimeout(() => {
      setDisplayedMessages(prev => [...prev, conversationMessages[2]]);
      setShowTypingIndicator(false);
      setCurrentTypingUser(null);
    }, simulationDelay + 2000);
    timeouts.push(timeout2);

    // Message 4 (Jordan's reply) - appears after message 3
    const timeout3 = setTimeout(() => {
      setShowTypingIndicator(true);
      setCurrentTypingUser('demo-user-2');
    }, simulationDelay + 2500);
    timeouts.push(timeout3);

    const timeout4 = setTimeout(() => {
      setDisplayedMessages(prev => [...prev, conversationMessages[3]]);
      setShowTypingIndicator(false);
      setCurrentTypingUser(null);
      animationCompletedRef.current = true;
      onSimulationComplete?.();
    }, simulationDelay + 4000);
    timeouts.push(timeout4);

    // Cleanup on unmount
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [isMounted, simulationDelay, onSimulationComplete, enableSimulation, instant]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedMessages, showTypingIndicator]);

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

  return (
    <div className="flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto" style={{ height: '600px' }}>
      {/* Header with trade item details */}
      <div className="bg-white/98 dark:bg-gray-800/98 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-700/80 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="flex -space-x-2">
                <div className="relative group">
                  <img
                    src={tradeAnchorItem?.images?.[0] || '/placeholder-item.png'}
                    alt={tradeAnchorItem?.title || 'Item'}
                    className="w-10 h-10 rounded-lg object-cover border-2 border-white dark:border-gray-800 shadow-md"
                  />
                </div>
                <div className="relative group">
                  <img
                    src={targetItem?.images?.[0] || '/placeholder-item.png'}
                    alt={targetItem?.title || 'Item'}
                    className="w-10 h-10 rounded-lg object-cover border-2 border-white dark:border-gray-800 shadow-md"
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                {partner?.firstName} {partner?.lastName}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="truncate max-w-[100px]">{tradeAnchorItem?.title}</span>
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="truncate max-w-[100px]">{targetItem?.title}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 py-4">
          {displayedMessages.length === 0 && !showTypingIndicator ? (
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
                Send a message to {partner?.firstName} about your trade
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedMessages.map((message, index) => {
                const isSent = message.senderId === currentUserId;
                const showAvatar = index === 0 || displayedMessages[index - 1].senderId !== message.senderId;
                const isLastInGroup = index === displayedMessages.length - 1 || displayedMessages[index + 1]?.senderId !== message.senderId;
                const isNewMessage = index >= 2; // Messages at index 2 and 3 are animated
                
                return (
                  <div
                    key={message.id}
                    ref={isNewMessage && index === displayedMessages.length - 1 ? newMessageRef : undefined}
                    className={`flex ${isSent ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'} ${isNewMessage ? 'animate-slideUp' : 'animate-fadeIn'}`}
                    style={{ animationDelay: isNewMessage ? '0ms' : `${index * 20}ms` }}
                  >
                    <div className={`flex items-end gap-2 max-w-[75%] ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar for non-sent messages */}
                      {!isSent && (
                        <div className={`w-7 h-7 flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-dark dark:from-primary-light dark:to-primary flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                            {partner?.firstName?.charAt(0).toUpperCase()}
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {showTypingIndicator && currentTypingUser && (
                <div
                  ref={typingIndicatorRef}
                  className={`flex mt-2 animate-fadeIn ${currentTypingUser === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[75%] ${currentTypingUser === currentUserId ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="w-7 h-7 flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-dark dark:from-primary-light dark:to-primary flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                        {currentTypingUser === currentUserId 
                          ? users.find(u => u.uid === currentUserId)?.firstName?.charAt(0).toUpperCase()
                          : partner?.firstName?.charAt(0).toUpperCase()
                        }
                      </div>
                    </div>
                    <div className={`border rounded-2xl px-4 py-3 shadow-sm ${
                      currentTypingUser === currentUserId
                        ? 'bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40 rounded-br-md'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-bl-md'
                    }`}>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message input (disabled for demo) */}
      <div className="bg-white/98 dark:bg-gray-800/98 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-700/80 shadow-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value=""
                placeholder="Demo mode - messages are simulated"
                rows={1}
                className="w-full px-4 py-3 pr-14 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:ring-primary-light bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
                style={{ minHeight: '48px' }}
              />
            </div>
            <button
              disabled
              className="h-12 px-6 rounded-xl shadow-sm bg-primary dark:bg-primary-light text-white opacity-50 cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Demo mode - watch the simulated conversation
          </p>
        </div>
      </div>
    </div>
  );
};
