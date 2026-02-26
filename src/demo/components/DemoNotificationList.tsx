import React, { useEffect, useRef, useState } from 'react';
import { TradeOfferNotificationData } from '../../types/swipe-trading';
import { useDemoData } from '../contexts/DemoDataContext';
import { executeNotificationAppearSimulation } from '../utils/simulatedInteractions';

/**
 * DemoNotificationList Component
 * 
 * Wrapper component that displays demo notifications with simulated appear interaction.
 * Uses useDemoData hook to get demo notifications and renders them with the same
 * styling as the real NotificationList component.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.7, 8.1, 8.2, 8.3
 */

interface DemoNotificationListProps {
  /** Delay in milliseconds before starting the notification appear simulation */
  simulationDelay?: number;
  /** Duration in milliseconds for the appear animation */
  simulationDuration?: number;
  /** Callback function when appear simulation completes */
  onSimulationComplete?: () => void;
  /** Whether to enable the simulated appear interaction */
  enableSimulation?: boolean;
}

export const DemoNotificationList: React.FC<DemoNotificationListProps> = ({
  simulationDelay = 1500,
  simulationDuration = 600,
  onSimulationComplete,
  enableSimulation = true,
}) => {
  const { notifications } = useDemoData();
  const notificationRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [, setIsVisible] = useState(!enableSimulation);

  useEffect(() => {
    if (!enableSimulation) {
      setIsVisible(true);
      return;
    }

    if (!notificationRef.current) return;

    // Execute notification appear simulation after mount
    cleanupRef.current = executeNotificationAppearSimulation(
      notificationRef.current,
      {
        delay: simulationDelay,
        duration: simulationDuration,
        onComplete: () => {
          setIsVisible(true);
          onSimulationComplete?.();
        },
      }
    );

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [simulationDelay, simulationDuration, onSimulationComplete, enableSimulation]);

  // No-op handlers for demo (interactions are simulated)
  const handleViewItem = (_itemId: string) => {
    // Demo mode - no actual navigation
  };

  const handleStartConversation = () => {
    // Demo mode - no actual navigation
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      {notifications.map(notification => {
        if (notification.type !== 'trade_offer') return null;

        const data = notification.data as TradeOfferNotificationData;

        return (
          <div
            key={notification.id}
            ref={notificationRef}
            className={`border-2 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:shadow-2xl ${
              notification.read 
                ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-primary dark:border-primary-light'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🎉</span>
                  <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    New Trade Offer!
                  </p>
                </div>
                <p className="text-base text-gray-700 dark:text-gray-300 font-medium">
                  {data.offeringUserName} wants to trade with you
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(notification.createdAt.toMillis()).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              {!notification.read && (
                <span className="inline-flex items-center justify-center w-3 h-3 bg-primary rounded-full shadow-lg animate-pulse"></span>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              {/* Their item (trade anchor) */}
              <div className="border-2 border-emerald-200 dark:border-emerald-700 rounded-xl p-3 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 shadow-md">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2 uppercase tracking-wide">They're offering:</p>
                <img
                  src={data.tradeAnchorImage}
                  alt={data.tradeAnchorTitle}
                  className="w-full h-28 object-cover rounded-lg mb-2 shadow-sm"
                />
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{data.tradeAnchorTitle}</p>
              </div>

              {/* Your item (target) */}
              <div className="border-2 border-purple-200 dark:border-purple-700 rounded-xl p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-md">
                <p className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-2 uppercase tracking-wide">For your:</p>
                <img
                  src={data.targetItemImage}
                  alt={data.targetItemTitle}
                  className="w-full h-28 object-cover rounded-lg mb-2 shadow-sm"
                />
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{data.targetItemTitle}</p>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => handleViewItem(data.tradeAnchorId)}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-accent to-accent-dark text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-accent/30 dark:hover:shadow-accent/40 transition-all duration-300 hover:-translate-y-0.5 text-sm"
              >
                View Item
              </button>
              <button
                onClick={handleStartConversation}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-primary/30 dark:hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 text-sm"
              >
                Accept & Chat
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
