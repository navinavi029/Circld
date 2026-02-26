import { renderHook } from '@testing-library/react';
import { DemoDataProvider, useDemoData } from './DemoDataContext';
import { 
  DEMO_USERS, 
  DEMO_ITEMS, 
  DEMO_TRADE_OFFERS, 
  DEMO_CONVERSATIONS, 
  DEMO_MESSAGES, 
  DEMO_NOTIFICATIONS 
} from '../demoData';

describe('DemoDataContext', () => {
  describe('DemoDataProvider', () => {
    it('should provide demo data to children', () => {
      const { result } = renderHook(() => useDemoData(), {
        wrapper: DemoDataProvider
      });

      expect(result.current).toBeDefined();
      expect(result.current.items).toEqual(DEMO_ITEMS);
      expect(result.current.users).toEqual(DEMO_USERS);
      expect(result.current.tradeOffers).toEqual(DEMO_TRADE_OFFERS);
      expect(result.current.conversations).toEqual(DEMO_CONVERSATIONS);
      expect(result.current.messages).toEqual(DEMO_MESSAGES);
      expect(result.current.notifications).toEqual(DEMO_NOTIFICATIONS);
    });

    it('should provide at least 3 items', () => {
      const { result } = renderHook(() => useDemoData(), {
        wrapper: DemoDataProvider
      });

      expect(result.current.items.length).toBeGreaterThanOrEqual(3);
    });

    it('should provide at least 2 users', () => {
      const { result } = renderHook(() => useDemoData(), {
        wrapper: DemoDataProvider
      });

      expect(result.current.users.length).toBeGreaterThanOrEqual(2);
    });

    it('should provide trade offers linking items and users', () => {
      const { result } = renderHook(() => useDemoData(), {
        wrapper: DemoDataProvider
      });

      expect(result.current.tradeOffers.length).toBeGreaterThan(0);
      
      const tradeOffer = result.current.tradeOffers[0];
      expect(tradeOffer.tradeAnchorId).toBeDefined();
      expect(tradeOffer.targetItemId).toBeDefined();
      expect(tradeOffer.tradeAnchorOwnerId).toBeDefined();
      expect(tradeOffer.targetItemOwnerId).toBeDefined();
    });

    it('should provide conversations with at least 4 messages', () => {
      const { result } = renderHook(() => useDemoData(), {
        wrapper: DemoDataProvider
      });

      expect(result.current.conversations.length).toBeGreaterThan(0);
      
      const conversation = result.current.conversations[0];
      const conversationMessages = result.current.messages.filter(
        msg => msg.conversationId === conversation.id
      );
      
      expect(conversationMessages.length).toBeGreaterThanOrEqual(4);
    });

    it('should provide items with all required fields', () => {
      const { result } = renderHook(() => useDemoData(), {
        wrapper: DemoDataProvider
      });

      result.current.items.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.title).toBeDefined();
        expect(item.description).toBeDefined();
        expect(item.category).toBeDefined();
        expect(item.condition).toBeDefined();
        expect(item.images).toBeDefined();
        expect(Array.isArray(item.images)).toBe(true);
        expect(item.status).toBeDefined();
        expect(item.createdAt).toBeDefined();
      });
    });

    it('should provide users with all required fields', () => {
      const { result } = renderHook(() => useDemoData(), {
        wrapper: DemoDataProvider
      });

      result.current.users.forEach(user => {
        expect(user.uid).toBeDefined();
        expect(user.firstName).toBeDefined();
        expect(user.lastName).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.location).toBeDefined();
        expect(user.coordinates).toBeDefined();
        expect(user.photoUrl).toBeDefined();
      });
    });
  });

  describe('useDemoData', () => {
    it('should throw error when used outside DemoDataProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      expect(() => {
        renderHook(() => useDemoData());
      }).toThrow('useDemoData must be used within a DemoDataProvider');

      console.error = originalError;
    });

    it('should return DemoData object with all properties', () => {
      const { result } = renderHook(() => useDemoData(), {
        wrapper: DemoDataProvider
      });

      expect(result.current).toHaveProperty('items');
      expect(result.current).toHaveProperty('users');
      expect(result.current).toHaveProperty('tradeOffers');
      expect(result.current).toHaveProperty('conversations');
      expect(result.current).toHaveProperty('messages');
      expect(result.current).toHaveProperty('notifications');
    });
  });
});
