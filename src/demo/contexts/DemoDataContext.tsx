import React, { createContext, useContext, ReactNode } from 'react';
import { Item } from '../../types/item';
import { UserProfile } from '../../types/user';
import { 
  TradeOffer, 
  Conversation, 
  Message, 
  Notification 
} from '../../types/swipe-trading';
import {
  DEMO_USERS,
  DEMO_ITEMS,
  DEMO_TRADE_OFFERS,
  DEMO_CONVERSATIONS,
  DEMO_MESSAGES,
  DEMO_MESSAGES_ALT,
  DEMO_NOTIFICATIONS
} from '../demoData';

/**
 * DemoData Interface
 * 
 * Defines the structure of all mock data available in the demo context.
 */
export interface DemoData {
  items: Item[];
  users: UserProfile[];
  tradeOffers: TradeOffer[];
  conversations: Conversation[];
  messages: Message[];
  messagesAlt: Message[];
  notifications: Notification[];
}

/**
 * Demo Data Context
 * 
 * Provides mock data to all demo components without prop drilling.
 */
const DemoDataContext = createContext<DemoData | null>(null);

/**
 * DemoDataProvider Props
 */
interface DemoDataProviderProps {
  children: ReactNode;
}

/**
 * DemoDataProvider Component
 * 
 * Wraps children with demo data context, making all mock data
 * available to descendant components via the useDemoData hook.
 */
export const DemoDataProvider: React.FC<DemoDataProviderProps> = ({ children }) => {
  const demoData: DemoData = {
    items: DEMO_ITEMS,
    users: DEMO_USERS,
    tradeOffers: DEMO_TRADE_OFFERS,
    conversations: DEMO_CONVERSATIONS,
    messages: DEMO_MESSAGES,
    messagesAlt: DEMO_MESSAGES_ALT,
    notifications: DEMO_NOTIFICATIONS
  };

  return (
    <DemoDataContext.Provider value={demoData}>
      {children}
    </DemoDataContext.Provider>
  );
};

/**
 * useDemoData Hook
 * 
 * Custom hook for consuming demo data context.
 * Throws an error if used outside of DemoDataProvider.
 * 
 * @returns DemoData object containing all mock data
 * @throws Error if used outside DemoDataProvider
 */
export const useDemoData = (): DemoData => {
  const context = useContext(DemoDataContext);
  
  if (context === null) {
    throw new Error('useDemoData must be used within a DemoDataProvider');
  }
  
  return context;
};
