import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DEMO_DATA, DEMO_ITEMS, DEMO_USERS, DEMO_TRADE_OFFERS, DEMO_CONVERSATIONS, DEMO_MESSAGES, DEMO_NOTIFICATIONS } from './demoData';

/**
 * Property-Based Tests for Demo Data Validation
 * 
 * These tests verify that demo data meets the requirements for the enhanced demo presentation.
 */

describe('Demo Data Validation - Property Tests', () => {
  // Feature: enhanced-demo-presentation, Property 12: Demo Data Image URLs
  // Validates: Requirements 5.5
  describe('Property 12: Demo Data Image URLs', () => {
    it('should have non-empty image URLs for all items', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEMO_ITEMS),
          (item) => {
            // All items must have at least one image
            expect(item.images).toBeDefined();
            expect(item.images.length).toBeGreaterThan(0);
            
            // All image URLs must be non-empty strings
            item.images.forEach((imageUrl) => {
              expect(imageUrl).toBeDefined();
              expect(typeof imageUrl).toBe('string');
              expect(imageUrl.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have non-empty image URLs for all notifications', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEMO_NOTIFICATIONS),
          (notification) => {
            if (notification.type === 'trade_offer') {
              const data = notification.data as any;
              
              // Trade offer notifications must have image URLs
              expect(data.tradeAnchorImage).toBeDefined();
              expect(typeof data.tradeAnchorImage).toBe('string');
              expect(data.tradeAnchorImage.length).toBeGreaterThan(0);
              
              expect(data.targetItemImage).toBeDefined();
              expect(typeof data.targetItemImage).toBe('string');
              expect(data.targetItemImage.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have non-empty photo URLs for all users', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEMO_USERS),
          (user) => {
            // All demo users must have photo URLs
            expect(user.photoUrl).toBeDefined();
            expect(user.photoUrl).not.toBeNull();
            expect(typeof user.photoUrl).toBe('string');
            expect(user.photoUrl!.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-demo-presentation, Property 13: Demo Data Timestamp Realism
  // Validates: Requirements 5.6
  describe('Property 13: Demo Data Timestamp Realism', () => {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    it('should have realistic timestamps for all items', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEMO_ITEMS),
          (item) => {
            const itemTimestamp = item.createdAt.toMillis();
            
            // Timestamp should be within the past 30 days
            expect(itemTimestamp).toBeGreaterThanOrEqual(thirtyDaysAgo);
            expect(itemTimestamp).toBeLessThanOrEqual(now + 1000); // Allow 1 second buffer
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have realistic timestamps for all users', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEMO_USERS),
          (user) => {
            const userTimestamp = user.createdAt.toMillis();
            
            // Timestamp should be within the past 30 days
            expect(userTimestamp).toBeGreaterThanOrEqual(thirtyDaysAgo);
            expect(userTimestamp).toBeLessThanOrEqual(now + 1000);
            
            // Photo and location update timestamps should also be realistic
            if (user.lastPhotoUpdate) {
              const photoTimestamp = user.lastPhotoUpdate.toMillis();
              expect(photoTimestamp).toBeGreaterThanOrEqual(thirtyDaysAgo);
              expect(photoTimestamp).toBeLessThanOrEqual(now + 1000);
            }
            
            if (user.lastLocationUpdate) {
              const locationTimestamp = user.lastLocationUpdate.toMillis();
              expect(locationTimestamp).toBeGreaterThanOrEqual(thirtyDaysAgo);
              expect(locationTimestamp).toBeLessThanOrEqual(now + 1000);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have realistic timestamps for all trade offers', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEMO_TRADE_OFFERS),
          (tradeOffer) => {
            const createdTimestamp = tradeOffer.createdAt.toMillis();
            const updatedTimestamp = tradeOffer.updatedAt.toMillis();
            
            // Timestamps should be within the past 30 days
            expect(createdTimestamp).toBeGreaterThanOrEqual(thirtyDaysAgo);
            expect(createdTimestamp).toBeLessThanOrEqual(now + 1000);
            
            expect(updatedTimestamp).toBeGreaterThanOrEqual(thirtyDaysAgo);
            expect(updatedTimestamp).toBeLessThanOrEqual(now + 1000);
            
            // Updated timestamp should be >= created timestamp
            expect(updatedTimestamp).toBeGreaterThanOrEqual(createdTimestamp);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have realistic timestamps for all conversations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEMO_CONVERSATIONS),
          (conversation) => {
            const createdTimestamp = conversation.createdAt.toMillis();
            const lastMessageTimestamp = conversation.lastMessageAt.toMillis();
            
            // Timestamps should be within the past 30 days
            expect(createdTimestamp).toBeGreaterThanOrEqual(thirtyDaysAgo);
            expect(createdTimestamp).toBeLessThanOrEqual(now + 1000);
            
            expect(lastMessageTimestamp).toBeGreaterThanOrEqual(thirtyDaysAgo);
            expect(lastMessageTimestamp).toBeLessThanOrEqual(now + 1000);
            
            // Last message timestamp should be >= created timestamp
            expect(lastMessageTimestamp).toBeGreaterThanOrEqual(createdTimestamp);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have realistic timestamps for all messages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEMO_MESSAGES),
          (message) => {
            const messageTimestamp = message.createdAt.toMillis();
            
            // Timestamp should be within the past 30 days
            expect(messageTimestamp).toBeGreaterThanOrEqual(thirtyDaysAgo);
            expect(messageTimestamp).toBeLessThanOrEqual(now + 1000);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have realistic timestamps for all notifications', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...DEMO_NOTIFICATIONS),
          (notification) => {
            const notificationTimestamp = notification.createdAt.toMillis();
            
            // Timestamp should be within the past 30 days
            expect(notificationTimestamp).toBeGreaterThanOrEqual(thirtyDaysAgo);
            expect(notificationTimestamp).toBeLessThanOrEqual(now + 1000);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Demo Data Structure - Unit Tests', () => {
  it('should have at least 3 items', () => {
    expect(DEMO_ITEMS.length).toBeGreaterThanOrEqual(3);
  });

  it('should have at least 2 user profiles', () => {
    expect(DEMO_USERS.length).toBeGreaterThanOrEqual(2);
  });

  it('should have trade offer data linking items and users', () => {
    expect(DEMO_TRADE_OFFERS.length).toBeGreaterThan(0);
    
    DEMO_TRADE_OFFERS.forEach((offer) => {
      // Verify trade offer links to valid items
      const tradeAnchorItem = DEMO_ITEMS.find(item => item.id === offer.tradeAnchorId);
      const targetItem = DEMO_ITEMS.find(item => item.id === offer.targetItemId);
      
      expect(tradeAnchorItem).toBeDefined();
      expect(targetItem).toBeDefined();
      
      // Verify trade offer links to valid users
      const offeringUser = DEMO_USERS.find(user => user.uid === offer.offeringUserId);
      const tradeAnchorOwner = DEMO_USERS.find(user => user.uid === offer.tradeAnchorOwnerId);
      const targetItemOwner = DEMO_USERS.find(user => user.uid === offer.targetItemOwnerId);
      
      expect(offeringUser).toBeDefined();
      expect(tradeAnchorOwner).toBeDefined();
      expect(targetItemOwner).toBeDefined();
    });
  });

  it('should have conversation data with at least 4 messages', () => {
    expect(DEMO_CONVERSATIONS.length).toBeGreaterThan(0);
    
    DEMO_CONVERSATIONS.forEach((conversation) => {
      const conversationMessages = DEMO_MESSAGES.filter(
        msg => msg.conversationId === conversation.id
      );
      
      expect(conversationMessages.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('should have all required fields for items', () => {
    DEMO_ITEMS.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.ownerId).toBeDefined();
      expect(item.title).toBeDefined();
      expect(item.description).toBeDefined();
      expect(item.category).toBeDefined();
      expect(item.condition).toBeDefined();
      expect(item.images).toBeDefined();
      expect(item.status).toBeDefined();
      expect(item.createdAt).toBeDefined();
    });
  });

  it('should have all required fields for users', () => {
    DEMO_USERS.forEach((user) => {
      expect(user.uid).toBeDefined();
      expect(user.firstName).toBeDefined();
      expect(user.lastName).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.location).toBeDefined();
      expect(user.coordinates).toBeDefined();
      expect(user.eligible_to_match).toBeDefined();
      expect(user.createdAt).toBeDefined();
    });
  });

  it('should export complete DEMO_DATA object', () => {
    expect(DEMO_DATA).toBeDefined();
    expect(DEMO_DATA.users).toBe(DEMO_USERS);
    expect(DEMO_DATA.items).toBe(DEMO_ITEMS);
    expect(DEMO_DATA.tradeOffers).toBe(DEMO_TRADE_OFFERS);
    expect(DEMO_DATA.conversations).toBe(DEMO_CONVERSATIONS);
    expect(DEMO_DATA.messages).toBe(DEMO_MESSAGES);
    expect(DEMO_DATA.notifications).toBe(DEMO_NOTIFICATIONS);
  });
});
